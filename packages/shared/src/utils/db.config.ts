import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log("✅ MongoDB already connected");
      return;
    }

    let uri = process.env.MONGODB_URI;

    if (!uri) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("Please provide MONGODB_URI in the environment variables");
      }
      uri = "mongodb://localhost:27017/weather-agent";
      console.warn("⚠️  Using local MongoDB fallback");
    }

    // AWS DocumentDB requires TLS and doesn't support retryWrites
    const isProduction = process.env.NODE_ENV === "production";
    const connectOptions: mongoose.ConnectOptions = isProduction
      ? {
          tls: true,
          tlsCAFile: process.env.DOCDB_CA_CERT_PATH || "/app/certs/global-bundle.pem",
          retryWrites: false, // DocumentDB does not support retryWrites
          directConnection: true, // Required for non-replica-set DocumentDB URI
        }
      : {};

    await mongoose.connect(uri, connectOptions);
    console.log(`✅ MongoDB connected${isProduction ? " (DocumentDB/TLS)" : ""}`);
  } catch (error) {
    console.error("Error connecting to database:", error);
    process.exit(1);
  }
};
