import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET /api/itinerary - Get all itineraries for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    const itinerariesCollection = db.collection('itineraries');

    const itineraries = await itinerariesCollection
      .find({ userId: new ObjectId(session.user.id) })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      itineraries: itineraries.map(it => ({
        ...it,
        _id: it._id.toString(),
        userId: it.userId.toString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching itineraries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch itineraries' },
      { status: 500 }
    );
  }
}

// POST /api/itinerary - Create a new itinerary
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, description, days, totalDays, budget, preferences } = body;

    if (!title || !days || !totalDays) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    const itinerariesCollection = db.collection('itineraries');

    const newItinerary = {
      userId: new ObjectId(session.user.id),
      title,
      description,
      days,
      totalDays,
      budget,
      preferences,
      isPublic: false,
      likes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await itinerariesCollection.insertOne(newItinerary);

    return NextResponse.json({
      itinerary: {
        ...newItinerary,
        _id: result.insertedId.toString(),
        userId: newItinerary.userId.toString(),
      },
    });
  } catch (error) {
    console.error('Error creating itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to create itinerary' },
      { status: 500 }
    );
  }
}

// DELETE /api/itinerary?id=xxx - Delete an itinerary
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const itineraryId = searchParams.get('id');

    if (!itineraryId) {
      return NextResponse.json(
        { error: 'Itinerary ID required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    const itinerariesCollection = db.collection('itineraries');

    // Ensure user owns this itinerary
    const result = await itinerariesCollection.deleteOne({
      _id: new ObjectId(itineraryId),
      userId: new ObjectId(session.user.id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Itinerary not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to delete itinerary' },
      { status: 500 }
    );
  }
}
