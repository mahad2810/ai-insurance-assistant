import mongoose from 'mongoose';
import { env } from './env';

// If MONGODB_URI is provided, use it; otherwise use a local connection
// Ensure we're connecting to the bajaj_hack database
const MONGODB_URI = env.MONGODB_URI || 'mongodb://localhost:27017/bajaj_hack';

// Make sure MONGODB_URI uses the correct database name
function ensureCorrectDatabase(uri: string): string {
  // If the URI already includes a database name, make sure it's 'bajaj_hack'
  if (uri.includes('mongodb+srv://') || uri.includes('mongodb://')) {
    // Extract the part before any query parameters
    const baseUri = uri.split('?')[0];
    
    // Check if there's a database name in the URI
    if (baseUri.split('/').length > 3) {
      // Replace the database name with bajaj_hack
      const parts = baseUri.split('/');
      const hostPart = parts.slice(0, 3).join('/');
      const queryPart = uri.includes('?') ? '?' + uri.split('?')[1] : '';
      return `${hostPart}/bajaj_hack${queryPart}`;
    } else {
      // Add bajaj_hack as the database name
      return baseUri + '/bajaj_hack' + (uri.includes('?') ? '?' + uri.split('?')[1] : '');
    }
  }
  
  return uri;
}

// Ensure we're connecting to the correct database
const MONGODB_URI_WITH_DB = ensureCorrectDatabase(MONGODB_URI);

// Connection state tracking
interface MongoConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Declare the global variable for connection caching
declare global {
  var mongoose: MongoConnection;
}

// Initialize the cached connection
const cached: MongoConnection = global.mongoose || { conn: null, promise: null };
if (!global.mongoose) {
  global.mongoose = cached;
}

/**
 * Connect to MongoDB
 * - Uses connection caching for better performance in serverless environments
 * - Includes better error handling and connection options for MongoDB Atlas
 * - Connects to the bajaj_hack database
 */
async function dbConnect(): Promise<typeof mongoose> {
  // If we already have a connection, return it
  if (cached.conn) {
    return cached.conn;
  }

  // If a connection is already in progress, wait for it
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, avoid issues with IPv6
      retryWrites: true,
    };

    console.log(`Connecting to MongoDB: ${MONGODB_URI_WITH_DB.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);

    cached.promise = mongoose
      .connect(MONGODB_URI_WITH_DB, opts)
      .then((mongoose) => {
        console.log('Connected to MongoDB bajaj_hack database');
        return mongoose;
      })
      .catch((error) => {
        console.error('MongoDB connection error:', error);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect; 