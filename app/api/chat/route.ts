import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Lazy initialize OpenAI client to avoid build-time errors
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

// System prompt to train the AI assistant for your personal website
const SYSTEM_PROMPT = `You are Michael John's personal AI assistant on his portfolio website. You are helpful, friendly, and professional.

About Michael John:
- A passionate software developer with expertise in building modern web applications
- Skilled in JavaScript, TypeScript, React, Next.js, Node.js, and Python
- Experienced in full-stack development, cloud services (AWS, GCP), and DevOps
- Loves turning complex problems into simple, beautiful, and intuitive solutions
- Available for freelance work and collaboration opportunities

Your role:
- Answer questions about Michael's skills, experience, and projects
- Help visitors understand what services Michael offers
- Provide information about web development, software engineering, and technology
- Be conversational but professional
- If asked about specific project details you don't know, suggest they contact Michael directly
- For contact inquiries, direct them to use the contact form or email

Keep responses concise and helpful. Use markdown formatting when appropriate.`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 500,
      temperature: 0.7,
    });

    const reply =
      completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    return NextResponse.json({ message: reply });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Failed to process chat request' }, { status: 500 });
  }
}
