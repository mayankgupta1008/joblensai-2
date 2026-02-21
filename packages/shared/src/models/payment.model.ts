import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  paymentMethod: { type: String, default: "razorpay" },
  paymentStatus: {
    type: String,
    enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
    default: "PENDING",
  },
  paymentDate: { type: Date, default: Date.now },

  // ADD THESE for Razorpay
  razorpayOrderId: { type: String, required: true, unique: true },
  razorpayPaymentId: { type: String }, // filled after payment
  razorpaySignature: { type: String }, // filled after verification
  receipt: { type: String }, // your internal receipt ID
  idempotencyKey: { type: String, required: true, unique: true },
  razorpayInvoiceId: { type: String },
  invoiceS3Key: { type: String },
});

export default mongoose.model("Payment", paymentSchema);
