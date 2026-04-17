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

    // Opt in to DocumentDB TLS explicitly via DOCDB_TLS=true.
    // NODE_ENV=production alone is not a reliable signal — self-hosted MongoDB
    // containers also run with NODE_ENV=production and don't speak TLS.
    const useDocDBTLS = process.env.DOCDB_TLS === "true";
    const connectOptions: mongoose.ConnectOptions = useDocDBTLS
      ? {
          tls: true,
          tlsCAFile: process.env.DOCDB_CA_CERT_PATH || "/app/certs/global-bundle.pem",
          retryWrites: false,
          directConnection: true,
        }
      : {};

    await mongoose.connect(uri, connectOptions);
    console.log(`✅ MongoDB connected${useDocDBTLS ? " (DocumentDB/TLS)" : ""}`);
  } catch (error) {
    console.error("Error connecting to database:", error);
    process.exit(1);
  }
};
