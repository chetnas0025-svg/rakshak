"""
Main FastAPI Application for Rakshak.
Production-grade configuration with CORS, structured logging, centralized error handling,
OpenAPI documentation, and lifecycle events.
"""
from contextlib import asynccontextmanager
import logging
import time
from pathlib import Path
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from rakshak.config import settings
from rakshak.backend.api.v1.endpoints import router as api_v1_router
from rakshak.modeling.model_store import ModelStore

ROOT_DIR = Path(__file__).resolve().parent.parent.parent

# Configure structured logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("rakshak.backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Rakshak service lifecycle...")
    # Check if model artifact exists; if not, train model on startup
    store = ModelStore()
    if not store.is_trained():
        logger.info("Model weights not detected. Executing initial training pipeline...")
        from rakshak.modeling.train import train_model
        train_model()
    else:
        logger.info("Loaded pre-trained model weights and metadata from artifacts.")

    yield
    logger.info("Shutting down Rakshak service...")


app = FastAPI(
    title="Rakshak - Hyper-Local Flash Flood Early Warning System",
    description=(
        "Production-grade Early Warning System for Hilly Regions (SIH26192, Ministry of Home Affairs / NDRF). "
        "Fuses real-time precipitation, terrain attributes, soil saturation, and explainable ML "
        "for ward-level risk scoring across Mandi, Kullu, and Kangra districts."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Path normalizer middleware: handles Vercel serverless /api/index.py prefix
@app.middleware("http")
async def normalize_api_path(request: Request, call_next):
    matched_path = request.headers.get("x-matched-path")
    if matched_path:
        clean_path = matched_path.split("?")[0]
        request.scope["path"] = clean_path
    elif "/api/index.py" in request.scope.get("path", ""):
        request.scope["path"] = request.scope["path"].replace("/api/index.py", "", 1) or "/"
    return await call_next(request)


# Request timing middleware & structured logging
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time = (time.perf_counter() - start_time) * 1000
    response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"
    return response


# OWASP Secure Headers Middleware (security-scanning-security-hardening)
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response


# Centralized exception handler: Prevent leaking raw tracebacks
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception processing %s: %s", request.url.path, str(exc), exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "INTERNAL_SERVER_ERROR",
            "message": "An internal error occurred while processing the early-warning request.",
            "path": request.url.path
        }
    )


# Mount API v1 router with both /api/v1 and /v1 prefixes for seamless local & serverless routing
app.include_router(api_v1_router, prefix="/api/v1")
app.include_router(api_v1_router, prefix="/v1")

DIST_DIR = ROOT_DIR / "frontend" / "dist"
if (DIST_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")


@app.get("/health", tags=["System"])
@app.get("/api/health", tags=["System"])
@app.get("/api/v1/health", tags=["System"])
async def health_check():
    """Health check endpoint for container orchestrators and uptime monitoring."""
    return {
        "status": "HEALTHY",
        "service": "Rakshak-Early-Warning-API",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }


@app.get("/api", tags=["System"])
async def api_info():
    return {
        "project": "Rakshak Early Warning System",
        "problem_statement": "SIH26192 - Ministry of Home Affairs (NDRF)",
        "docs_url": "/docs",
        "api_v1_prefix": "/api/v1"
    }


@app.get("/", tags=["System"])
async def root(request: Request):
    accept = request.headers.get("accept", "")
    if "text/html" in accept:
        index_file = DIST_DIR / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
    return {
        "project": "Rakshak Early Warning System",
        "problem_statement": "SIH26192 - Ministry of Home Affairs (NDRF)",
        "docs_url": "/docs",
        "api_v1_prefix": "/api/v1"
    }




if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "rakshak.backend.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=(settings.ENVIRONMENT == "development")
    )
