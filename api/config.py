"""Application configuration loaded from environment variables."""

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# Base paths
BASE_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = BASE_DIR / "uploads"
EXPORTS_DIR = BASE_DIR / "exports"
DATABASE_PATH = BASE_DIR / "clipbot.db"

# API Keys
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# AI defaults
DEFAULT_AI_PROVIDER = os.getenv("DEFAULT_AI_PROVIDER", "anthropic")
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "")  # empty = provider default

# Local AI (ollama etc.)
LOCAL_AI_BASE_URL = os.getenv("LOCAL_AI_BASE_URL", "http://localhost:11434/v1")
LOCAL_AI_MODEL = os.getenv("LOCAL_AI_MODEL", "llama3")

# CORS
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

# Server
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
