import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ServiceBase(BaseModel):
    name: str
    slug: str = Field(pattern=r'^[a-z0-9-]+$')
    service_type: str
    base_url: str
    environment: str = 'production'
    status: str = 'healthy'
    tags: dict[str, str] = {}


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    name: str | None = None
    service_type: str | None = None
    base_url: str | None = None
    environment: str | None = None
    status: str | None = None
    tags: dict[str, str] | None = None


class ServiceRead(ServiceBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_by: uuid.UUID
    created_at: datetime
