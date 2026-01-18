/**
 * Seed script for populating the database with sample Daejeon places
 * Run with: npx tsx scripts/seed.ts
 */

import { config } from 'dotenv';
import { storePlaceWithEmbedding } from '../src/lib/rag';
import { samplePlaces } from './sampleData';
import { getDatabase } from '../src/lib/mongodb';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function seed() {
  console.log('Starting seed process...');
  
  // Clear existing data
  console.log('Clearing existing places from database...');
  const db = await getDatabase();
  const placesCollection = db.collection('places');
  const deleteResult = await placesCollection.deleteMany({});
  console.log(`Deleted ${deleteResult.deletedCount} existing places.\n`);
  
  console.log(`Total places to seed: ${samplePlaces.length}`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < samplePlaces.length; i++) {
    const place = samplePlaces[i];
    try {
      console.log(`\n[${i + 1}/${samplePlaces.length}] Processing: ${place.name_en} (${place.name})`);
      
      const placeId = await storePlaceWithEmbedding(place);
      
      console.log(`✓ Successfully added place with ID: ${placeId}`);
      successCount++;
    } catch (error) {
      console.error(`✗ Error adding ${place.name_en}:`, error);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('Seed process completed!');
  console.log(`Total: ${samplePlaces.length} places`);
  console.log(`Success: ${successCount} places`);
  console.log(`Errors: ${errorCount} places`);
  console.log('='.repeat(50));
}

// Run the seed function
seed()
  .then(() => {
    console.log('\nSeed script finished successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nSeed script failed:', error);
    process.exit(1);
  });
