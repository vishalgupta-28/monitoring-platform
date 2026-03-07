from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db, require_role
from app.db.models import User
from app.schemas.simulator import SimulationRunCreate, SimulationRunRead, SimulationScenarioRead
from app.services.simulator_service import simulator_service

router = APIRouter()


@router.get('/scenarios', response_model=list[SimulationScenarioRead])
async def list_scenarios(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)) -> list[SimulationScenarioRead]:
    return await simulator_service.list_scenarios(db)


@router.post('/runs', response_model=SimulationRunRead, status_code=status.HTTP_202_ACCEPTED)
async def run_simulation(
    payload: SimulationRunCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role('operator', 'admin')),
) -> SimulationRunRead:
    return await simulator_service.create_run(db, payload)
