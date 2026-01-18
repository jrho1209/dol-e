import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET - 사용자의 즐겨찾기 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    
    const favorites = await db
      .collection('favorites')
      .find({ userId: new ObjectId(session.user.id) })
      .sort({ createdAt: -1 })
      .toArray();

    // placeId로 places 정보 가져오기
    const placeIds = favorites.map((f) => f.placeId);
    const places = await db
      .collection('places')
      .find({ _id: { $in: placeIds } })
      .toArray();

    // favorites와 places 결합
    const result = favorites.map((fav) => {
      const place = places.find((p) => p._id.equals(fav.placeId));
      return {
        favoriteId: fav._id,
        place: place,
        notes: fav.notes,
        tags: fav.tags,
        createdAt: fav.createdAt,
      };
    });

    return NextResponse.json({ favorites: result });
  } catch (error) {
    console.error('Get favorites error:', error);
    return NextResponse.json(
      { error: 'Failed to get favorites' },
      { status: 500 }
    );
  }
}

// POST - 즐겨찾기 추가
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { placeId, notes, tags } = await request.json();

    if (!placeId) {
      return NextResponse.json(
        { error: 'placeId is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    const favoritesCollection = db.collection('favorites');

    // 이미 저장되어 있는지 확인
    const existing = await favoritesCollection.findOne({
      userId: new ObjectId(session.user.id),
      placeId: new ObjectId(placeId),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Already in favorites' },
        { status: 409 }
      );
    }

    // 즐겨찾기 추가
    const result = await favoritesCollection.insertOne({
      userId: new ObjectId(session.user.id),
      placeId: new ObjectId(placeId),
      notes: notes || '',
      tags: tags || ['want_to_visit'],
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        message: 'Added to favorites',
        favoriteId: result.insertedId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add favorite error:', error);
    return NextResponse.json(
      { error: 'Failed to add favorite' },
      { status: 500 }
    );
  }
}

// DELETE - 즐겨찾기 삭제
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('placeId');

    if (!placeId) {
      return NextResponse.json(
        { error: 'placeId is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);

    const result = await db.collection('favorites').deleteOne({
      userId: new ObjectId(session.user.id),
      placeId: new ObjectId(placeId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Delete favorite error:', error);
    return NextResponse.json(
      { error: 'Failed to delete favorite' },
      { status: 500 }
    );
  }
}
