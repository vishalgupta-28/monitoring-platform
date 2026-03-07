from fastapi import APIRouter

from app.api.v1.routes import alerts, auth, health, logs, metrics, services, simulator, traces, websocket

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(services.router, prefix="/services", tags=["services"])
api_router.include_router(metrics.router, prefix="/metrics", tags=["metrics"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
api_router.include_router(logs.router, prefix="/logs", tags=["logs"])
api_router.include_router(traces.router, prefix="/traces", tags=["traces"])
api_router.include_router(simulator.router, prefix="/simulator", tags=["simulator"])
api_router.include_router(websocket.router, prefix="/ws", tags=["websocket"])
