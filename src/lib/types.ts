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
  itinerary?: Itinerary; // Travel itinerary data
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

// Itinerary types
export interface ItineraryItem {
  time: string; // e.g., "09:00", "12:30"
  duration: number; // in minutes
  place: Place;
  notes?: string;
  transportation?: {
    method: 'walk' | 'subway' | 'bus' | 'taxi';
    duration: number; // in minutes
    cost?: number;
  };
}

export interface ItineraryDay {
  day: number;
  date?: string; // e.g., "2026-01-25"
  title?: string; // e.g., "Day 1: Cultural Exploration"
  items: ItineraryItem[];
  totalBudget?: number;
}

export interface Itinerary {
  _id?: string;
  userId?: string;
  title: string;
  description?: string;
  days: ItineraryDay[];
  totalDays: number;
  budget?: {
    total: number;
    perDay: number;
    currency: string;
  };
  preferences?: {
    focusCategories?: string[]; // ["restaurant", "cafe", "attraction"]
    pace?: 'relaxed' | 'moderate' | 'packed';
  };
  createdAt?: Date;
  updatedAt?: Date;
}
