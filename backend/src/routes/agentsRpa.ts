import { Router } from "express";
import { rpaAgents } from "../agents/rpa";
import { AgentScheduler } from "../agents/AgentScheduler";

const router = Router();
const scheduler = new AgentScheduler(rpaAgents);

router.get("/status", (req, res) => {
  res.json(scheduler.getAgentMetadata());
});

router.post("/trigger", async (req, res) => {
  await scheduler.runAllOnce();
  res.json({ status: "Triggered", results: scheduler.getAgentMetadata() });
});

export default router;