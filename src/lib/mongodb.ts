import { MongoClient, Db } from 'mongodb';

let uri: string | undefined;
let dbName: string | undefined;

function getConnectionConfig() {
  if (!uri) {
    uri = process.env.MONGODB_URI;
    dbName = process.env.MONGODB_DB_NAME || 'dol-e';
    
    if (!uri) {
      throw new Error('Missing MONGODB_URI environment variable');
    }
  }
  return { uri, dbName: dbName! };
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve the client across hot reloads
  if (!global._mongoClientPromise) {
    const config = getConnectionConfig();
    client = new MongoClient(config.uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, create a new client
  const config = getConnectionConfig();
  client = new MongoClient(config.uri);
  clientPromise = client.connect();
}

export async function getDatabase(): Promise<Db> {
  const config = getConnectionConfig();
  const client = await clientPromise;
  return client.db(config.dbName);
}

export { clientPromise };
