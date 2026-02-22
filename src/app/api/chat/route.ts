import { NextRequest } from 'next/server';
import { streamText, tool, convertToModelMessages, UIMessage } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { performRAG } from '@/lib/rag';
import { SYSTEM_PROMPT } from '@/lib/prompts';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'OpenAI API key missing' }), { status: 500 });
    }
    if (!process.env.MONGODB_URI) {
      return new Response(JSON.stringify({ error: 'Database connection missing' }), { status: 500 });
    }

    const body = await req.json();
    const messages: UIMessage[] = body.messages ?? [];

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages array required' }), { status: 400 });
    }

    // Extract last user message text from UIMessage parts
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    const queryText = lastUserMessage?.parts
      .filter((p) => p.type === 'text')
      .map((p) => ('text' in p ? p.text : ''))
      .join('') ?? '';

    if (!queryText) {
      return new Response(JSON.stringify({ error: 'No user message text found' }), { status: 400 });
    }

    // RAG: search for relevant places
    const { context, results } = await performRAG(queryText);

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: SYSTEM_PROMPT + '\n\n' + context,
      messages: await convertToModelMessages(messages),
      temperature: 0.7,
      maxTokens: 1000,
      maxSteps: 3,
      tools: {
        recommendPlaces: tool({
          description: 'Display place recommendation cards to the user for places in Daejeon',
          inputSchema: z.object({
            placeNames: z.array(z.string()).describe('Exact name_en values from the context'),
          }),
          execute: async ({ placeNames }) => {
            const places = placeNames
              .map((name) => results.find((r) => r.place.name_en === name)?.place)
              .filter(Boolean);
            return { places };
          },
        }),

        createItinerary: tool({
          description: 'Create and display a structured multi-day travel itinerary',
          inputSchema: z.object({
            title: z.string(),
            description: z.string().optional(),
            totalDays: z.number(),
            days: z.array(
              z.object({
                day: z.number(),
                title: z.string(),
                items: z.array(
                  z.object({
                    time: z.string(),
                    name_en: z.string(),
                    notes: z.string().optional(),
                    duration: z.number().optional(),
                    transportation: z
                      .object({
                        method: z.string(),
                        duration: z.number(),
                        cost: z.number().optional(),
                      })
                      .optional(),
                  })
                ),
              })
            ),
            budget: z
              .object({ total: z.number(), perDay: z.number(), currency: z.string() })
              .optional(),
          }),
          execute: async (itinerary) => {
            const mappedDays = itinerary.days.map((day) => ({
              ...day,
              items: day.items
                .map((item) => ({
                  ...item,
                  place: results.find((r) => r.place.name_en === item.name_en)?.place ?? null,
                }))
                .filter((item) => item.place !== null),
            }));
            return { itinerary: { ...itinerary, days: mappedDays } };
          },
        }),
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' }),
      { status: 500 }
    );
  }
}
