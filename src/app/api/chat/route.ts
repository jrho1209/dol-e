import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { performRAG } from '@/lib/rag';
import { SYSTEM_PROMPT } from '@/lib/prompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    // Check environment variables
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set');
      return NextResponse.json(
        { error: 'Server configuration error: OpenAI API key missing' },
        { status: 500 }
      );
    }

    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI is not set');
      return NextResponse.json(
        { error: 'Server configuration error: Database connection missing' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array required' },
        { status: 400 }
      );
    }

    // Get the latest user message
    const lastUserMessage = messages
      .filter((m: any) => m.role === 'user')
      .pop();

    if (!lastUserMessage) {
      return NextResponse.json(
        { error: 'No user message found' },
        { status: 400 }
      );
    }

    // Perform RAG: search for relevant places
    const { context, results } = await performRAG(lastUserMessage.content);

    console.log(`Found ${results.length} relevant places for query: "${lastUserMessage.content}"`);
    
    // Log similarity scores for debugging
    results.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.place.name_en} (similarity: ${result.similarity.toFixed(3)})`);
    });

    // Build messages with RAG context injected
    const messagesWithContext = [
      {
        role: 'system' as const,
        content: SYSTEM_PROMPT,
      },
      {
        role: 'system' as const,
        content: context,
      },
      ...messages,
    ];

    // Stream response from OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messagesWithContext,
      temperature: 0.7,
      max_tokens: 1000,
      stream: false, // Changed to false for JSON parsing
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || '{}';
    
    console.log('Raw AI Response:', content); // Debug log
    
    try {
      const parsed = JSON.parse(content);
      console.log('Parsed JSON:', parsed); // Debug log
      
      // Check if this is an itinerary response
      if (parsed.type === 'itinerary' && parsed.itinerary) {
        console.log('Itinerary response detected');
        
        // Map place names in itinerary to full place objects
        const itinerary = parsed.itinerary;
        itinerary.days = itinerary.days.map((day: any) => ({
          ...day,
          items: day.items.map((item: any) => {
            const fullPlace = results.find(r => r.place.name_en === item.name_en)?.place;
            return {
              ...item,
              place: fullPlace || null,
            };
          }).filter((item: any) => item.place !== null),
        }));
        
        return NextResponse.json({
          text: parsed.text,
          itinerary,
        });
      }
      
      // Regular place recommendations
      const text = parsed.text || content;
      const placeReferences = parsed.places || [];
      
      console.log('Place references from AI:', placeReferences); // Debug log
      console.log('Available results:', results.length); // Debug log
      
      // Map place names to full place objects
      const placesData = placeReferences.map((p: any) => {
        const fullPlace = results.find(r => r.place.name_en === p.name_en)?.place;
        console.log(`Mapping ${p.name_en} -> ${fullPlace ? 'Found' : 'Not found'}`); // Debug log
        return fullPlace || null;
      }).filter(Boolean);
      
      console.log('Final places data:', placesData.length); // Debug log
      
      // Return structured response
      return NextResponse.json({
        text,
        places: placesData,
      });
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      // Fallback to text-only response
      return NextResponse.json({
        text: content,
        places: [],
      });
    }
  } catch (error) {
    console.error('Error in chat API:', error);
    
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.name : 'Unknown'
      },
      { status: 500 }
    );
  }
}
