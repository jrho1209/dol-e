import { NextRequest } from 'next/server';
import { generateText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { performRAG } from '@/lib/rag';
import { SYSTEM_PROMPT } from '@/lib/prompts';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ error: 'OpenAI API key missing' }, { status: 500 });
    }

    const body = await req.json();
    const messages: { role: string; content: string }[] = body.messages ?? [];

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'messages required' }, { status: 400 });
    }

    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    const queryText = lastUserMessage?.content || '';

    if (!queryText) {
      return Response.json({ error: 'No user message' }, { status: 400 });
    }

    const { context, results } = await performRAG(queryText);

    let foundPlaces: any[] = [];

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: SYSTEM_PROMPT + '\n\n' + context,
      messages: messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      temperature: 0.7,
      maxOutputTokens: 500,
      tools: {
        recommendPlaces: tool({
          description: 'Display place recommendation cards to the user for places in Daejeon',
          inputSchema: z.object({
            placeNames: z.array(z.string()).describe('Exact name_en values from the context'),
          }),
          execute: async ({ placeNames }) => {
            const places = placeNames
              .map(name => {
                const normalized = name.toLowerCase().trim();
                return results.find(r => {
                  const en = r.place.name_en.toLowerCase().trim();
                  return en === normalized || en.includes(normalized) || normalized.includes(en);
                })?.place;
              })
              .filter(Boolean);
            foundPlaces = places;
            return { places };
          },
        }),
      },
    });

    return Response.json({ text: result.text, places: foundPlaces });
  } catch (error) {
    console.error('Error in planner-chat API:', error);
    return Response.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
