import { MongoClient, ServerApiVersion } from 'mongodb';

const MONGODB_URI = "mongodb+srv://root:root@bice.l5pnh7p.mongodb.net/?retryWrites=true&w=majority&appName=BICE";
// const MONGODB_DB = process.env.MONGODB_DB; // Optional: if you want to specify the DB in the URI or here

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Global is used here to maintain a cached connection across hot reloads
// in development. This prevents connections from growing exponentially
// during API Route usage.

let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
    if (cachedClient) {
        return cachedClient;
    }

    const client = new MongoClient(MONGODB_URI!, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });

    try {
        await client.connect();
        console.log("Connected to MongoDB successfully with Server API options!");
        cachedClient = client;
        return client;
    } catch (error) {
        console.error("Failed to connect to MongoDB (with Server API options):", error);
        throw error;
    }
}

const clientPromise: Promise<MongoClient> = connectToDatabase();

export default clientPromise; 