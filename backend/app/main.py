from contextlib import asynccontextmanager
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from .core.database import init_db
from .api.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database
    await init_db()
    yield
    # Shutdown: cleanup if needed


app = FastAPI(
    title="GitHub Yearbook API",
    description="Backend service for GitHub Yearbook stats",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router, prefix="/api")


# Serve frontend static files
# Navigate 3 levels up from app/main.py to get to repo root
repo_root = Path(__file__).resolve().parents[2]
frontend_dist = repo_root / "web" / "dist"

if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=frontend_dist / "assets"), name="assets")
    # Add other static folders if needed (e.g. public)

    @app.get("/{rest_of_path:path}")
    async def serve_frontend(rest_of_path: str):
        """Serve SPA frontend for any non-API routes."""
        # Check if file exists (e.g. favicon.ico)
        file_path = frontend_dist / rest_of_path
        if file_path.is_file():
            return FileResponse(file_path)
        
        # Fallback to index.html for SPA routing
        return FileResponse(frontend_dist / "index.html")
