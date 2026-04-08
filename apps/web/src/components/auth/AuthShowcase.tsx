import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BriefcaseBusiness, Check, Clock3, MailOpen, X, type LucideIcon } from "lucide-react";

const roleTags = ["AI systems", "React", "Product thinking", "Remote"];

const stats: Array<{
  value: string;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    value: "3,200+",
    label: "matches made",
    description: "High-intent intros sent through the swipe flow.",
    icon: BriefcaseBusiness,
  },
  {
    value: "48h",
    label: "to first reply",
    description: "Average time from match to recruiter response.",
    icon: Clock3,
  },
  {
    value: "94%",
    label: "open rate",
    description: "AI outreach that gets seen by hiring teams.",
    icon: MailOpen,
  },
];

interface AuthShowcaseProps {
  title?: string;
  description?: string;
}

const AuthShowcase = ({
  title = "Swipe into the roles worth your time.",
  description = "High-intent matches first. JobLens AI drafts the outreach the moment the fit is real.",
}: AuthShowcaseProps) => {
  return (
    <section className="relative h-full overflow-hidden rounded-[2rem] border border-border/60 bg-card/90 text-foreground shadow-[0_35px_80px_-45px_rgba(0,0,0,0.22)] backdrop-blur-xl dark:shadow-[0_35px_80px_-45px_rgba(255,255,255,0.08)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,0,0,0.06),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.03),transparent_45%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.03),transparent_45%)]" />

      <div className="relative flex h-full flex-col p-6 sm:p-8 lg:p-10">
        <div className="mt-5 max-w-xl">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
        </div>

        <div className="relative mt-8 flex flex-1 items-center justify-center overflow-hidden rounded-[1.75rem] border border-border/60 bg-muted/25 px-4 py-8 sm:px-8">
          <div className="absolute left-1/2 top-1/2 h-64 w-52 -translate-x-[56%] -translate-y-[46%] rounded-[2rem] border border-border/50 bg-background/60 shadow-[0_20px_50px_-34px_rgba(0,0,0,0.14)] dark:shadow-[0_20px_50px_-34px_rgba(255,255,255,0.06)] sm:h-72 sm:w-60" />
          <div className="absolute left-1/2 top-1/2 h-72 w-56 -translate-x-[46%] -translate-y-[42%] rounded-[2rem] border border-border/60 bg-background/80 shadow-[0_20px_50px_-34px_rgba(0,0,0,0.16)] dark:shadow-[0_20px_50px_-34px_rgba(255,255,255,0.07)] sm:h-80 sm:w-64" />

          <div className="animate-login-pill-float absolute right-4 top-4 rounded-full border border-border/60 bg-background/85 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-primary uppercase sm:right-6 sm:top-6">
            Match queued
          </div>

          <Card className="animate-login-card-swipe relative z-20 w-full max-w-[20rem] overflow-hidden rounded-[2rem] border border-border/60 bg-card/95 text-foreground shadow-[0_30px_75px_-40px_rgba(0,0,0,0.18)] backdrop-blur-xl dark:shadow-[0_30px_75px_-40px_rgba(255,255,255,0.08)]">
            <div className="relative overflow-hidden border-b border-border/60 bg-[linear-gradient(180deg,rgba(0,0,0,0.05)_0%,rgba(255,255,255,0.02)_100%)] px-5 pb-6 pt-5 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_100%)]">
              <div className="absolute right-[-3rem] top-[-3rem] h-28 w-28 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute bottom-[-2rem] left-[-2rem] h-24 w-24 rounded-full bg-primary/[0.08] blur-3xl" />

              <div className="relative flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <Badge className="border border-border/60 bg-primary/[0.06] text-primary hover:bg-primary/[0.06]">
                    96% match
                  </Badge>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Series C • remote
                  </p>
                </div>
                <span className="inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-border/60 bg-background/80 px-4 text-[10px] font-semibold leading-none uppercase tracking-[0.18em] text-muted-foreground">
                  Just posted
                </span>
              </div>

              <div className="relative mt-12">
                <p className="text-sm font-medium text-foreground/80">JobLens AI</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight">
                  Founding Product Engineer
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  $180k - $220k • product & AI systems
                </p>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex flex-wrap gap-2">
                {roleTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border/60 bg-muted/45 px-3 py-1 text-[11px] font-semibold text-foreground/75"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-background/90 text-muted-foreground shadow-[0_10px_30px_-22px_rgba(0,0,0,0.16)] dark:shadow-[0_10px_30px_-22px_rgba(255,255,255,0.07)]">
              <X className="h-5 w-5" />
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border/60 bg-background text-primary shadow-[0_15px_35px_-22px_rgba(0,0,0,0.18)] dark:shadow-[0_15px_35px_-22px_rgba(255,255,255,0.08)]">
              <Check className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-[1.5rem] border border-border/60 bg-muted/35 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-2xl font-black tracking-tight">{stat.value}</p>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-background/90">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">{stat.label}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{stat.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AuthShowcase;
