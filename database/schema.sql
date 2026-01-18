-- Supabase/PostgreSQL Schema for Daejeon AI Chatbot
-- This schema uses pgvector extension for similarity search

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Places table: stores information about Daejeon local businesses and attractions
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('restaurant', 'cafe', 'accommodation', 'attraction', 'shopping')),
  description TEXT NOT NULL,
  description_en TEXT NOT NULL,
  address TEXT NOT NULL,
  district TEXT NOT NULL, -- 중구, 유성구, 서구, 대덕구, 동구
  coordinates_lat DECIMAL(10, 8),
  coordinates_lng DECIMAL(11, 8),
  features TEXT[], -- Array of features
  price_range INTEGER CHECK (price_range BETWEEN 1 AND 4),
  opening_hours TEXT,
  contact TEXT,
  is_local_business BOOLEAN NOT NULL DEFAULT true,
  specialties TEXT[], -- For restaurants: signature dishes
  nearby_attractions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Place embeddings table: stores vector embeddings for semantic search
CREATE TABLE place_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  content TEXT NOT NULL, -- The text that was embedded
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(place_id)
);

-- Create index for vector similarity search using cosine distance
CREATE INDEX ON place_embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create indexes for better query performance
CREATE INDEX idx_places_category ON places(category);
CREATE INDEX idx_places_district ON places(district);
CREATE INDEX idx_places_is_local_business ON places(is_local_business);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_places_updated_at BEFORE UPDATE ON places
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function for similarity search
CREATE OR REPLACE FUNCTION search_places(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_category text DEFAULT NULL,
  filter_local_only boolean DEFAULT true
)
RETURNS TABLE (
  id uuid,
  place_id uuid,
  similarity float,
  place_data jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pe.id,
    pe.place_id,
    1 - (pe.embedding <=> query_embedding) as similarity,
    to_jsonb(p.*) as place_data
  FROM place_embeddings pe
  JOIN places p ON p.id = pe.place_id
  WHERE 
    1 - (pe.embedding <=> query_embedding) > match_threshold
    AND (filter_category IS NULL OR p.category = filter_category)
    AND (NOT filter_local_only OR p.is_local_business = true)
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Sample comment for reference
COMMENT ON TABLE places IS 'Stores information about Daejeon local businesses, restaurants, cafes, and attractions';
COMMENT ON TABLE place_embeddings IS 'Stores vector embeddings for semantic search of places';
COMMENT ON FUNCTION search_places IS 'Searches for similar places using vector similarity with optional filters';
