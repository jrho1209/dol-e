import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET /api/conversations - Get user's conversations
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
    const conversationsCollection = db.collection('conversations');

    // Get all conversations for the user
    const conversations = await conversationsCollection
      .find({ userId: session.user.id })
      .sort({ updatedAt: -1 })
      .toArray();

    return NextResponse.json({
      conversations: conversations.map(conv => ({
        ...conv,
        _id: conv._id.toString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create or update a conversation
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
    const { conversationId, messages, title } = body;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME);
    const conversationsCollection = db.collection('conversations');

    if (conversationId) {
      // Update existing conversation
      const result = await conversationsCollection.updateOne(
        { 
          _id: new ObjectId(conversationId),
          userId: session.user.id
        },
        {
          $set: {
            messages,
            title: title || messages[messages.length - 1]?.content?.substring(0, 50) || 'Untitled',
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ 
        conversationId,
        success: true 
      });
    } else {
      // Create new conversation
      const newConversation = {
        userId: session.user.id,
        title: title || messages[0]?.content?.substring(0, 50) || 'New Conversation',
        messages,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await conversationsCollection.insertOne(newConversation);

      return NextResponse.json({
        conversationId: result.insertedId.toString(),
        success: true,
      });
    }
  } catch (error) {
    console.error('Error saving conversation:', error);
    return NextResponse.json(
      { error: 'Failed to save conversation' },
      { status: 500 }
    );
  }
}

// DELETE - Moved to /api/conversations/[id]/route.ts for cleaner API structure
