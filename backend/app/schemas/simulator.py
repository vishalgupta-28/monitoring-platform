import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SimulationScenarioRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    category: str
    description: str
    config: dict


class SimulationRunCreate(BaseModel):
    scenario_id: uuid.UUID
    inputs: dict


class SimulationRunRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    scenario_id: uuid.UUID
    status: str
    inputs: dict
    results: dict
    created_at: datetime
