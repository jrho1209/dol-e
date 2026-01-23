# DOL-E MongoDB Database Schema

## Collections Overview

### 1. users
사용자 정보를 저장합니다.

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, required),
  password: String (hashed, optional - OAuth 사용자는 null),
  profileImage: String (URL),
  authProvider: String, // "credentials" | "google"
  preferences: {
    language: String, // "ko" | "en"
    favoriteCategories: [String], // ["korean", "cafe", "restaurant"]
  },
  subscription: {
    plan: String, // "free" | "basic" | "premium"
    status: String, // "active" | "cancelled" | "expired"
    startDate: Date,
    endDate: Date,
  },
  createdAt: Date,
  updatedAt: Date,
  lastLoginAt: Date,
}
```

**Indexes:**
- `email`: unique
- `authProvider`: 1
- `createdAt`: -1

---

### 2. places
대전 지역 맛집 및 관광지 정보를 저장합니다.

```javascript
{
  _id: ObjectId,
  name: String (required),
  nameEn: String,
  category: String, // "restaurant" | "cafe" | "bar" | "attraction"
  subcategory: String, // "korean" | "japanese" | "italian" | "bakery" etc.
  description: String,
  descriptionEn: String,
  address: {
    full: String,
    district: String, // "서구" | "유성구" | "동구" | "대덕구" | "중구"
    dong: String,
    street: String,
    postalCode: String,
  },
  location: {
    type: "Point",
    coordinates: [Number, Number], // [longitude, latitude]
  },
  contact: {
    phone: String,
    website: String,
    instagram: String,
    kakaotalk: String,
  },
  businessHours: {
    monday: { open: String, close: String, closed: Boolean },
    tuesday: { open: String, close: String, closed: Boolean },
    wednesday: { open: String, close: String, closed: Boolean },
    thursday: { open: String, close: String, closed: Boolean },
    friday: { open: String, close: String, closed: Boolean },
    saturday: { open: String, close: String, closed: Boolean },
    sunday: { open: String, close: String, closed: Boolean },
  },
  priceRange: String, // "₩" | "₩₩" | "₩₩₩" | "₩₩₩₩"
  averagePrice: Number,
  tags: [String], // ["local", "hidden_gem", "popular", "instagram_worthy"]
  features: [String], // ["parking", "wifi", "pet_friendly", "kids_friendly"]
  images: [{
    url: String,
    caption: String,
    uploadedBy: ObjectId (ref: users),
    uploadedAt: Date,
    isPrimary: Boolean,
  }],
  menu: [{
    name: String,
    nameEn: String,
    description: String,
    price: Number,
    image: String,
    isSignature: Boolean,
  }],
  rating: {
    average: Number, // 0-5
    count: Number,
  },
  popularity: {
    views: Number,
    favorites: Number,
    shares: Number,
  },
  embedding: [Number], // Vector embedding for RAG (1536 dimensions for OpenAI)
  isVerified: Boolean,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date,
}
```

**Indexes:**
- `location`: 2dsphere (지리적 검색)
- `category`: 1
- `address.district`: 1
- `tags`: 1
- `rating.average`: -1
- `popularity.views`: -1
- `createdAt`: -1

---

### 3. reviews
사용자 리뷰를 저장합니다.

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: users),
  placeId: ObjectId (ref: places),
  rating: Number, // 1-5
  title: String,
  content: String,
  images: [String], // URLs
  visitDate: Date,
  likes: Number,
  helpfulCount: Number,
  likedBy: [ObjectId], // user IDs who liked this review
  response: {
    content: String,
    respondedBy: String, // Owner name
    respondedAt: Date,
  },
  isVerified: Boolean, // Verified visit
  createdAt: Date,
  updatedAt: Date,
}
```

**Indexes:**
- `placeId`: 1
- `userId`: 1
- `rating`: -1
- `createdAt`: -1

---

### 4. conversations
채팅 대화 내역을 저장합니다.

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: users),
  title: String, // Auto-generated from first message
  messages: [{
    role: String, // "user" | "assistant"
    content: String,
    places: [ObjectId], // Referenced places in this message
    timestamp: Date,
  }],
  context: {
    location: String,
    preferences: [String],
    lastSearchedCategory: String,
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date,
}
```

**Indexes:**
- `userId`: 1
- `isActive`: 1
- `createdAt`: -1

---

### 5. favorites
사용자의 즐겨찾기를 저장합니다.

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: users),
  placeId: ObjectId (ref: places),
  notes: String, // Personal notes
  tags: [String], // ["want_to_visit", "visited", "recommended"]
  createdAt: Date,
}
```

**Indexes:**
- `userId`: 1
- `placeId`: 1
- Compound index: `{userId: 1, placeId: 1}` (unique)

---

### 6. itineraries
사용자의 여행 일정을 저장합니다.

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: users, required),
  title: String (required), // e.g., "3-Day Daejeon Adventure"
  description: String,
  days: [{
    day: Number, // 1, 2, 3...
    date: String, // "2026-01-25" (optional)
    title: String, // "Day 1: Cultural Exploration"
    items: [{
      time: String, // "09:00"
      duration: Number, // in minutes
      placeId: ObjectId (ref: places),
      place: Object, // Embedded place data for quick access
      notes: String,
      transportation: {
        method: String, // "walk" | "subway" | "bus" | "taxi"
        duration: Number, // in minutes
        cost: Number,
      }
    }],
    totalBudget: Number,
  }],
  totalDays: Number,
  budget: {
    total: Number,
    perDay: Number,
    currency: String, // "KRW"
  },
  preferences: {
    focusCategories: [String], // ["restaurant", "cafe", "attraction"]
    pace: String, // "relaxed" | "moderate" | "packed"
  },
  isPublic: Boolean, // Whether to share with other users
  likes: Number,
  createdAt: Date,
  updatedAt: Date,
}
```

**Indexes:**
- `userId`: 1
- `isPublic`: 1
- `createdAt`: -1
- Compound index: `{userId: 1, createdAt: -1}`

---

### 7. search_logs
검색 로그 및 분석 데이터를 저장합니다.

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: users, optional),
  sessionId: String,
  query: String,
  filters: {
    category: String,
    district: String,
    priceRange: String,
  },
  results: [{
    placeId: ObjectId,
    rank: Number,
    clicked: Boolean,
  }],
  userAgent: String,
  ipAddress: String,
  createdAt: Date,
}
```

**Indexes:**
- `userId`: 1
- `sessionId`: 1
- `createdAt`: -1

---

## Setup Instructions

### 1. MongoDB Atlas 설정

1. **Collections 생성**
```bash
use dol-e

db.createCollection("users")
db.createCollection("places")
db.createCollection("reviews")
db.createCollection("conversations")
db.createCollection("favorites")
db.createCollection("search_logs")
```

### 2. Indexes 생성

```javascript
// users collection
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "authProvider": 1 })
db.users.createIndex({ "createdAt": -1 })

// places collection
db.places.createIndex({ "location": "2dsphere" })
db.places.createIndex({ "category": 1 })
db.places.createIndex({ "address.district": 1 })
db.places.createIndex({ "tags": 1 })
db.places.createIndex({ "rating.average": -1 })
db.places.createIndex({ "popularity.views": -1 })
db.places.createIndex({ "createdAt": -1 })

// reviews collection
db.reviews.createIndex({ "placeId": 1 })
db.reviews.createIndex({ "userId": 1 })
db.reviews.createIndex({ "rating": -1 })
db.reviews.createIndex({ "createdAt": -1 })

// conversations collection
db.conversations.createIndex({ "userId": 1 })
db.conversations.createIndex({ "isActive": 1 })
db.conversations.createIndex({ "createdAt": -1 })

// favorites collection
db.favorites.createIndex({ "userId": 1 })
db.favorites.createIndex({ "placeId": 1 })
db.favorites.createIndex({ "userId": 1, "placeId": 1 }, { unique: true })

// search_logs collection
db.search_logs.createIndex({ "userId": 1 })
db.search_logs.createIndex({ "sessionId": 1 })
db.search_logs.createIndex({ "createdAt": -1 })
```

### 3. Vector Search Index (Atlas Search)

places 컬렉션에 Vector Search 인덱스를 생성하여 RAG 기능을 활성화합니다.

**Atlas UI에서:**
1. Database → Search → Create Index
2. Index Name: `places_vector_index`
3. Configuration:
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
      "name": {
        "type": "string"
      },
      "description": {
        "type": "string"
      },
      "category": {
        "type": "string"
      },
      "tags": {
        "type": "string"
      }
    }
  }
}
```

---

## Data Migration & Seeding

기존 `scripts/seed.ts`를 사용하여 샘플 데이터를 생성할 수 있습니다.

---

## Best Practices

1. **Embedding 생성**: 새로운 place가 추가될 때마다 OpenAI API를 사용하여 embedding 생성
2. **이미지 저장**: 실제 이미지는 AWS S3, Cloudinary 등에 저장하고 URL만 DB에 저장
3. **성능 최적화**: 자주 조회되는 필드에 인덱스 추가
4. **데이터 검증**: Mongoose 스키마 또는 MongoDB Schema Validation 사용
5. **백업**: 정기적인 백업 설정 (Atlas는 자동 백업 지원)

---

## Estimated Storage

- **users**: ~1KB per document
- **places**: ~10-20KB per document (이미지 URL 포함)
- **reviews**: ~2KB per document
- **conversations**: ~5-10KB per conversation
- **favorites**: ~500 bytes per document
- **search_logs**: ~1KB per document

**예상 총 용량 (1년 기준):**
- Users: 10,000 users × 1KB = 10MB
- Places: 5,000 places × 15KB = 75MB
- Reviews: 50,000 reviews × 2KB = 100MB
- Total: ~200MB (free tier 충분)
