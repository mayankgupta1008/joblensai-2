import { useState, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
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
import { Separator } from "@/components/ui/separator";
import { useNavigate, Link } from "react-router-dom";
import type { RootState } from "@/store/store";
import {
  Check,
  X,
  ShieldCheck,
  Zap,
  Rocket,
  Crown,
  ArrowRight,
  Sparkles,
  PartyPopper,
  AlertCircle,
  Loader2,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

// Razorpay types
interface RazorpayOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  handler: (response: RazorpaySubscriptionResponse) => void;
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

interface RazorpaySubscriptionResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
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

// Plan configurations
const PLANS = [
  {
    id: "free",
    name: "Explorer",
    price: "0",
    description: "Perfect for testing the waters",
    features: ["5 swipes per day", "Basic match logic", "Standard support", "Manual resume upload"],
    cta: "Current Plan",
    popular: false,
    color: "muted",
  },
  {
    id: "pro",
    name: "Pro Match",
    price: "100",
    description: "The ultimate edge for job seekers",
    features: [
      "Unlimited daily swipes",
      "AI-powered deep matching",
      "Personalized AI email drafting",
      "AI resume analysis",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    popular: true,
    color: "emerald",
  },
];

const SubscriptionPage = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const isPro = !!user?.subscriptionId;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "failed">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cancel subscription state
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelStatus, setCancelStatus] = useState<"idle" | "success" | "error">("idle");
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);

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
      const orderResponse = await axiosWrapper.post(
        "/payment/create-subscription",
        {
          amount: 100,
          currency: "INR",
        },
        {
          headers: {
            "X-Idempotency-Key": idempotencyKey,
          },
        }
      );

      const { subscription } = orderResponse.data;
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

      const options: RazorpayOptions = {
        key: razorpayKey,
        subscription_id: subscription.id,
        name: "JobLens AI",
        description: "Pro Match Plan",
        handler: async (response: RazorpaySubscriptionResponse) => {
          await verifyPayment(response);
        },
        prefill: {
          name: user?.fullName,
          email: user?.email,
        },
        theme: {
          color: "#10b981", // Emerald-500
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

  const verifyPayment = async (response: RazorpaySubscriptionResponse) => {
    try {
      await axiosWrapper.post("/payment/verify-subscription", {
        razorpay_subscription_id: response.razorpay_subscription_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        plan: "Pro Match",
      });

      setPaymentStatus("success");
    } catch (error) {
      console.error("Payment verification failed:", error);
      setErrorMessage("Payment verification failed. Please contact support.");
      setPaymentStatus("failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm("Are you sure you want to cancel your Pro subscription?")) return;

    setCancelLoading(true);
    setCancelStatus("idle");
    setCancelMessage(null);

    try {
      const response = await axiosWrapper.post("/payment/cancel-subscription");
      setCancelStatus("success");
      setCancelMessage(response.data.message);
    } catch (error: any) {
      setCancelStatus("error");
      setCancelMessage(error.response?.data?.message || "Failed to cancel subscription");
    } finally {
      setCancelLoading(false);
    }
  };

  if (paymentStatus === "success") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xl p-4">
        {/* Success "WOW" State */}
        <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
          <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-emerald-500/20 blur-[120px] animate-pulse" />
        </div>

        <Card className="max-w-md w-full rounded-4xl border-brand-border bg-background/60 shadow-2xl shadow-emerald-500/10 p-8 text-center space-y-6">
          <div className="w-24 h-24 rounded-3xl bg-emerald-500/10 flex items-center justify-center mx-auto animate-bounce">
            <PartyPopper className="w-12 h-12 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black tracking-tighter">You're Pro!</h2>
            <p className="text-muted-foreground">
              Welcome to the inner circle. Your premium features are now active.
            </p>
          </div>
          <div className="bg-emerald-500/5 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" /> Unlimited swipes unlocked
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" /> AI Resume analysis active
            </div>
          </div>
          <Button
            size="lg"
            className="w-full rounded-full h-14 text-lg font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-95"
            onClick={() => navigate("/dashboard")}
          >
            Go to Dashboard <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Ambient background blobs — match LandingPage/Dashboard vibe */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] rounded-full bg-linear-to-br from-emerald-500/15 to-blue-500/5 blur-[130px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[5%] right-[-10%] w-[40%] h-[40%] rounded-full bg-linear-to-tr from-purple-500/8 to-emerald-500/15 blur-[110px] opacity-30" />
      </div>

      <div className="container mx-auto px-4 md:px-8 py-10 md:py-20 max-w-6xl">
        {/* Header Section */}
        <header className="text-center space-y-6 mb-16">
          <Badge
            variant="outline"
            className="px-4 py-1.5 border-brand-border bg-emerald-500/5 text-emerald-600 tracking-wide"
          >
            <Sparkles className="w-3.5 h-3.5 mr-2 inline-block text-emerald-500" />
            Pricing Plans
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
            Choose your <br />
            <span className="bg-clip-text text-transparent bg-linear-to-r from-emerald-500 to-blue-600">
              Power Level.
            </span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            Upgrade your job search with AI-driven matching and unlimited swipes.
          </p>
        </header>

        {/* Subtle Current Plan & Management Area */}
        <section className="max-w-4xl mx-auto mb-12">
          <div className="rounded-3xl border border-brand-border bg-background/40 backdrop-blur-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 px-2">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  isPro ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                }`}
              >
                {isPro ? <Crown className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                  Your Current Plan
                </p>
                <p className="text-lg font-black tracking-tight flex items-center gap-2">
                  {isPro ? "Pro Match" : "Explorer (Free)"}
                  {isPro && (
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-brand-border text-[10px] h-5">
                      ACTIVE
                    </Badge>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isPro && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-xs font-semibold hover:text-destructive transition-colors"
                  onClick={handleCancelSubscription}
                  disabled={cancelLoading}
                >
                  {cancelLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <X className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Cancel Subscription
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-xs font-semibold border-brand-border"
                asChild
              >
                <Link to="/dashboard">
                  Dashboard <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Cancellation Messages */}
          {(cancelMessage || errorMessage) && (
            <div className="mt-4 px-4">
              <div
                className={`flex items-center gap-3 p-3 rounded-2xl border ${
                  cancelStatus === "success"
                    ? "bg-emerald-500/5 border-brand-border text-emerald-600"
                    : "bg-destructive/5 border-destructive/20 text-destructive"
                }`}
              >
                {cancelStatus === "success" ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0" />
                )}
                <p className="text-sm font-semibold">{cancelMessage || errorMessage}</p>
              </div>
            </div>
          )}
        </section>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`relative flex flex-col rounded-4xl border-2 transition-all duration-300 hover:-translate-y-2 ${
                plan.popular
                  ? "border-emerald-500 shadow-2xl shadow-emerald-500/10 bg-background/60"
                  : "border-brand-border bg-muted/20"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white border-none px-4 py-1 font-bold text-xs shadow-lg shadow-emerald-500/30">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" /> MOST POPULAR
                  </Badge>
                </div>
              )}

              <CardHeader className="p-8 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center ${
                      plan.popular ? "bg-emerald-500/10" : "bg-background"
                    }`}
                  >
                    {plan.id === "pro" ? (
                      <Rocket className="w-7 h-7 text-emerald-500" />
                    ) : (
                      <Zap className="w-7 h-7 text-muted-foreground" />
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-black tracking-tighter">₹{plan.price}</p>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                      per month
                    </p>
                  </div>
                </div>
                <CardTitle className="text-3xl font-black tracking-tight">{plan.name}</CardTitle>
                <CardDescription className="text-base mt-2 font-medium">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-8 pt-4 flex-1">
                <div className="space-y-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    What's included
                  </p>
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div
                          className={`mt-1 p-0.5 rounded-full ${
                            plan.popular ? "bg-emerald-500/10" : "bg-muted"
                          }`}
                        >
                          <Check
                            className={`w-3.5 h-3.5 ${
                              plan.popular ? "text-emerald-500" : "text-muted-foreground"
                            }`}
                          />
                        </div>
                        <span className="text-sm font-semibold">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>

              <CardFooter className="p-8 pt-0">
                <Button
                  size="lg"
                  disabled={
                    loading || (plan.id === "free" && !isPro) || (plan.id === "pro" && isPro)
                  }
                  className={`w-full h-14 rounded-full text-lg font-black transition-all active:scale-95 ${
                    plan.popular
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                  onClick={plan.id === "pro" ? handlePayment : undefined}
                >
                  {loading && plan.id === "pro" ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : plan.id === "pro" && isPro ? (
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5" /> Current Plan
                    </span>
                  ) : plan.id === "free" && !isPro ? (
                    "Current Plan"
                  ) : (
                    plan.cta
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Trust/Security Badge */}
        <section className="mt-20 text-center max-w-2xl mx-auto space-y-8">
          <Separator className="bg-brand-border" />
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 opacity-60">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span className="text-xs font-bold uppercase tracking-widest">Secure Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-500" />
              <span className="text-xs font-bold uppercase tracking-widest">
                Instant Activation
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <span className="text-xs font-bold uppercase tracking-widest">AI Guaranteed</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SubscriptionPage;
