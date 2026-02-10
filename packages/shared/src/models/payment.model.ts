import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    required: true,
    default: "INR",
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  paymentReferenceId: {
    type: String,
    required: true,
  },
  paymentStatus: {
    type: String,
    required: true,
  },
  paymentDate: {
    type: Date,
    required: true,
  },
});

export default mongoose.model("Payment", paymentSchema);
