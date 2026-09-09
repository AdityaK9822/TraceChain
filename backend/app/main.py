import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from app.api import cases, feed, report, trace, trace_stream, wallet  # noqa: E402 (needs load_dotenv first)
from app.data.seed import seed_demo_cases  # noqa: E402
from app.db import init_db  # noqa: E402

app = FastAPI(
    title="CryptoTrace LEA API",
    description=(
        "Multi-chain wallet fund-flow tracing, laundering-pattern detection and "
        "exchange deposit-address attribution for law enforcement."
    ),
    version="0.1.0",
)

allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup() -> None:
    init_db()
    await seed_demo_cases()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


app.include_router(feed.router, prefix="/api")
app.include_router(trace.router, prefix="/api")
app.include_router(trace_stream.router, prefix="/api")
app.include_router(cases.router, prefix="/api")
app.include_router(report.router, prefix="/api")
app.include_router(wallet.router, prefix="/api")

