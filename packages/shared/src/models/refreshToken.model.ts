import mongoose from "mongoose";
import crypto from "crypto";

const refreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  sid: {
    type: String,
    unique: true,
    sparse: true,
    default: () => crypto.randomUUID(),
    index: true,
  },
  ip: { type: String },
  deviceName: { type: String },
  lastUsedAt: { type: Date, default: Date.now },
  location: { type: String, default: null },
});

// Auto-delete expired tokens (TTL index)
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("RefreshToken", refreshTokenSchema);
