import { Router, Request, Response } from 'express';
import {
  getSecurityMetrics,
  getThreatDatabase,
  getGlobalThreatScore,
  isLockdownActive,
  manualLockdown,
  manualRecovery,
  resetThreatScore,
  clearThreatDatabase,
} from '../security/comprehensive-shield';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const metrics = getSecurityMetrics();
    const globalScore = getGlobalThreatScore();
    const lockdown = isLockdownActive();
    res.json({
      success: true,
      data: {
        metrics,
        globalThreatScore: globalScore,
        lockdownActive: lockdown,
        status: lockdown ? 'LOCKDOWN' : globalScore > 50 ? 'ELEVATED' : 'NORMAL',
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve metrics', details: error.message });
  }
});

router.get('/threats', async (req: Request, res: Response) => {
  try {
    const threatDB = getThreatDatabase();
    const threats: any[] = [];
    threatDB.forEach((events, ip) => {
      threats.push({
        ip,
        eventCount: events.length,
        totalScore: events.reduce((sum, e) => sum + e.score, 0),
        highestSeverity: events.reduce((max, e) => {
          const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
          return severities.indexOf(e.severity) > severities.indexOf(max) ? e.severity : max;
        }, 'LOW'),
        lastIncident: events[events.length - 1],
        events: events.slice(-10),
      });
    });
    threats.sort((a, b) => b.totalScore - a.totalScore);
    res.json({ success: true, data: { totalIPs: threats.length, threats } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve threats', details: error.message });
  }
});

router.get('/threats/:ip', async (req: Request, res: Response) => {
  try {
    const { ip } = req.params;
    const threatDB = getThreatDatabase();
    const events = threatDB.get(ip) || [];
    if (events.length === 0) {
      return res.status(404).json({ success: false, error: 'No threats found for this IP' });
    }
    res.json({
      success: true,
      data: {
        ip,
        eventCount: events.length,
        totalScore: events.reduce((sum, e) => sum + e.score, 0),
        events,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve IP threats', details: error.message });
  }
});

router.post('/lockdown', async (req: Request, res: Response) => {
  try {
    await manualLockdown();
    res.json({ success: true, message: 'Lockdown activated', lockdownActive: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to activate lockdown', details: error.message });
  }
});

router.post('/recovery', async (req: Request, res: Response) => {
  try {
    await manualRecovery();
    res.json({ success: true, message: 'Lockdown deactivated', lockdownActive: false });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to deactivate lockdown', details: error.message });
  }
});

router.post('/reset-score', async (req: Request, res: Response) => {
  try {
    resetThreatScore();
    res.json({ success: true, message: 'Threat score reset', globalThreatScore: 0 });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to reset score', details: error.message });
  }
});

router.delete('/threats', async (req: Request, res: Response) => {
  try {
    clearThreatDatabase();
    res.json({ success: true, message: 'Threat database cleared' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to clear database', details: error.message });
  }
});

export default router;
