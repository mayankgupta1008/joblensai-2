import { useState, useMemo } from "react";
import cuid from "cuid";
import axiosWrapper from "@/lib/axiosWrapper";

const CheckoutPage = () => {
  const [loading, setLoading] = useState(false);

  // Generate the key ONCE when the user reaches this page
  // It will stay the same until the page is refreshed or the order succeeds
  const idempotencyKey = useMemo(() => cuid(), []);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await axiosWrapper.post(
        "/payment/create-order",
        {
          amount: 100,
          currency: "INR",
        },
        {
          headers: {
            "X-Idempotency-Key": idempotencyKey,
          },
        },
      );
      // On SUCCESS: You might want to navigate away or clear the key
      console.log("Order Created:", response.data);
    } catch (error) {
      // On FAILURE: The user can click "Try Again".
      // Because we used useMemo, the 'idempotencyKey' is still the same,
      // so the backend will know it's a retry of the SAME order.
      console.log(error);
      alert("Payment failed, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handlePayment} disabled={loading}>
        {loading ? "Processing..." : "Pay Now"}
      </button>
    </div>
  );
};

export default CheckoutPage;
