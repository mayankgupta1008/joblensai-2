import { useState, useMemo, useEffect } from "react";
import cuid from "cuid";
import axiosWrapper from "@/lib/axiosWrapper";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

// Razorpay types
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: () => void) => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

// Plan configuration - hardcoded for testing
const PLAN = {
  name: "Pro Plan",
  price: 100, // INR
  currency: "INR",
  features: ["30 days access", "Unlimited job swipes", "AI resume analysis", "Priority support"],
};

const SubscriptionPage = () => {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "failed">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  // Generate idempotency key once per page load
  const idempotencyKey = useMemo(() => cuid(), []);

  // Load Razorpay script on mount
  useEffect(() => {
    const scriptId = "razorpay-checkout-script";

    if (document.getElementById(scriptId)) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setErrorMessage("Failed to load payment gateway. Please refresh.");
    document.body.appendChild(script);

    return () => {
      // Cleanup not needed - keep script loaded for subsequent visits
    };
  }, []);

  const handlePayment = async () => {
    if (!scriptLoaded) {
      setErrorMessage("Payment gateway not loaded. Please refresh the page.");
      return;
    }

    setLoading(true);
    setPaymentStatus("processing");
    setErrorMessage(null);

    try {
      // Step 1: Create order on backend
      const orderResponse = await axiosWrapper.post(
        "/payment/create-order",
        {
          amount: PLAN.price,
          currency: PLAN.currency,
        },
        {
          headers: {
            "X-Idempotency-Key": idempotencyKey,
          },
        }
      );

      const { order } = orderResponse.data;

      // Step 2: Open Razorpay checkout modal
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

      const options: RazorpayOptions = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: "JobLens AI",
        description: PLAN.name,
        order_id: order.id,
        handler: async (response: RazorpayResponse) => {
          // Step 3: Verify payment on backend
          await verifyPayment(response);
        },
        prefill: {
          // These could be populated from user state if available
        },
        theme: {
          color: "#6366f1", // Indigo
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setPaymentStatus("idle");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment initiation failed:", error);
      setErrorMessage("Failed to initiate payment. Please try again.");
      setPaymentStatus("failed");
      setLoading(false);
    }
  };

  const verifyPayment = async (response: RazorpayResponse) => {
    try {
      await axiosWrapper.post("/payment/verify-order", {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        plan: PLAN.name,
      });

      setPaymentStatus("success");
      navigate("/dashboard");
    } catch (error) {
      console.error("Payment verification failed:", error);
      setErrorMessage("Payment verification failed. Please contact support.");
      setPaymentStatus("failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Subscription</h1>
          <p className="text-muted-foreground">Subscribe to unlock premium features</p>
        </div>

        {/* Payment Status Banner */}
        {paymentStatus === "success" && (
          <Card className="border-green-500 bg-green-50 dark:bg-green-950">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-200">
                    Payment Successful!
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Check your email for the invoice. Your subscription is now active.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {paymentStatus === "failed" && errorMessage && (
          <Card className="border-red-500 bg-red-50 dark:bg-red-950">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-red-800 dark:text-red-200">Payment Failed</h3>
                  <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plan Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{PLAN.name}</CardTitle>
              <Badge variant="secondary">Most Popular</Badge>
            </div>
            <CardDescription>Perfect for job seekers who want an edge</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">₹{PLAN.price}</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-2">
              {PLAN.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              size="lg"
              onClick={handlePayment}
              disabled={loading || !scriptLoaded || paymentStatus === "success"}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : paymentStatus === "success" ? (
                "Already Subscribed"
              ) : !scriptLoaded ? (
                "Loading..."
              ) : (
                `Subscribe for ₹${PLAN.price}`
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Test Mode Notice */}
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 text-yellow-600 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-sm">
                <p className="font-medium text-yellow-800 dark:text-yellow-200">Test Mode</p>
                <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                  Use Razorpay test card:{" "}
                  <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
                    4111 1111 1111 1111
                  </code>
                </p>
                <p className="text-yellow-700 dark:text-yellow-300">
                  Any future expiry date and any CVV.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionPage;
