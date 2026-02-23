/**
 * Sanity Webhook Handler
 *
 * Called automatically by Sanity when a "place" document is created,
 * updated, or deleted. Generates an OpenAI embedding and upserts the
 * document into MongoDB so the RAG pipeline stays in sync.
 *
 * Setup in Sanity dashboard:
 *   URL    : https://<your-domain>/api/sanity-webhook
 *   Trigger: Create, Update, Delete
 *   Filter : _type == "place"
 *   Secret : (set SANITY_WEBHOOK_SECRET in .env.local)
 */

import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook'
import { createClient } from 'next-sanity'
import { generateEmbedding, createSearchableText } from '@/lib/rag'
import { getDatabase } from '@/lib/mongodb'
import { Place } from '@/lib/types'

// ---------------------------------------------------------------------------
// GROQ query — same projection as sync-sanity.ts
// ---------------------------------------------------------------------------

const PLACE_QUERY = `
  *[_type == "place" && _id == $id][0] {
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
`

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get(SIGNATURE_HEADER_NAME) ?? ''
  const operation = request.headers.get('sanity-operation') ?? ''
  const secret = process.env.SANITY_WEBHOOK_SECRET

  if (!secret) {
    console.error('[sanity-webhook] SANITY_WEBHOOK_SECRET is not configured')
    return Response.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  if (!isValidSignature(rawBody, secret, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: { _id: string; _type: string }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { _id, _type } = payload

  // Only handle "place" documents
  if (_type !== 'place') {
    return Response.json({ message: 'Ignored: not a place document' }, { status: 200 })
  }

  const db = await getDatabase()
  const collection = db.collection('places')

  // ── Delete ────────────────────────────────────────────────────────────────
  if (operation === 'delete') {
    await collection.deleteOne({ sanity_id: _id })
    console.log(`[sanity-webhook] Deleted place sanity_id=${_id}`)
    return Response.json({ message: 'Deleted' }, { status: 200 })
  }

  // ── Create / Update ───────────────────────────────────────────────────────
  // Fetch the full document from Sanity to get resolved image URLs
  const sanityClient = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    useCdn: false,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-02-23',
    token: process.env.SANITY_API_TOKEN, // needed only for private datasets
  })

  const sp = await sanityClient.fetch(PLACE_QUERY, { id: _id })

  if (!sp) {
    return Response.json({ error: `Place ${_id} not found in Sanity` }, { status: 404 })
  }

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
  }

  const searchableText = createSearchableText({ ...placeData, id: '' } as Place)
  const embedding = await generateEmbedding(searchableText)

  const existing = await collection.findOne({ sanity_id: _id })

  if (existing) {
    await collection.updateOne(
      { sanity_id: _id },
      {
        $set: {
          ...placeData,
          embedding,
          searchable_text: searchableText,
          coordinates_lat: placeData.coordinates?.lat,
          coordinates_lng: placeData.coordinates?.lng,
          sanity_id: _id,
          sanity_updated_at: sp._updatedAt,
          updated_at: new Date(),
        },
      },
    )
    console.log(`[sanity-webhook] Updated place: ${sp.name_en}`)
  } else {
    await collection.insertOne({
      ...placeData,
      embedding,
      searchable_text: searchableText,
      coordinates_lat: placeData.coordinates?.lat,
      coordinates_lng: placeData.coordinates?.lng,
      sanity_id: _id,
      sanity_updated_at: sp._updatedAt,
      created_at: new Date(),
      updated_at: new Date(),
    })
    console.log(`[sanity-webhook] Created place: ${sp.name_en}`)
  }

  return Response.json(
    { message: `${existing ? 'Updated' : 'Created'}: ${sp.name_en}` },
    { status: 200 },
  )
}
