"""Auth routes — register, login, /me, logout, Emergent OAuth session exchange."""
import secrets
from fastapi import APIRouter, Depends, HTTPException, Response, Request
from ..auth import (
    hash_password, verify_password, make_jwt, require_user,
    exchange_emergent_session, upsert_oauth_user, store_session,
)
from ..db import db, utcnow
from ..models import RegisterIn, LoginIn, gen_id

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register")
async def register(payload: RegisterIn, response: Response):
    existing = await db.users.find_one({"email": payload.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_doc = {
        "user_id": gen_id("usr"),
        "email": payload.email,
        "name": payload.name,
        "picture": None,
        "auth_provider": "password",
        "password_hash": hash_password(payload.password),
        "created_at": utcnow().isoformat(),
    }
    await db.users.insert_one(user_doc.copy())
    token = make_jwt(user_doc["user_id"])
    response.set_cookie(
        key="session_token", value=token,
        httponly=True, secure=True, samesite="none", path="/",
        max_age=7 * 24 * 3600,
    )
    user_doc.pop("password_hash", None)
    return {"user": user_doc, "token": token}


@router.post("/login")
async def login(payload: LoginIn, response: Response):
    user = await db.users.find_one({"email": payload.email}, {"_id": 0})
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = make_jwt(user["user_id"])
    response.set_cookie(
        key="session_token", value=token,
        httponly=True, secure=True, samesite="none", path="/",
        max_age=7 * 24 * 3600,
    )
    user.pop("password_hash", None)
    return {"user": user, "token": token}


@router.get("/me")
async def me(user=Depends(require_user)):
    user.pop("password_hash", None)
    return user


@router.post("/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token") or ""
    if token:
        await db.user_sessions.delete_many({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


@router.post("/session")
async def emergent_session(request: Request, response: Response):
    """Exchange an Emergent session_id (from URL fragment) for a session_token cookie."""
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    profile = await exchange_emergent_session(session_id)
    user = await upsert_oauth_user(profile)
    session_token = profile.get("session_token") or secrets.token_urlsafe(32)
    await store_session(user["user_id"], session_token)
    response.set_cookie(
        key="session_token", value=session_token,
        httponly=True, secure=True, samesite="none", path="/",
        max_age=7 * 24 * 3600,
    )
    user.pop("password_hash", None)
    return {"user": user, "token": session_token}
