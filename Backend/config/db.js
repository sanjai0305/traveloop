import mongoose from "mongoose";

// ─── SERVERLESS CONNECTION CACHE ─────────────────────────────────────────────
// Vercel runs serverless functions that are cold-started on each request.
// Caching the mongoose connection prevents a new TCP connection on every call.
// See: https://mongoosejs.com/docs/lambda.html

let cachedConnection = null;

const connectDB = async () => {
  // Return the cached connection if it's already alive
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    const err = new Error(
      "MONGO_URI is not defined. Set it in your environment variables (Vercel Dashboard → Settings → Environment Variables)."
    );
    console.error("[MongoDB]", err.message);
    // Do NOT call process.exit() in serverless — it would kill the function.
    // Throw so the caller (server.js) can handle gracefully.
    throw err;
  }

  // Warn if a local URI is used in a non-local environment (common Vercel mistake)
  if (
    (mongoURI.includes("127.0.0.1") || mongoURI.includes("localhost")) &&
    process.env.NODE_ENV === "production"
  ) {
    console.error(
      "[MongoDB] CRITICAL: MONGO_URI is pointing to localhost but NODE_ENV=production." +
        " Vercel cannot reach your local machine. Set a MongoDB Atlas URI in Vercel env vars."
    );
  }

  try {
    const opts = {
      // Keep the connection alive across serverless invocations
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000, // fail fast if Atlas is unreachable
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect(mongoURI, opts);
    cachedConnection = conn;
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("[MongoDB] Connection Error:", error.message);
    // Re-throw so server.js can skip DB-dependent routes gracefully
    throw error;
  }
};

export default connectDB;