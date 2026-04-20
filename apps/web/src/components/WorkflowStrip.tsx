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
        "relative mx-auto mt-24 w-full max-w-6xl overflow-hidden rounded-[2rem] border border-border/60 bg-card/90 px-6 py-8 text-left text-foreground shadow-[0_35px_90px_-55px_rgba(0,0,0,0.22)] backdrop-blur-xl dark:shadow-[0_35px_90px_-55px_rgba(255,255,255,0.08)] sm:px-8 lg:px-10",
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,0,0,0.06),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_38%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_38%)]" />

      <div className="relative">
        <div className="flex flex-col gap-4 border-b border-border/60 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge className="border border-border/60 bg-primary/5 text-primary hover:bg-primary/5">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Product workflow
            </Badge>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              One swipe starts the whole job-hunt engine.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              JobLens compresses discovery, research, and recruiter outreach into one clean flow.
            </p>
          </div>

          <div className="rounded-full border border-border/60 bg-muted/60 px-4 py-2 text-sm font-semibold text-foreground">
            Under 20 seconds to first draft
          </div>
        </div>

        <div className="relative mt-8">
          <div className="absolute left-8 right-8 top-8 hidden h-px bg-border/70 lg:block" />
          <div className="absolute left-8 top-8 hidden h-px w-28 bg-linear-to-r from-transparent via-primary/80 to-transparent lg:block animate-workflow-line" />

          <div className="grid gap-4 lg:grid-cols-4">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.title}
                  className="animate-workflow-card relative rounded-[1.5rem] border border-border/70 bg-muted/40 p-5"
                  style={{ animationDelay: `${index * 1.05}s` }}
                >
                  <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-border/70 bg-background shadow-[0_18px_36px_-28px_rgba(0,0,0,0.16)] dark:shadow-[0_18px_36px_-28px_rgba(255,255,255,0.08)]">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>

                  <p className="mt-5 text-xl font-black tracking-tight">{step.title}</p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.detail}</p>
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
