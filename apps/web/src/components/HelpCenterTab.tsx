import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Mail,
  MessageSquare,
  Book,
  ExternalLink,
  LifeBuoy,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const HelpCenterTab = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border-emerald-500/10 bg-background/40 backdrop-blur-xl rounded-[2rem] shadow-xl overflow-hidden">
        <CardHeader className="p-8 border-b border-emerald-500/10">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-inner">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black tracking-tight">Help & Support</CardTitle>
              <CardDescription className="font-medium">
                Get assistance with your account, billing, and technical questions.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-10">
          {/* Search Help */}
          <div className="relative group/search max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within/search:text-emerald-500 transition-colors" />
            <Input
              className="pl-12 h-14 rounded-2xl bg-muted/30 border-emerald-500/10 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/40 transition-all font-medium text-lg"
              placeholder="Search for articles, guides, and help..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SupportCard
              icon={Book}
              title="Documentation"
              description="Browse our comprehensive guides"
            />
            <SupportCard
              icon={MessageSquare}
              title="Live Chat"
              description="Chat with our support team"
            />
            <SupportCard
              icon={Mail}
              title="Email Support"
              description="Send us a detailed request"
            />
          </div>

          <Separator className="bg-emerald-500/10" />

          {/* FAQ Section */}
          <div className="space-y-6">
            <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              Frequently Asked Questions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "How do I cancel my subscription?",
                "Can I export my resume in different formats?",
                "How does the AI optimization work?",
                "What happens after my trial ends?",
              ].map((q, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-5 rounded-2xl border border-emerald-500/5 bg-background/60 hover:border-emerald-500/20 hover:bg-emerald-500/[0.02] transition-all cursor-pointer group/faq"
                >
                  <span className="text-sm font-bold tracking-tight text-foreground/80 group-hover/faq:text-emerald-600 transition-colors">
                    {q}
                  </span>
                  <ExternalLink className="w-4 h-4 text-muted-foreground opacity-40 group-hover/faq:opacity-100 group-hover/faq:translate-x-0.5 group-hover/faq:-translate-y-0.5 transition-all" />
                </div>
              ))}
            </div>
          </div>

          <Separator className="bg-emerald-500/10" />

          {/* Contact Banner */}
          <div className="relative overflow-hidden p-10 rounded-[2.5rem] border border-emerald-500/10 bg-emerald-500/[0.03] text-center space-y-6">
            <div className="absolute top-[-20%] right-[-10%] w-60 h-60 rounded-full bg-emerald-500/10 blur-[80px]" />
            <div className="absolute bottom-[-20%] left-[-10%] w-60 h-60 rounded-full bg-blue-500/10 blur-[80px]" />

            <div className="relative space-y-2">
              <h3 className="text-2xl font-black tracking-tighter">Still need help?</h3>
              <p className="text-muted-foreground font-medium max-w-sm mx-auto opacity-80 leading-relaxed">
                Our team is available 24/7 to help you with any issues you might be facing.
              </p>
            </div>
            <Button className="h-14 px-10 rounded-full font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 active:scale-95 transition-all group">
              Contact Support
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const SupportCard = ({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) => (
  <Card className="rounded-[2rem] border-emerald-500/10 bg-background/60 backdrop-blur-md hover:border-emerald-500/40 hover:bg-emerald-500/[0.03] transition-all cursor-pointer group/support shadow-sm hover:shadow-xl">
    <CardHeader className="p-8 text-center items-center">
      <div className="size-16 bg-emerald-500/10 rounded-[1.25rem] flex items-center justify-center mb-4 group-hover/support:scale-110 transition-transform shadow-inner">
        <Icon className="w-8 h-8 text-emerald-600" />
      </div>
      <CardTitle className="text-lg font-black tracking-tight">{title}</CardTitle>
      <CardDescription className="text-sm font-medium opacity-80">{description}</CardDescription>
    </CardHeader>
  </Card>
);

const Separator = ({ className }: { className?: string }) => (
  <div className={`h-px w-full bg-border ${className}`} />
);

export default HelpCenterTab;
