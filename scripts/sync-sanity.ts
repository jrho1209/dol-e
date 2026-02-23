/**
 * Sync script: Sanity CMS → MongoDB (with OpenAI embeddings)
 *
 * Fetches all Place documents from Sanity, generates embeddings,
 * and upserts them into MongoDB. Skips unchanged records.
 *
 * Run with: npm run sync-sanity
 *
 * Required .env.local variables:
 *   SANITY_PROJECT_ID=your_project_id
 *   SANITY_DATASET=production          (optional, default: production)
 *   SANITY_API_TOKEN=your_read_token   (optional for public datasets)
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@sanity/client';
import { generateEmbedding, createSearchableText } from '../src/lib/rag';
import { getDatabase } from '../src/lib/mongodb';
import { Place } from '../src/lib/types';

// ---------------------------------------------------------------------------
// Sanity client
// ---------------------------------------------------------------------------

const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET || 'production',
  useCdn: false, // always fetch fresh data
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, // optional for public datasets
});

// ---------------------------------------------------------------------------
// GROQ query — image URLs are resolved via asset->url projection
// ---------------------------------------------------------------------------

const PLACES_QUERY = `
  *[_type == "place"] {
    _id,
    _updatedAt,
    name,
    name_en,
    category,
    description,
    description_en,
    address,
    district,
    coordinates,
    "image_url": image.asset->url,
    features,
    price_range,
    opening_hours,
    contact,
    is_local_business,
    "specialties": specialties[]{ name, "image_url": image.asset->url },
    nearby_attractions
  }
`;

// ---------------------------------------------------------------------------
// Type for raw Sanity response
// ---------------------------------------------------------------------------

interface SanityPlace {
  _id: string;
  _updatedAt: string;
  name: string;
  name_en: string;
  category: Place['category'];
  description: string;
  description_en: string;
  address: string;
  district: string;
  coordinates?: { lat: number; lng: number };
  image_url?: string;
  features: string[];
  price_range?: 1 | 2 | 3 | 4;
  opening_hours?: string;
  contact?: string;
  is_local_business: boolean;
  specialties?: { name: string; image_url?: string }[];
  nearby_attractions?: string[];
}

// ---------------------------------------------------------------------------
// Main sync function
// ---------------------------------------------------------------------------

async function syncSanityToMongoDB() {
  console.log('Starting Sanity → MongoDB sync...\n');

  // 1. Fetch all places from Sanity
  const sanityPlaces: SanityPlace[] = await sanityClient.fetch(PLACES_QUERY);
  console.log(`Fetched ${sanityPlaces.length} places from Sanity.\n`);

  if (sanityPlaces.length === 0) {
    console.log('No places found in Sanity. Make sure you have published "place" documents.');
    return;
  }

  // 2. Connect to MongoDB
  const db = await getDatabase();
  const collection = db.collection('places');

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  // 3. Upsert each place
  for (const sp of sanityPlaces) {
    try {
      // Map Sanity document → Place shape
      const placeData: Omit<Place, 'id' | 'created_at' | 'updated_at'> = {
        name: sp.name,
        name_en: sp.name_en,
        category: sp.category,
        description: sp.description,
        description_en: sp.description_en,
        address: sp.address,
        district: sp.district,
        coordinates: sp.coordinates,
        image_url: sp.image_url,
        features: sp.features ?? [],
        price_range: sp.price_range,
        opening_hours: sp.opening_hours,
        contact: sp.contact,
        is_local_business: sp.is_local_business ?? true,
        specialties: sp.specialties,
        nearby_attractions: sp.nearby_attractions,
      };

      // Check whether this place already exists (keyed by name_en)
      const existing = await collection.findOne({ name_en: sp.name_en });

      if (existing) {
        // Skip if Sanity hasn't changed since the last sync
        if (
          existing.sanity_updated_at &&
          new Date(existing.sanity_updated_at) >= new Date(sp._updatedAt)
        ) {
          console.log(`  ⟳  Skipping (unchanged): ${sp.name_en}`);
          skipped++;
          continue;
        }

        // Re-generate embedding because content may have changed
        console.log(`  ↑  Updating: ${sp.name_en}`);
        const searchableText = createSearchableText({ ...placeData, id: '' } as Place);
        const embedding = await generateEmbedding(searchableText);

        await collection.updateOne(
          { name_en: sp.name_en },
          {
            $set: {
              ...placeData,
              embedding,
              searchable_text: searchableText,
              coordinates_lat: placeData.coordinates?.lat,
              coordinates_lng: placeData.coordinates?.lng,
              sanity_id: sp._id,
              sanity_updated_at: sp._updatedAt,
              updated_at: new Date(),
            },
          }
        );
        updated++;
      } else {
        // New place — create with embedding
        console.log(`  +  Creating: ${sp.name_en}`);
        const searchableText = createSearchableText({ ...placeData, id: '' } as Place);
        const embedding = await generateEmbedding(searchableText);

        await collection.insertOne({
          ...placeData,
          embedding,
          searchable_text: searchableText,
          coordinates_lat: placeData.coordinates?.lat,
          coordinates_lng: placeData.coordinates?.lng,
          sanity_id: sp._id,
          sanity_updated_at: sp._updatedAt,
          created_at: new Date(),
          updated_at: new Date(),
        });
        created++;
      }
    } catch (err) {
      console.error(`  ✗  Error processing "${sp.name_en}":`, err);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('Sync completed!');
  console.log(`  Created : ${created}`);
  console.log(`  Updated : ${updated}`);
  console.log(`  Skipped : ${skipped} (unchanged)`);
  console.log(`  Errors  : ${errors}`);
  console.log('='.repeat(50));
}

// Run
syncSanityToMongoDB()
  .then(() => {
    console.log('\nSync finished.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\nSync failed:', err);
    process.exit(1);
  });
