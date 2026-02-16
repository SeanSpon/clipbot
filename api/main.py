"""ClipBot API - FastAPI application entry point.

Run with:
    cd api && uvicorn main:app --reload --port 8000
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import config
import database
from routers import projects, transcription, director, jobs, render
from services.storage import storage

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    # Startup
    logger.info("ClipBot API starting up...")
    storage.ensure_dirs()
    await database.init_db()
    logger.info("ClipBot API ready")
    yield
    # Shutdown
    logger.info("ClipBot API shutting down...")


app = FastAPI(
    title="ClipBot API",
    description="AI-powered video editing director and clip generator",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(projects.router, prefix="/api")
app.include_router(transcription.router, prefix="/api")
app.include_router(director.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(render.router, prefix="/api")


# Serve export files
app.mount("/exports", StaticFiles(directory=str(config.EXPORTS_DIR)), name="exports")


@app.get("/")
async def root():
    return {
        "name": "ClipBot API",
        "version": "0.1.0",
        "status": "running",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
