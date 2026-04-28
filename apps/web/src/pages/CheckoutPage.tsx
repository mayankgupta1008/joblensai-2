import { useState, useMemo } from "react";
import cuid from "cuid";
import axiosWrapper from "@/lib/axiosWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, ShieldCheck, Sparkles, ArrowRight, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CheckoutPage = () => {
  const [loading, setLoading] = useState(false);

  // Generate the key ONCE when the user reaches this page
  const idempotencyKey = useMemo(() => cuid(), []);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await axiosWrapper.post(
        "/payment/create-order",
        {
          amount: 2900, // example amount in cents or local currency units
          currency: "USD",
        },
        {
          headers: {
            "X-Idempotency-Key": idempotencyKey,
          },
        }
      );
      console.log("Order Created:", response.data);
      toast.success("Order created successfully!");
    } catch (error) {
      console.log(error);
      toast.error("Payment failed, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen selection:bg-emerald-500/30 overflow-hidden bg-background">
      {/* Background Blobs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[55%] h-[55%] rounded-full bg-linear-to-bl from-emerald-500/15 to-blue-500/5 blur-[130px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[5%] left-[-15%] w-[50%] h-[50%] rounded-full bg-linear-to-tr from-blue-600/8 to-emerald-500/15 blur-[110px] opacity-30" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16 md:py-24 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 items-start">
          {/* Main Checkout Section */}
          <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="space-y-4">
              <Badge
                variant="outline"
                className="px-4 py-1.5 border-emerald-500/20 bg-emerald-500/5 text-emerald-600 tracking-wide font-bold"
              >
                <Lock className="w-3.5 h-3.5 mr-2 text-emerald-500" />
                SECURE CHECKOUT
              </Badge>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/60">
                Complete your <br />
                <span className="text-emerald-500">subscription.</span>
              </h1>
              <p className="text-muted-foreground text-lg font-medium max-w-xl">
                Unlock the full power of JobLens AI and start landing roles at your favorite
                companies.
              </p>
            </div>

            <Card className="rounded-[2.5rem] border-emerald-500/10 bg-background/40 backdrop-blur-xl shadow-2xl overflow-hidden">
              <CardHeader className="p-10 border-b border-emerald-500/10">
                <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-emerald-500" />
                  Payment Details
                </CardTitle>
                <CardDescription className="font-medium">
                  All transactions are encrypted and secure.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                {/* Simulated Payment Form */}
                <div className="p-8 rounded-[2rem] border-2 border-dashed border-emerald-500/20 bg-emerald-500/[0.02] flex flex-col items-center justify-center text-center space-y-4">
                  <div className="size-16 bg-emerald-500/10 rounded-[1.25rem] flex items-center justify-center shadow-inner">
                    <ShieldCheck className="w-8 h-8 text-emerald-500" />
                  </div>
                  <p className="text-lg font-black tracking-tight">Stripe Secure Payment</p>
                  <p className="text-sm text-muted-foreground font-medium opacity-80 max-w-xs">
                    You'll be redirected to Stripe's secure portal to complete your payment.
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground opacity-60 tracking-widest justify-center">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3" /> SSL SECURE
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">AES-256 BIT</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">PCI COMPLIANT</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Section */}
          <div className="lg:sticky lg:top-24 animate-in fade-in slide-in-from-right-4 duration-700">
            <Card className="rounded-[2.5rem] border-emerald-500/20 bg-emerald-500/[0.03] backdrop-blur-xl shadow-2xl overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-black tracking-tight">Order Summary</CardTitle>
                <CardDescription className="font-medium">Review your subscription</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="font-black text-lg tracking-tight">Pro Plan (Monthly)</p>
                    <p className="text-xs text-muted-foreground font-medium">Billed every month</p>
                  </div>
                  <p className="font-black text-xl tracking-tight">$29.00</p>
                </div>

                <Separator className="bg-emerald-500/10" />

                <div className="space-y-3">
                  <SummaryRow label="Subtotal" value="$29.00" />
                  <SummaryRow label="Tax" value="$0.00" />
                  <SummaryRow label="Total" value="$29.00" highlight />
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-black/40 border border-emerald-500/10 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600 font-black text-sm tracking-tight">
                    <Sparkles className="w-4 h-4" />
                    Pro Features Included:
                  </div>
                  <ul className="space-y-2 text-xs font-bold text-muted-foreground opacity-80">
                    <li className="flex items-center gap-2">
                      <div className="size-1.5 rounded-full bg-emerald-500" />
                      Unlimited Job Matches
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="size-1.5 rounded-full bg-emerald-500" />
                      Priority AI Optimization
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="size-1.5 rounded-full bg-emerald-500" />
                      Early Access to New Features
                    </li>
                  </ul>
                </div>

                <Button
                  className="w-full h-16 rounded-2xl font-black text-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xl shadow-emerald-500/30 active:scale-95 transition-all group mt-4"
                  onClick={handlePayment}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      Pay $29.00 Now
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
                <p className="text-[10px] text-center text-muted-foreground font-medium px-4 opacity-60">
                  By completing your purchase, you agree to our Terms of Service and Privacy Policy.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryRow = ({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <div className="flex justify-between items-center">
    <p
      className={cn(
        "text-sm font-medium",
        highlight ? "font-black text-base" : "text-muted-foreground"
      )}
    >
      {label}
    </p>
    <p
      className={cn(
        "font-bold tracking-tight",
        highlight ? "text-xl font-black text-emerald-600" : "text-foreground"
      )}
    >
      {value}
    </p>
  </div>
);

export default CheckoutPage;
