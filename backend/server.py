"""LaunchPilot — FastAPI entrypoint (runs from /app/backend)."""
import os
import sys
import logging
from pathlib import Path
from fastapi import FastAPI
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")
sys.path.insert(0, str(ROOT_DIR.parent))  # allow `import backend.xxx`

from backend.routes.auth_routes import router as auth_router  # noqa: E402
from backend.routes.projects import router as projects_router  # noqa: E402
from backend.routes.audits import router as audits_router  # noqa: E402
from backend.routes.leads import router as leads_router  # noqa: E402
from backend.routes.outreach import router as outreach_router  # noqa: E402
from backend.routes.crm import router as crm_router  # noqa: E402
from backend.routes.uploads import router as uploads_router  # noqa: E402
from backend.routes.monitoring import router as monitoring_router, start_scheduler  # noqa: E402
from backend.routes.notifications import router as notifications_router  # noqa: E402
from backend.routes.portal import router as portal_router  # noqa: E402
from backend.services.storage_service import init_storage  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="LaunchPilot API")


@app.get("/api")
async def root():
    return {"service": "launchpilot", "status": "ok"}


@app.get("/api/health")
async def health():
    return {"status": "ok"}


app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(audits_router)
app.include_router(leads_router)
app.include_router(outreach_router)
app.include_router(crm_router)
app.include_router(uploads_router)
app.include_router(monitoring_router)
app.include_router(notifications_router)
app.include_router(portal_router)


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    try:
        from backend.routes.leads import ensure_seed
        await ensure_seed()
        logger.info("Lead seed ensured.")
    except Exception as e:
        logger.warning(f"Seed error: {e}")
    try:
        init_storage()
    except Exception as e:
        logger.warning(f"Storage init error: {e}")
    try:
        start_scheduler()
    except Exception as e:
        logger.warning(f"Scheduler start error: {e}")
