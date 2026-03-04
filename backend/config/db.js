// config/db.js
// Establishes a resilient Mongoose connection with retry logic.
// Atlas-compatible: reads MONGO_URI from environment.

const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not defined in environment variables");

  try {
    const conn = await mongoose.connect(uri, {
      // These options are the defaults in Mongoose 8 but kept explicit for clarity
      serverSelectionTimeoutMS: 5000, // fail fast during startup
      socketTimeoutMS: 45000,
    });

    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌  MongoDB connection error: ${error.message}`);
    // Exit so the process manager (PM2 / Docker) can restart the service
    process.exit(1);
  }
};

// Graceful shutdown helpers
mongoose.connection.on("disconnected", () =>
  console.warn("⚠️  MongoDB disconnected")
);
mongoose.connection.on("reconnected", () =>
  console.log("🔄  MongoDB reconnected")
);

module.exports = connectDB;
