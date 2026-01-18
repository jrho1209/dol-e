export interface Place {
  id: string;
  name: string;
  name_en: string;
  category: 'restaurant' | 'cafe' | 'accommodation' | 'attraction' | 'shopping';
  description: string;
  description_en: string;
  address: string;
  district: string; // 구/동 (e.g., 중구, 유성구, 서구, 대덕구, 동구)
  coordinates?: {
    lat: number;
    lng: number;
  };
  image_url?: string; // URL to place/food image
  features: string[]; // e.g., ["local_favorite", "family_friendly", "quiet"]
  price_range?: 1 | 2 | 3 | 4; // 1=budget, 2=moderate, 3=high, 4=luxury
  opening_hours?: string;
  contact?: string;
  is_local_business: boolean; // true for local, false for franchise
  specialties?: string[]; // For restaurants: signature dishes
  specialty_images?: string[]; // URLs to specialty dish images
  nearby_attractions?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface PlaceEmbedding {
  id: string;
  place_id: string;
  embedding: number[];
  content: string; // The text that was embedded
  created_at?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  places?: Place[]; // Structured place data for card display
  timestamp?: Date;
}

export interface SearchResult {
  place: Place;
  similarity: number;
}

export interface RAGContext {
  query: string;
  results: SearchResult[];
  systemPrompt: string;
}
