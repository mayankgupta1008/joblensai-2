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
        throw new Error(
          "Please provide MONGODB_URI in the environment variables",
        );
      }
      uri = "mongodb://localhost:27017/weather-agent";
      console.warn("⚠️  Using local MongoDB fallback");
    }

    await mongoose.connect(uri);
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("Error connecting to database:", error);
    process.exit(1);
  }
};
