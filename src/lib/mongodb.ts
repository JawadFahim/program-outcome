import { MongoClient } from 'mongodb';

const MONGODB_URI = "mongodb+srv://root:root@bice.l5pnh7p.mongodb.net/?retryWrites=true&w=majority&appName=BICE";

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cached: { client: MongoClient | null; promise: Promise<MongoClient> | null } = (global as any).mongo;

if (!cached) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cached = (global as any).mongo = { client: null, promise: null };
}

async function connectToDatabase() {
    if (cached.client) {
        return cached.client;
    }

    if (!cached.promise) {
        const opts = {
            serverSelectionTimeoutMS: 5000,
        };
        cached.promise = MongoClient.connect(MONGODB_URI, opts).then((client) => {
            return client;
        });
    }
    cached.client = await cached.promise;
    return cached.client;
}

export default connectToDatabase; 