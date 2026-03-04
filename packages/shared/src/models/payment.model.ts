import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  paymentMethod: { type: String, default: "razorpay" },
  paymentStatus: {
    type: String,
    enum: ["PENDING", "SUCCESS", "FAILED"],
    default: "PENDING",
  },
  paymentDate: { type: Date, default: Date.now },

  // ADD THESE for Razorpay
  razorpaySubscriptionId: { type: String, required: true, unique: true },
  razorpayPaymentId: { type: String, default: null }, // filled after payment
  razorpaySignature: { type: String, default: null }, // filled after verification
  receipt: { type: String, default: null }, // your internal receipt ID
  idempotencyKey: { type: String, required: true, unique: true },
  razorpayInvoiceId: { type: String, default: null },
  invoiceS3Key: { type: String, default: null },
});

export default mongoose.model("Payment", paymentSchema);
