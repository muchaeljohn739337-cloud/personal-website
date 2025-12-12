import { getMongoDb } from '../mongoClient';

interface AIAgentLog {
  agentId: string;
  agentName: string;
  action: string;
  status: 'started' | 'completed' | 'failed';
  input: any;
  output?: any;
  error?: string;
  duration?: number;
  timestamp: Date;
}

export async function logAIAgentExecution(log: AIAgentLog) {
  const db = getMongoDb();
  if (!db) return;

  try {
    await db.collection('ai_agent_logs').insertOne({
      ...log,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('MongoDB AI agent log error:', error);
  }
}

export async function getAIAgentStats(agentId?: string) {
  const db = getMongoDb();
  if (!db) return null;

  try {
    const match = agentId ? { agentId } : {};
    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgDuration: { $avg: '$duration' },
        },
      },
    ];

    return await db.collection('ai_agent_logs').aggregate(pipeline).toArray();
  } catch (error) {
    console.error('MongoDB AI agent stats error:', error);
    return null;
  }
}

export async function getRecentAIAgentLogs(limit = 50) {
  const db = getMongoDb();
  if (!db) return [];

  try {
    return await db
      .collection('ai_agent_logs')
      .find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  } catch (error) {
    console.error('MongoDB get AI agent logs error:', error);
    return [];
  }
}
