import OpenAI from 'openai';
import { getDatabase } from './mongodb';
import { Place, SearchResult } from './types';
import { buildContextPrompt, formatPlaceForContext } from './prompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Generate embeddings for a given text using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

/**
 * Create searchable text from a Place object for embedding
 */
export function createSearchableText(place: Place): string {
  const parts = [
    place.name,
    place.name_en,
    place.category,
    place.description,
    place.description_en,
    place.district,
    place.address,
  ];

  if (place.specialties) {
    parts.push(...place.specialties);
  }

  if (place.features) {
    parts.push(...place.features);
  }

  if (place.nearby_attractions) {
    parts.push(...place.nearby_attractions);
  }

  return parts.filter(Boolean).join(' ');
}

/**
 * Search for similar places using RAG with MongoDB Vector Search
 */
export async function searchSimilarPlaces(
  query: string,
  options: {
    maxResults?: number;
    similarityThreshold?: number;
    category?: string;
    filterLocalOnly?: boolean;
  } = {}
): Promise<SearchResult[]> {
  const {
    maxResults = parseInt(process.env.MAX_SEARCH_RESULTS || '5'),
    similarityThreshold = parseFloat(process.env.SIMILARITY_THRESHOLD || '0.7'),
    category,
    filterLocalOnly = process.env.PREFER_LOCAL_BUSINESS === 'true',
  } = options;

  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    const db = await getDatabase();
    const placesCollection = db.collection('places');

    // Build MongoDB aggregation pipeline for vector search
    const pipeline: any[] = [
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: maxResults * 10,
          limit: maxResults,
        },
      },
      {
        $addFields: {
          similarity: { $meta: 'vectorSearchScore' },
        },
      },
      {
        $match: {
          similarity: { $gte: similarityThreshold },
        },
      },
    ];

    // Add category filter if specified
    if (category) {
      pipeline.push({
        $match: { category },
      });
    }

    // Add local business filter if specified
    if (filterLocalOnly) {
      pipeline.push({
        $match: { is_local_business: true },
      });
    }

    const results = await placesCollection.aggregate(pipeline).toArray();

    // Transform results
    const searchResults: SearchResult[] = results.map((doc: any) => {
      // Remove MongoDB _id and embedding from the place object
      const { _id, embedding, ...placeData } = doc;
      
      // Debug log
      console.log('RAG - Place:', placeData.name_en);
      console.log('RAG - Has specialty_images:', !!placeData.specialty_images);
      if (placeData.specialty_images) {
        console.log('RAG - specialty_images:', placeData.specialty_images);
      }
      
      return {
        place: {
          id: _id.toString(),
          ...placeData,
        } as Place,
        similarity: doc.similarity,
      };
    });

    return searchResults;
  } catch (error) {
    console.error('Error in searchSimilarPlaces:', error);
    throw error;
  }
}

/**
 * Build RAG context from search results
 */
export function buildRAGContext(results: SearchResult[]): string {
  if (results.length === 0) {
    return 'No relevant places found in the database. Please be honest with the user that you don\'t have information about their request.';
  }

  const contextParts = results.map((result, index) => {
    return `${index + 1}. ${formatPlaceForContext(result.place)}`;
  });

  return buildContextPrompt(contextParts.join('\n\n'));
}

/**
 * Main RAG pipeline: query -> embed -> search -> format context
 */
export async function performRAG(
  userQuery: string,
  options: {
    maxResults?: number;
    similarityThreshold?: number;
    category?: string;
  } = {}
): Promise<{ context: string; results: SearchResult[] }> {
  // Search for similar places
  const results = await searchSimilarPlaces(userQuery, options);

  // Build context for LLM
  const context = buildRAGContext(results);

  return { context, results };
}

/**
 * Store a new place with its embedding in MongoDB
 */
export async function storePlaceWithEmbedding(place: Omit<Place, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
  const db = await getDatabase();
  const placesCollection = db.collection('places');

  try {
    // Generate embedding
    const searchableText = createSearchableText({ ...place, id: '' } as Place);
    const embedding = await generateEmbedding(searchableText);

    // Prepare document
    const placeDocument = {
      ...place,
      embedding,
      searchable_text: searchableText,
      coordinates_lat: place.coordinates?.lat,
      coordinates_lng: place.coordinates?.lng,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Insert into MongoDB
    const result = await placesCollection.insertOne(placeDocument);

    console.log(`Inserted place with ID: ${result.insertedId}`);
    return result.insertedId.toString();
  } catch (error) {
    console.error('Error in storePlaceWithEmbedding:', error);
    throw error;
  }
}
