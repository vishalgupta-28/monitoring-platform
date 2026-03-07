import random

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import SimulationRun, SimulationScenario
from app.schemas.simulator import SimulationRunCreate, SimulationRunRead, SimulationScenarioRead
from app.services.rabbitmq_service import rabbitmq_service


class SimulatorService:
    async def list_scenarios(self, db: AsyncSession) -> list[SimulationScenarioRead]:
        result = await db.scalars(select(SimulationScenario).order_by(SimulationScenario.name.asc()))
        return [SimulationScenarioRead.model_validate(item) for item in result]

    async def create_run(self, db: AsyncSession, payload: SimulationRunCreate) -> SimulationRunRead:
        scenario = await db.get(SimulationScenario, payload.scenario_id)
        results = self._estimate_results(scenario.config, payload.inputs) if scenario else {}
        run = SimulationRun(
            scenario_id=payload.scenario_id,
            inputs=payload.inputs,
            results=results,
            status='completed',
        )
        db.add(run)
        await db.commit()
        await db.refresh(run)
        await rabbitmq_service.enqueue('simulator.runs', {'run_id': str(run.id), 'scenario_id': str(run.scenario_id)})
        return SimulationRunRead.model_validate(run)

    @staticmethod
    def _estimate_results(config: dict, inputs: dict) -> dict:
        load_multiplier = float(inputs.get('load_multiplier', 1.0))
        regions = int(inputs.get('regions', config.get('regions', 3)))
        base_qps = config.get('qps') or config.get('stream_start_qps') or config.get('rides_per_min', 1000)
        effective_qps = round(base_qps * load_multiplier)
        autoscaled_replicas = max(3, int(effective_qps / 8000) + regions)
        queue_lag_seconds = round(random.uniform(0.4, 4.8) * load_multiplier, 2)
        error_rate = round(min(18.0, random.uniform(0.2, 1.8) * load_multiplier), 2)
        return {
            'effective_qps': effective_qps,
            'autoscaled_replicas': autoscaled_replicas,
            'queue_lag_seconds': queue_lag_seconds,
            'estimated_error_rate': error_rate,
            'regional_capacity_headroom': round(max(4.0, 22.0 - load_multiplier * 7), 2),
        }


simulator_service = SimulatorService()
