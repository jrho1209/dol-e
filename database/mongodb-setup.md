# MongoDB Atlas Setup Guide for Daejeon AI Chatbot

## Database Schema

### Collection: `places`

Each document in the `places` collection has the following structure:

```javascript
{
  _id: ObjectId,
  name: String,
  name_en: String,
  category: String, // 'restaurant' | 'cafe' | 'accommodation' | 'attraction' | 'shopping'
  description: String,
  description_en: String,
  address: String,
  district: String,
  coordinates_lat: Number,
  coordinates_lng: Number,
  features: [String],
  price_range: Number, // 1-4
  opening_hours: String,
  contact: String,
  is_local_business: Boolean,
  specialties: [String],
  nearby_attractions: [String],
  embedding: [Number], // 1536-dimensional vector from OpenAI
  searchable_text: String,
  created_at: Date,
  updated_at: Date
}
```

## Setup Steps

### 1. Create MongoDB Atlas Account
1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new cluster (M0 Free tier is sufficient for development)

### 2. Create Database and Collection
1. In Atlas Dashboard, click "Browse Collections"
2. Click "Add My Own Data"
3. Database name: `daejeon_chatbot`
4. Collection name: `places`

### 3. Create Vector Search Index

**IMPORTANT:** Vector Search is required for RAG functionality.

1. Go to the "Search" tab in Atlas
2. Click "Create Search Index"
3. Choose "JSON Editor"
4. Select your database: `daejeon_chatbot`
5. Select your collection: `places`
6. Index name: `vector_index`
7. Paste this configuration:

```json
{
  "mappings": {
    "dynamic": true,
    "fields": {
      "embedding": {
        "type": "knnVector",
        "dimensions": 1536,
        "similarity": "cosine"
      },
      "category": {
        "type": "string"
      },
      "district": {
        "type": "string"
      },
      "is_local_business": {
        "type": "boolean"
      }
    }
  }
}
```

8. Click "Create Search Index"
9. Wait for the index to build (usually takes 1-2 minutes)

### 4. Get Connection String

1. In Atlas Dashboard, click "Connect"
2. Choose "Connect your application"
3. Driver: Node.js
4. Copy the connection string
5. It looks like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

### 5. Configure Environment Variables

Create `.env.local` file in your project root:

```bash
# MongoDB Atlas
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=daejeon_chatbot

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# RAG Configuration
MAX_SEARCH_RESULTS=5
SIMILARITY_THRESHOLD=0.7
PREFER_LOCAL_BUSINESS=true
```

Replace:
- `<username>` and `<password>` with your MongoDB credentials
- `cluster0.xxxxx` with your actual cluster address
- `your_openai_api_key_here` with your OpenAI API key

### 6. Network Access (Important!)

1. In Atlas, go to "Network Access"
2. Click "Add IP Address"
3. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
4. For production: Add your server's specific IP address

### 7. Database User

1. In Atlas, go to "Database Access"
2. Click "Add New Database User"
3. Authentication Method: Password
4. Create username and password
5. Database User Privileges: "Read and write to any database"

## Seed Data

After setup is complete, seed the database:

```bash
npm run seed
```

This will:
- Insert 15 sample Daejeon places
- Generate embeddings for each place
- Store everything in MongoDB

## Verify Setup

Check if vector search is working:

1. In Atlas, go to your collection
2. You should see documents with the `embedding` field
3. In "Search Indexes" tab, your `vector_index` should show status "Active"

## Troubleshooting

### "MongoServerError: not authorized"
- Check your database user credentials
- Verify the user has read/write permissions

### "Vector search not working"
- Ensure the search index is built and active
- Verify the index name is exactly `vector_index`
- Check that embedding dimensions are 1536

### Connection timeout
- Check Network Access settings
- Verify your IP is whitelisted
- Check firewall settings

## Cost

- **Free Tier (M0)**: 
  - 512 MB storage
  - Shared RAM
  - Sufficient for ~10,000 places with embeddings
  - Good for development and small projects

- Vector Search is included in the free tier!

## Alternative: Local Development

For local development without Atlas, you can use MongoDB locally:

```bash
# Install MongoDB Community Edition
# Then run:
mongod --dbpath /path/to/data

# Note: Local MongoDB requires manual vector search implementation
```

However, **MongoDB Atlas is recommended** because it provides native vector search support.
