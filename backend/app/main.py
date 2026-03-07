from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.rate_limit import RateLimitMiddleware
from app.db.base import init_models
from app.services.bootstrap import bootstrap_demo_data
from app.services.kafka_service import kafka_service
from app.services.rabbitmq_service import rabbitmq_service
from app.websocket.manager import websocket_manager


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.auto_init_db:
        await init_models()
        await bootstrap_demo_data()

    await kafka_service.connect()
    await rabbitmq_service.connect()
    yield
    await kafka_service.close()
    await rabbitmq_service.close()
    await websocket_manager.shutdown()


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    openapi_url=f"{settings.api_v1_prefix}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware)

app.include_router(api_router, prefix=settings.api_v1_prefix)
