"""Auth helpers: JWT password auth + Emergent Google OAuth session-cookie auth."""
import os
import bcrypt
import jwt
import httpx
from fastapi import Request, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from .db import db
from .models import User, gen_id

JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-me")
JWT_ALG = "HS256"
JWT_EXP_DAYS = 7
SESSION_EXP_DAYS = 7
EMERGENT_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False


def make_jwt(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXP_DAYS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_jwt(token: str) -> str | None:
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        return data.get("sub")
    except Exception:
        return None


async def exchange_emergent_session(session_id: str) -> dict:
    async with httpx.AsyncClient(timeout=15) as ac:
        r = await ac.get(EMERGENT_SESSION_URL, headers={"X-Session-ID": session_id})
        if r.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session id")
        return r.json()


async def upsert_oauth_user(profile: dict) -> dict:
    """Create or update a user from a Google profile dict."""
    email = profile["email"]
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        return existing
    user_doc = {
        "user_id": gen_id("usr"),
        "email": email,
        "name": profile.get("name") or email.split("@")[0],
        "picture": profile.get("picture"),
        "auth_provider": "google",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc.copy())
    return user_doc


async def store_session(user_id: str, session_token: str):
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_EXP_DAYS)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })


async def get_user_from_token(token: str) -> dict | None:
    """Token may be a JWT or an Emergent session_token."""
    if not token:
        return None
    # try JWT first
    user_id = decode_jwt(token)
    if user_id:
        return await db.users.find_one({"user_id": user_id}, {"_id": 0})
    # else try session_token
    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess:
        return None
    expires_at = sess.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at and expires_at < datetime.now(timezone.utc):
        return None
    return await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0})


async def require_user(request: Request) -> dict:
    """Auth dependency: checks cookie first, then Authorization header."""
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization") or ""
        if auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1].strip()
    user = await get_user_from_token(token) if token else None
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


async def optional_user(request: Request) -> dict | None:
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization") or ""
        if auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1].strip()
    return await get_user_from_token(token) if token else None
