# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DOL-E** is an AI-powered local guide chatbot for foreign visitors to Daejeon, South Korea. It recommends restaurants, cafes, attractions, and accommodations using a RAG (Retrieval-Augmented Generation) pipeline backed by MongoDB Atlas Vector Search and OpenAI.

## Commands

```bash
npm run dev       # Start development server (localhost:3000)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
npm run seed      # Seed MongoDB with sample places (requires .env.local)
```

## Architecture

### RAG Pipeline

The core of the application. A user message flows through:

1. **Chat API** ([src/app/api/chat/route.ts](src/app/api/chat/route.ts)) receives the message
2. **`performRAG()`** in [src/lib/rag.ts](src/lib/rag.ts) generates an OpenAI embedding for the query
3. **MongoDB Atlas Vector Search** finds similar places using cosine similarity (1536-dim index on `places.embedding`)
4. **`buildRAGContext()`** formats the matched places and injects them into the system prompt
5. **GPT-4o-mini** returns structured JSON: `{ text, places?, itinerary? }`
6. The API maps place name references back to full `Place` objects before returning to the client

Key RAG config via environment variables: `MAX_SEARCH_RESULTS` (default 5), `SIMILARITY_THRESHOLD` (default 0.7), `PREFER_LOCAL_BUSINESS` (true).

### AI Response Format

The system prompt ([src/lib/prompts.ts](src/lib/prompts.ts)) instructs the model to return **only JSON** with no markdown. The Chat component ([src/components/chat/Chat.tsx](src/components/chat/Chat.tsx)) parses this and renders `PlaceCard` components for place recommendations or a structured itinerary view.

### Authentication

NextAuth.js with two providers:
- **Credentials** (email/password with bcrypt)
- **Google OAuth**

Session is provided app-wide via `SessionProvider` in [src/components/auth/SessionProvider.tsx](src/components/auth/SessionProvider.tsx), which wraps the root layout.

### Database (MongoDB)

Collections: `users`, `places` (with embeddings), `conversations`, `favorites`, `itineraries`, `reviews`, `search_logs`.

The `places` collection requires a **Vector Search Index** named with 1536 dimensions and cosine similarity — see [database/SCHEMA.md](database/SCHEMA.md) for full setup. Run `npm run seed` to populate initial sample data.

Connection is a singleton with global promise caching for dev hot-reloads ([src/lib/mongodb.ts](src/lib/mongodb.ts)).

### Path Alias

`@/*` resolves to `./src/*` (configured in `tsconfig.json`).

## Design System

- **Primary:** Yellow (`#EAB308`, `yellow-500`) — inspired by Daejeon's mascot Kkumdoli
- **Secondary:** Orange (`#FF8C42`)
- **Accent:** Teal (`#4ECDC4`)
- **Background:** `amber-50`
- Use solid colors only — no gradients. Hover effects use `yellow-600`.

## Environment Variables

Required in `.env.local`:

```
OPENAI_API_KEY=
MONGODB_URI=
MONGODB_DB_NAME=dol-e
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Optional:
```
MAX_SEARCH_RESULTS=5
SIMILARITY_THRESHOLD=0.7
PREFER_LOCAL_BUSINESS=true
```
