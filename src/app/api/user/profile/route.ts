import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, type Session } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

async function getUser(session: Session | null) {
  if (!session?.user?.email) return null;
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME);

  // Try ObjectId lookup first (credentials users whose id is a valid Mongo ObjectId)
  const id = session.user.id;
  if (id && ObjectId.isValid(id) && id.length === 24) {
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(id) },
      { projection: { password: 0 } }
    );
    if (user) return user;
  }

  // Fallback: lookup by email (Google OAuth users)
  return db.collection('users').findOne(
    { email: session.user.email },
    { projection: { password: 0 } }
  );
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await getUser(session);

  // Google users may not have a MongoDB document — return session data directly
  if (!user) {
    return NextResponse.json({
      id: session.user.id ?? null,
      name: session.user.name ?? '',
      email: session.user.email,
      image: session.user.image ?? null,
      provider: 'google',
      createdAt: null,
    });
  }

  return NextResponse.json({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    image: user.image ?? session.user.image ?? null,
    provider: user.provider ?? (user.password ? 'credentials' : 'google'),
    createdAt: user.createdAt ?? null,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { name, currentPassword, newPassword } = body;

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME);
  const usersCollection = db.collection('users');

  // Build the query — prefer ObjectId, fall back to email
  const id = session.user.id;
  const query = id && ObjectId.isValid(id) && id.length === 24
    ? { _id: new ObjectId(id) }
    : { email: session.user.email };

  const user = await usersCollection.findOne(query);
  if (!user) {
    return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};

  if (name && name.trim()) {
    updates.name = name.trim();
  }

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
    }
    if (!user.password) {
      return NextResponse.json({ error: 'Password change is not available for Google accounts' }, { status: 400 });
    }
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
    }
    updates.password = await bcrypt.hash(newPassword, 12);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
  }

  updates.updatedAt = new Date();
  await usersCollection.updateOne(query, { $set: updates });

  return NextResponse.json({ success: true, name: updates.name ?? user.name });
}
