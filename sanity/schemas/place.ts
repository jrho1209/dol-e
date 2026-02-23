/**
 * Sanity Studio schema for "place" documents.
 *
 * Copy this file into your Sanity Studio project:
 *   schemas/place.ts
 *
 * Then import and register it in schemas/index.ts:
 *   import { place } from './place'
 *   export const schemaTypes = [place]
 */

export const place = {
  name: 'place',
  title: 'Place',
  type: 'document',
  fields: [
    // ── Identity ────────────────────────────────────────────────────────────
    {
      name: 'name',
      title: '이름 (Korean)',
      type: 'string',
      validation: (R: any) => R.required(),
    },
    {
      name: 'name_en',
      title: 'Name (English)',
      type: 'string',
      validation: (R: any) => R.required(),
      description: 'Used as the unique key in MongoDB — must be unique across all places.',
    },

    // ── Category ────────────────────────────────────────────────────────────
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Restaurant', value: 'restaurant' },
          { title: 'Cafe', value: 'cafe' },
          { title: 'Accommodation', value: 'accommodation' },
          { title: 'Attraction', value: 'attraction' },
          { title: 'Shopping', value: 'shopping' },
        ],
        layout: 'radio',
      },
      validation: (R: any) => R.required(),
    },

    // ── Cuisine Type (restaurants only) ─────────────────────────────────────
    {
      name: 'cuisine_type',
      title: 'Cuisine Type',
      type: 'string',
      hidden: ({ document }: { document: { category?: string } }) => document?.category !== 'restaurant',
      options: {
        list: [
          { title: '한식 Korean', value: 'korean' },
          { title: '일식 Japanese', value: 'japanese' },
          { title: '중식 Chinese', value: 'chinese' },
          { title: '양식 Western', value: 'western' },
          { title: '기타 Other', value: 'other' },
        ],
        layout: 'radio',
      },
    },

    // ── Descriptions ────────────────────────────────────────────────────────
    {
      name: 'description',
      title: '설명 (Korean)',
      type: 'text',
      rows: 3,
    },
    {
      name: 'description_en',
      title: 'Description (English)',
      type: 'text',
      rows: 3,
    },

    // ── Location ────────────────────────────────────────────────────────────
    {
      name: 'address',
      title: 'Address',
      type: 'string',
    },
    {
      name: 'district',
      title: 'District (구)',
      type: 'string',
      options: {
        list: ['중구', '서구', '유성구', '대덕구', '동구'],
      },
    },
    {
      name: 'coordinates',
      title: 'Coordinates',
      type: 'object',
      fields: [
        { name: 'lat', title: 'Latitude', type: 'number' },
        { name: 'lng', title: 'Longitude', type: 'number' },
      ],
    },

    // ── Images ──────────────────────────────────────────────────────────────
    {
      name: 'image',
      title: 'Main Image',
      type: 'image',
      options: { hotspot: true },
    },

    // ── Details ─────────────────────────────────────────────────────────────
    {
      name: 'features',
      title: 'Features / Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
        list: [
          'local_favorite',
          'iconic_landmark',
          'family_friendly',
          'quiet',
          'affordable',
          'traditional',
          'modern',
          'family_run',
          'authentic',
          'romantic',
          'outdoor_seating',
          'vegetarian_friendly',
        ],
      },
    },
    {
      name: 'price_range',
      title: 'Price Range',
      type: 'number',
      options: {
        list: [
          { title: '₩  Budget', value: 1 },
          { title: '₩₩  Moderate', value: 2 },
          { title: '₩₩₩  High', value: 3 },
          { title: '₩₩₩₩  Luxury', value: 4 },
        ],
        layout: 'radio',
      },
    },
    {
      name: 'opening_hours',
      title: 'Opening Hours',
      type: 'string',
      description: 'e.g. "09:00-21:00, Closed Mondays"',
    },
    {
      name: 'contact',
      title: 'Contact',
      type: 'string',
      description: 'Phone number or website',
    },
    {
      name: 'is_local_business',
      title: 'Local Business?',
      type: 'boolean',
      initialValue: true,
      description: 'True = independently owned local, False = franchise/chain',
    },

    // ── Restaurant-specific ─────────────────────────────────────────────────
    {
      name: 'specialties',
      title: 'Specialties / Signature Dishes',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'name',
              title: 'Dish Name',
              type: 'string',
              validation: (R: any) => R.required(),
            },
            {
              name: 'image',
              title: 'Dish Image',
              type: 'image',
              options: { hotspot: true },
            },
          ],
          preview: {
            select: { title: 'name', media: 'image' },
          },
        },
      ],
      description: 'For restaurants and cafes — add each signature dish with a photo',
    },

    // ── Context ─────────────────────────────────────────────────────────────
    {
      name: 'nearby_attractions',
      title: 'Nearby Attractions',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    },
  ],

  preview: {
    select: {
      title: 'name_en',
      subtitle: 'category',
      media: 'image',
    },
  },
};
