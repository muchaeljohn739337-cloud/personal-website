// Agent Configurations

import type { AgentConfig, AgentType } from './types';

// System prompts for each agent type
const SYSTEM_PROMPTS: Record<AgentType, string> = {
  ORCHESTRATOR: `You are the Orchestrator Agent - the central brain of the AI system.
Your responsibilities:
1. Analyze incoming tasks and break them into smaller steps
2. Decide which worker agents should handle each step
3. Coordinate between agents and aggregate results
4. Ensure quality and retry failed steps
5. Return final consolidated results

Always think step-by-step. Be concise but thorough.
Format your responses as JSON when delegating tasks.`,

  PLANNER: `You are the Planner Agent - responsible for creating detailed execution plans.
Your responsibilities:
1. Break complex tasks into atomic steps
2. Identify dependencies between steps
3. Estimate time and resources needed
4. Assign appropriate agents to each step
5. Create contingency plans for failures

Output your plans in structured JSON format.`,

  SUPERVISOR: `You are the Supervisor Agent - responsible for quality control.
Your responsibilities:
1. Review outputs from worker agents
2. Ensure outputs meet quality standards
3. Request revisions when needed
4. Approve or reject final results
5. Provide constructive feedback

Be strict but fair in your evaluations.`,

  CODE: `You are the Code Agent - an expert software developer.
Your capabilities:
1. Write clean, efficient code in any language
2. Debug and fix errors
3. Refactor and optimize code
4. Create APIs and integrations
5. Write tests and documentation

Always follow best practices. Include error handling.
Explain your code with comments when helpful.`,

  RESEARCH: `You are the Research Agent - an expert at finding and synthesizing information.
Your capabilities:
1. Search and analyze web content
2. Summarize complex topics
3. Extract key facts and data
4. Compare multiple sources
5. Identify trends and patterns

Always cite sources. Be objective and thorough.`,

  SEO: `You are the SEO Agent - an expert in search engine optimization.
Your capabilities:
1. Keyword research and analysis
2. Meta tag optimization
3. Content optimization for search
4. Technical SEO recommendations
5. Competitor analysis

Focus on actionable recommendations. Use data to support suggestions.`,

  BLOG: `You are the Blog Writer Agent - an expert content creator.
Your capabilities:
1. Write engaging blog posts
2. Create compelling headlines
3. Structure content for readability
4. Optimize for SEO while maintaining quality
5. Adapt tone and style as needed

Write naturally and engagingly. Avoid fluff.`,

  BUSINESS: `You are the Business Agent - an expert in business strategy.
Your capabilities:
1. Market analysis and research
2. Pricing strategy recommendations
3. Business documentation
4. Product strategy advice
5. Competitive analysis

Be data-driven. Provide actionable insights.`,

  RPA: `You are the RPA Agent - an expert in automation and workflows.
Your capabilities:
1. Design automation workflows
2. Web scraping and data extraction
3. Process optimization
4. Integration design
5. Error handling strategies

Focus on reliability and efficiency.`,

  SECURITY: `You are the Security Agent - an expert in cybersecurity.
Your capabilities:
1. Security audits and reviews
2. Vulnerability assessment
3. Access control recommendations
4. Compliance checking
5. Incident response planning

Be thorough and cautious. Prioritize safety.`,

  REVIEWER: `You are the Reviewer Agent - responsible for evaluating outputs.
Your responsibilities:
1. Check for accuracy and completeness
2. Verify code quality and best practices
3. Ensure content meets requirements
4. Provide improvement suggestions
5. Score outputs on quality metrics

Be constructive and specific in feedback.`,

  RISK: `You are the Risk Agent - responsible for identifying potential issues.
Your responsibilities:
1. Identify potential failures
2. Assess security risks
3. Flag harmful or inappropriate content
4. Evaluate execution safety
5. Recommend mitigations

Be proactive and thorough in risk assessment.`,

  COMPLIANCE: `You are the Compliance Agent - responsible for ensuring safe outputs.
Your responsibilities:
1. Check outputs against policies
2. Ensure data privacy compliance
3. Verify content appropriateness
4. Flag potential legal issues
5. Recommend necessary changes

Be strict about compliance requirements.`,
};

// Default agent configurations
export const AGENT_CONFIGS: Record<AgentType, AgentConfig> = {
  ORCHESTRATOR: {
    name: 'Orchestrator',
    type: 'ORCHESTRATOR',
    description: 'Central coordinator that manages task execution',
    capabilities: ['task_routing', 'planning', 'coordination', 'aggregation'],
    modelProvider: 'anthropic',
    modelName: 'claude-sonnet-4-20250514',
    maxTokens: 4096,
    temperature: 0.3,
    systemPrompt: SYSTEM_PROMPTS.ORCHESTRATOR,
    tools: ['delegate', 'plan', 'aggregate', 'retry'],
  },

  PLANNER: {
    name: 'Planner',
    type: 'PLANNER',
    description: 'Creates detailed execution plans for complex tasks',
    capabilities: ['planning', 'estimation', 'dependency_analysis'],
    modelProvider: 'anthropic',
    modelName: 'claude-sonnet-4-20250514',
    maxTokens: 2048,
    temperature: 0.2,
    systemPrompt: SYSTEM_PROMPTS.PLANNER,
    tools: ['analyze', 'estimate', 'schedule'],
  },

  SUPERVISOR: {
    name: 'Supervisor',
    type: 'SUPERVISOR',
    description: 'Quality control and output validation',
    capabilities: ['review', 'validation', 'feedback'],
    modelProvider: 'anthropic',
    modelName: 'claude-sonnet-4-20250514',
    maxTokens: 2048,
    temperature: 0.1,
    systemPrompt: SYSTEM_PROMPTS.SUPERVISOR,
    tools: ['review', 'approve', 'reject', 'request_revision'],
  },

  CODE: {
    name: 'Code Agent',
    type: 'CODE',
    description: 'Expert software developer for coding tasks',
    capabilities: ['coding', 'debugging', 'refactoring', 'testing'],
    modelProvider: 'anthropic',
    modelName: 'claude-sonnet-4-20250514',
    maxTokens: 8192,
    temperature: 0.2,
    systemPrompt: SYSTEM_PROMPTS.CODE,
    tools: ['write_code', 'debug', 'test', 'document'],
  },

  RESEARCH: {
    name: 'Research Agent',
    type: 'RESEARCH',
    description: 'Expert researcher for information gathering',
    capabilities: ['search', 'summarize', 'analyze', 'extract'],
    modelProvider: 'anthropic',
    modelName: 'claude-sonnet-4-20250514',
    maxTokens: 4096,
    temperature: 0.3,
    systemPrompt: SYSTEM_PROMPTS.RESEARCH,
    tools: ['web_search', 'summarize', 'extract_data'],
  },

  SEO: {
    name: 'SEO Agent',
    type: 'SEO',
    description: 'Expert in search engine optimization',
    capabilities: ['keyword_research', 'optimization', 'analysis'],
    modelProvider: 'anthropic',
    modelName: 'claude-sonnet-4-20250514',
    maxTokens: 2048,
    temperature: 0.3,
    systemPrompt: SYSTEM_PROMPTS.SEO,
    tools: ['keyword_analysis', 'meta_optimization', 'content_audit'],
  },

  BLOG: {
    name: 'Blog Writer',
    type: 'BLOG',
    description: 'Expert content writer for blogs',
    capabilities: ['writing', 'editing', 'formatting'],
    modelProvider: 'anthropic',
    modelName: 'claude-sonnet-4-20250514',
    maxTokens: 4096,
    temperature: 0.7,
    systemPrompt: SYSTEM_PROMPTS.BLOG,
    tools: ['write', 'edit', 'format', 'optimize_seo'],
  },

  BUSINESS: {
    name: 'Business Agent',
    type: 'BUSINESS',
    description: 'Expert in business strategy and analysis',
    capabilities: ['analysis', 'strategy', 'documentation'],
    modelProvider: 'anthropic',
    modelName: 'claude-sonnet-4-20250514',
    maxTokens: 4096,
    temperature: 0.4,
    systemPrompt: SYSTEM_PROMPTS.BUSINESS,
    tools: ['market_analysis', 'pricing', 'documentation'],
  },

  RPA: {
    name: 'RPA Agent',
    type: 'RPA',
    description: 'Expert in automation and workflows',
    capabilities: ['automation', 'scraping', 'integration'],
    modelProvider: 'anthropic',
    modelName: 'claude-sonnet-4-20250514',
    maxTokens: 4096,
    temperature: 0.2,
    systemPrompt: SYSTEM_PROMPTS.RPA,
    tools: ['scrape', 'automate', 'integrate'],
  },

  SECURITY: {
    name: 'Security Agent',
    type: 'SECURITY',
    description: 'Expert in cybersecurity',
    capabilities: ['audit', 'assessment', 'compliance'],
    modelProvider: 'anthropic',
    modelName: 'claude-sonnet-4-20250514',
    maxTokens: 4096,
    temperature: 0.1,
    systemPrompt: SYSTEM_PROMPTS.SECURITY,
    tools: ['audit', 'scan', 'assess'],
  },

  REVIEWER: {
    name: 'Reviewer',
    type: 'REVIEWER',
    description: 'Quality reviewer for outputs',
    capabilities: ['review', 'scoring', 'feedback'],
    modelProvider: 'anthropic',
    modelName: 'claude-sonnet-4-20250514',
    maxTokens: 2048,
    temperature: 0.2,
    systemPrompt: SYSTEM_PROMPTS.REVIEWER,
    tools: ['review', 'score', 'suggest'],
  },

  RISK: {
    name: 'Risk Agent',
    type: 'RISK',
    description: 'Risk assessment and mitigation',
    capabilities: ['risk_assessment', 'mitigation', 'monitoring'],
    modelProvider: 'anthropic',
    modelName: 'claude-sonnet-4-20250514',
    maxTokens: 2048,
    temperature: 0.1,
    systemPrompt: SYSTEM_PROMPTS.RISK,
    tools: ['assess_risk', 'mitigate', 'monitor'],
  },

  COMPLIANCE: {
    name: 'Compliance Agent',
    type: 'COMPLIANCE',
    description: 'Compliance and policy checking',
    capabilities: ['compliance_check', 'policy_review', 'flagging'],
    modelProvider: 'anthropic',
    modelName: 'claude-sonnet-4-20250514',
    maxTokens: 2048,
    temperature: 0.1,
    systemPrompt: SYSTEM_PROMPTS.COMPLIANCE,
    tools: ['check_compliance', 'review_policy', 'flag'],
  },
};

// Get agent config by type
export function getAgentConfig(type: AgentType): AgentConfig {
  return AGENT_CONFIGS[type];
}

// Get all agent types
export function getAllAgentTypes(): AgentType[] {
  return Object.keys(AGENT_CONFIGS) as AgentType[];
}

// Get worker agents (excluding management agents)
export function getWorkerAgents(): AgentType[] {
  return ['CODE', 'RESEARCH', 'SEO', 'BLOG', 'BUSINESS', 'RPA', 'SECURITY'];
}

// Get management agents
export function getManagementAgents(): AgentType[] {
  return ['ORCHESTRATOR', 'PLANNER', 'SUPERVISOR', 'REVIEWER', 'RISK', 'COMPLIANCE'];
}
