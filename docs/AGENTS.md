# RPA Monitoring Agents

## Overview

This module implements 9 RPA agents for platform monitoring, using a robust, extensible architecture:

- **BaseAgent**: Abstract class with metadata and status tracking.
- **AgentScheduler**: Schedules and runs all agents.
- **API Integration**: Each agent can make API calls or perform checks.
- **Express API**: Exposes `/api/agents/rpa/status` and `/api/agents/rpa/trigger`.
- **Tests**: Each agent is tested for correctness.

## Agents

| Name        | Description                              |
|-------------|------------------------------------------|
| RpaAgent1   | Checks external payment API health       |
| RpaAgent2   | Monitors transaction queue depth         |
| RpaAgent3   | Audits ledger consistency               |
| RpaAgent4   | Checks user authentication service       |
| RpaAgent5   | Monitors scheduled payout processes      |
| RpaAgent6   | Validates notification delivery API      |
| RpaAgent7   | Checks fraud detection system status     |
| RpaAgent8   | Monitors third-party KYC integration     |
| RpaAgent9   | Audits system resource utilization       |

## Usage

- Agents are scheduled every 5 minutes by default.
- API endpoints:
  - `GET /api/agents/rpa/status`: View current status of all agents.
  - `POST /api/agents/rpa/trigger`: Manually trigger all agents.

## Extensibility

To add a new agent:
1. Extend `BaseAgent` with `run()` implementation and description.
2. Import and add to `rpaAgents` array.

## Testing

Tests are in `backend/tests/agents/`. Run with:

```
npm test
```