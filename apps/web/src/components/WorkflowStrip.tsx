import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowRight, CheckCheck, Search, Send, Sparkles, type LucideIcon } from "lucide-react";

const workflowSteps: Array<{
  icon: LucideIcon;
  title: string;
  detail: string;
}> = [
  {
    icon: ArrowRight,
    title: "Swipe right",
    detail: "Approve the role when the fit feels real.",
  },
  {
    icon: Search,
    title: "AI reads context",
    detail: "Resume, job language, and company intent get parsed.",
  },
  {
    icon: Send,
    title: "Outreach drafts",
    detail: "A recruiter-ready intro is generated automatically.",
  },
  {
    icon: CheckCheck,
    title: "You get momentum",
    detail: "Move straight into replies instead of cold applies.",
  },
];

interface WorkflowStripProps {
  className?: string;
}

const WorkflowStrip = ({ className }: WorkflowStripProps) => {
  return (
    <section
      className={cn(
        "relative mx-auto w-full max-w-6xl overflow-hidden rounded-5xl border border-brand-border bg-background/40 backdrop-blur-xl px-6 py-10 text-left text-foreground shadow-2xl shadow-black/5 dark:shadow-white/5 sm:px-8 lg:px-12 transition-all",
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.04),transparent_28%)] pointer-events-none" />

      <div className="relative">
        <div className="flex flex-col gap-6 border-b border-brand-border pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge
              variant="outline"
              className="border-brand-border bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10 transition-colors"
            >
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Product workflow
            </Badge>
            <h2 className="mt-6 text-4xl font-black tracking-tighter sm:text-5xl leading-none">
              One swipe starts the <br />
              whole job-hunt engine.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg font-medium opacity-90">
              JobLens compresses discovery, research, and recruiter outreach into one clean flow.
            </p>
          </div>

          <div className="rounded-full border border-brand-border bg-emerald-500/5 px-5 py-2.5 text-sm font-bold text-emerald-600 shadow-sm">
            Under 20 seconds to first draft
          </div>
        </div>

        <div className="relative mt-10">
          {/* Connector line */}
          <div className="absolute left-10 right-10 top-10 hidden h-px bg-brand-border lg:block" />
          <div className="absolute left-10 top-10 hidden h-px w-32 bg-linear-to-r from-transparent via-emerald-500/80 to-transparent lg:block animate-workflow-line" />

          <div className="grid gap-6 lg:grid-cols-4">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.title}
                  className="animate-workflow-card relative rounded-4xl border border-brand-border bg-background/40 p-6 hover:bg-background/60 hover:border-brand-border transition-all group"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-border bg-background shadow-lg shadow-black/5 dark:shadow-white/5 group-hover:scale-110 group-hover:border-emerald-500/30 transition-all">
                    <Icon className="h-6 w-6 text-emerald-500 transition-colors group-hover:text-emerald-600" />
                  </div>

                  <p className="mt-6 text-2xl font-black tracking-tight">{step.title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground font-medium">
                    {step.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WorkflowStrip;
