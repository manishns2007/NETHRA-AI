from fastapi import FastAPI
from app.api.routes import evidence, audit, intelligence, graph, analysis, enrichment
from app.core.database import engine, Base
from app.core.config import settings
from fastapi.middleware.cors import CORSMiddleware
import app.models  # noqa: F401 – ensures all models register with SQLAlchemy Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://nethraai.vercel.app",
        "https://nethra-ai.vercel.app",
        "https://nethra-ai-tau.vercel.app",
        "https://frontend-two-ruby-40.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:5174",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(evidence.router, prefix=f"{settings.API_V1_STR}/evidence", tags=["evidence"])
app.include_router(audit.router, prefix=f"{settings.API_V1_STR}/audit-logs", tags=["audit-logs"])
app.include_router(intelligence.router, prefix=f"{settings.API_V1_STR}/intelligence", tags=["intelligence"])
app.include_router(graph.router, prefix=f"{settings.API_V1_STR}/graph", tags=["graph"])
app.include_router(analysis.router, prefix=f"{settings.API_V1_STR}/analysis", tags=["analysis"])
app.include_router(enrichment.router, prefix=f"{settings.API_V1_STR}/enrichment", tags=["enrichment"])
from app.api.routes import assistant
app.include_router(assistant.router, prefix=f"{settings.API_V1_STR}/assistant", tags=["assistant"])

@app.get("/")
def root():
    return {"message": "Welcome to NETHRA AI API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

