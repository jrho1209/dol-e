// MongoDB Atlas Setup Script
// Run this in MongoDB Atlas Shell or MongoDB Compass

use('dol-e');

// Create collections
db.createCollection('users');
db.createCollection('places');
db.createCollection('reviews');
db.createCollection('conversations');
db.createCollection('favorites');
db.createCollection('search_logs');

// Create indexes for users collection
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ authProvider: 1 });
db.users.createIndex({ createdAt: -1 });

// Create indexes for places collection
db.places.createIndex({ location: '2dsphere' });
db.places.createIndex({ category: 1 });
db.places.createIndex({ 'address.district': 1 });
db.places.createIndex({ tags: 1 });
db.places.createIndex({ 'rating.average': -1 });
db.places.createIndex({ 'popularity.views': -1 });
db.places.createIndex({ createdAt: -1 });
db.places.createIndex({ isActive: 1, isVerified: 1 });

// Create indexes for reviews collection
db.reviews.createIndex({ placeId: 1 });
db.reviews.createIndex({ userId: 1 });
db.reviews.createIndex({ rating: -1 });
db.reviews.createIndex({ createdAt: -1 });
db.reviews.createIndex({ placeId: 1, createdAt: -1 });

// Create indexes for conversations collection
db.conversations.createIndex({ userId: 1 });
db.conversations.createIndex({ isActive: 1 });
db.conversations.createIndex({ createdAt: -1 });
db.conversations.createIndex({ userId: 1, createdAt: -1 });

// Create indexes for favorites collection
db.favorites.createIndex({ userId: 1 });
db.favorites.createIndex({ placeId: 1 });
db.favorites.createIndex({ userId: 1, placeId: 1 }, { unique: true });

// Create indexes for search_logs collection
db.search_logs.createIndex({ userId: 1 });
db.search_logs.createIndex({ sessionId: 1 });
db.search_logs.createIndex({ createdAt: -1 });

console.log('✅ Collections and indexes created successfully!');

// Validation schemas (optional but recommended)
db.runCommand({
  collMod: 'users',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'name', 'createdAt'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'must be a valid email and is required',
        },
        name: {
          bsonType: 'string',
          minLength: 1,
          description: 'must be a string and is required',
        },
        password: {
          bsonType: ['string', 'null'],
          description: 'must be a string or null for OAuth users',
        },
        authProvider: {
          enum: ['credentials', 'google'],
          description: 'must be either credentials or google',
        },
      },
    },
  },
});

db.runCommand({
  collMod: 'places',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'category', 'address', 'location'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'must be a string and is required',
        },
        category: {
          enum: ['restaurant', 'cafe', 'bar', 'attraction'],
          description: 'must be a valid category',
        },
        location: {
          bsonType: 'object',
          required: ['type', 'coordinates'],
          properties: {
            type: {
              enum: ['Point'],
            },
            coordinates: {
              bsonType: 'array',
              minItems: 2,
              maxItems: 2,
            },
          },
        },
      },
    },
  },
});

console.log('✅ Validation schemas applied!');
