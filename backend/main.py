from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import logging
import sys
import os
from backend.cache import cache

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import routes
try:
    from backend.routes import auth, profile, feed, swipe, test
    logger.info("✅ Routes imported successfully")
except Exception as e:
    logger.error(f"❌ Failed to import routes: {e}")
    sys.exit(1)


# ============ LIFESPAN HANDLER ============
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 50)
    logger.info("🚀 Dating App MVP Starting...")
    logger.info("📚 API Docs: http://localhost:8000/docs")
    logger.info("💚 Health: http://localhost:8000/health")
    logger.info("=" * 50)
    yield
    logger.info("🛑 Dating App MVP Shutting down...")
    try:
        await cache.close()
    except Exception as e:
        logger.warning(f"Error closing cache: {e}")


# Create FastAPI backend with lifespan
app = FastAPI(
    title="Dating App MVP",
    description="Telegram Mini App for dating (Tinder-like)",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# CORS middleware (allow all for MVP)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# ============ ROOT ROUTES (non‑conflicting) ============
@app.get("/health", tags=["info"])
async def health_check():
    return {"status": "ok", "service": "Dating App MVP", "version": "0.1.0"}

@app.get("/cache/stats", tags=["info"])
async def cache_stats():
    from backend.cache import cache
    return {"cache": cache.stats()}

@app.get("/info", tags=["info"])
async def info():
    return {
        "name": "Dating App MVP",
        "version": "0.1.0",
        "description": "Dating backend (like Tinder?) for Telegram",
        "features": [
            "User registration with Telegram ID",
            "Profile management with photos",
            "Personality test (OCEAN model)",
            "Smart matching algorithm",
            "Like/Dislike swipes",
            "Match notifications"
        ],
        "database": "Supabase (PostgreSQL)",
        "framework": "FastAPI"
    }


# ============ INCLUDE ROUTERS ============
app.include_router(auth.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(feed.router, prefix="/api")
app.include_router(swipe.router, prefix="/api")
app.include_router(test.router, prefix="/api")

logger.info("✅ All routers registered")

# ============ SERVE FRONTEND STATIC FILES ============
# This must come AFTER all API routes so that /api/* is not intercepted
frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
    logger.info(f"✅ Serving frontend from {frontend_path}")
else:
    logger.warning(f"⚠️ Frontend directory not found at {frontend_path}")


# ============ ERROR HANDLERS ============
@app.exception_handler(404)
async def not_found_handler(request, exc):
    # If the request path starts with /api, return JSON error
    if request.url.path.startswith("/api"):
        return JSONResponse(
            status_code=404,
            content={
                "error": "Not found",
                "path": request.url.path,
                "message": "API endpoint does not exist. Check /docs for available endpoints"
            }
        )
    # Otherwise, let the static frontend handle client-side routing
    # (or just return a simple HTML message)
    return JSONResponse(
        status_code=404,
        content={"error": "Not found", "message": "The requested resource does not exist."}
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"Internal server error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "message": "Something went wrong. Check server logs."}
    )


# ============ MAIN (for local development) ============
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )