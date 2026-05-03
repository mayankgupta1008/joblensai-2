import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, CreditCard, Sparkles, Zap, ArrowRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const BillingTab = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border-brand-border bg-background/40 backdrop-blur-xl rounded-4xl shadow-xl overflow-hidden">
        <CardHeader className="p-8 border-b border-brand-border">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-inner">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black tracking-tight">
                Billing & Subscription
              </CardTitle>
              <CardDescription className="font-medium">
                Manage your plan, payment methods, and usage limits.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Plan */}
        <Card className="relative overflow-hidden border-2 border-emerald-500 bg-emerald-500/2 rounded-5xl shadow-2xl shadow-emerald-500/10">
          <div className="absolute top-0 right-0 p-6">
            <Badge className="bg-emerald-500 text-white font-black px-4 py-1 rounded-full shadow-lg shadow-emerald-500/20 tracking-tighter">
              CURRENT PLAN
            </Badge>
          </div>
          <CardHeader className="p-8 pb-4">
            <CardTitle className="flex items-center gap-3 text-3xl font-black tracking-tighter">
              <Sparkles className="w-8 h-8 text-emerald-500 animate-pulse" />
              Pro Plan
            </CardTitle>
            <CardDescription className="text-base font-bold text-emerald-600/80">
              Accelerated career growth
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-2 space-y-6">
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black tracking-tighter">$29</span>
              <span className="text-muted-foreground font-bold text-lg">/month</span>
            </div>
            <Separator className="bg-brand-border" />
            <ul className="space-y-4">
              <PlanFeature text="Unlimited job applications" />
              <PlanFeature text="Priority AI optimization" />
              <PlanFeature text="Direct dashboard access" />
              <PlanFeature text="Advanced recruiter matching" />
            </ul>
          </CardContent>
          <CardFooter className="p-8 pt-0">
            <Button
              className="w-full h-14 rounded-2xl font-black border-brand-border text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all shadow-sm"
              variant="outline"
              disabled
            >
              Managed by Stripe
            </Button>
          </CardFooter>
        </Card>

        <div className="space-y-8">
          {/* Payment Method */}
          <Card className="rounded-5xl border-brand-border bg-background/40 backdrop-blur-xl shadow-xl">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black tracking-tight flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-500" />
                Payment Method
              </CardTitle>
              <CardDescription className="font-medium">
                Your primary payment source for renewals.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-6">
              <div className="flex items-center justify-between p-6 border border-brand-border rounded-3xl bg-emerald-500/3 shadow-inner group hover:border-emerald-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-9 bg-linear-to-br from-slate-800 to-slate-900 rounded-lg flex items-center justify-center font-black text-[10px] text-white shadow-lg italic">
                    VISA
                  </div>
                  <div>
                    <p className="text-lg font-black tracking-tighter">•••• •••• •••• 4242</p>
                    <p className="text-xs text-muted-foreground font-bold tracking-widest uppercase opacity-60">
                      EXPIRES 12/28
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="rounded-full font-bold text-emerald-600 hover:bg-emerald-500/10"
                >
                  Edit
                </Button>
              </div>
              <div className="flex items-center gap-2 px-2">
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                <p className="text-xs text-muted-foreground font-bold italic">
                  Next billing cycle begins: May 23, 2026
                </p>
              </div>
            </CardContent>
            <CardFooter className="p-8 pt-0">
              <Button
                variant="ghost"
                className="w-full h-12 rounded-xl font-bold text-muted-foreground hover:bg-emerald-500/5 hover:text-emerald-600 transition-all"
              >
                Add new payment method
              </Button>
            </CardFooter>
          </Card>

          {/* Usage */}
          <Card className="rounded-5xl border-brand-border bg-background/40 backdrop-blur-xl shadow-xl">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black tracking-tight">Usage & Limits</CardTitle>
              <CardDescription className="font-medium">
                Your current cycle consumption of AI resources.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm font-black tracking-widest uppercase text-muted-foreground opacity-60">
                      AI CREDITS
                    </p>
                    <p className="text-3xl font-black tracking-tighter mt-1">850 / 1000</p>
                  </div>
                  <Badge
                    variant="outline"
                    className="rounded-full border-brand-border bg-emerald-500/5 font-bold text-emerald-600"
                  >
                    85% USED
                  </Badge>
                </div>
                <div className="h-3 w-full bg-emerald-500/10 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-linear-to-r from-emerald-500 to-blue-600 w-[85%] rounded-full shadow-lg" />
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-muted-foreground opacity-70">
                  <span>Usage resets in 12 days</span>
                  <Link
                    to="/subscription"
                    className="text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    Buy more credits <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transactions Link */}
      <div className="flex justify-center">
        <Button
          variant="link"
          className="text-muted-foreground font-bold hover:text-emerald-600 transition-colors"
        >
          View full transaction history
        </Button>
      </div>
    </div>
  );
};

const PlanFeature = ({ text }: { text: string }) => (
  <li className="flex items-center gap-3 font-medium text-foreground/90">
    <div className="size-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
      <Check className="w-3.5 h-3.5 text-emerald-600" />
    </div>
    <span className="tracking-tight">{text}</span>
  </li>
);

const Link = ({
  to,
  children,
  className,
}: {
  to: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <a href={to} className={cn("transition-all", className)}>
    {children}
  </a>
);

export default BillingTab;
