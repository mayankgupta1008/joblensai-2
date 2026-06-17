import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FaBriefcase, FaCheck, FaClock, FaEnvelopeOpen, FaTimes, FaMagic } from "react-icons/fa";
import type { IconType } from "react-icons";

const roleTags = ["AI systems", "React", "Product thinking", "Remote"];

const stats: Array<{
  value: string;
  label: string;
  description: string;
  icon: IconType;
}> = [
  {
    value: "3,200+",
    label: "matches made",
    description: "High-intent intros sent through the swipe flow.",
    icon: FaBriefcase,
  },
  {
    value: "48h",
    label: "to first reply",
    description: "Average time from match to recruiter response.",
    icon: FaClock,
  },
  {
    value: "94%",
    label: "open rate",
    description: "AI outreach that gets seen by hiring teams.",
    icon: FaEnvelopeOpen,
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
    <section className="relative h-full overflow-hidden rounded-4xl border border-brand-border bg-background/40 backdrop-blur-3xl shadow-2xl selection:bg-emerald-500/30">
      {/* Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-full h-full bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_40%)] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-full h-full bg-[radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_40%)] pointer-events-none" />

      <div className="relative flex h-full flex-col p-8 sm:p-10 lg:p-12">
        <div className="space-y-4">
          <Badge
            variant="outline"
            className="px-4 py-1.5 border-brand-border bg-emerald-500/5 text-emerald-600 tracking-wide font-bold"
          >
            <FaMagic className="w-3.5 h-3.5 mr-2 text-emerald-500 animate-pulse" />
            AI POWERED MATCHING
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-black tracking-tighter leading-tight bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/60">
            {title}
          </h2>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground font-medium opacity-80">
            {description}
          </p>
        </div>

        <div className="relative mt-12 flex flex-1 items-center justify-center overflow-hidden rounded-4xl border border-brand-border bg-emerald-500/2 p-8">
          {/* Background Card Stacks */}
          <div className="absolute left-1/2 top-1/2 h-64 w-52 -translate-x-[58%] -translate-y-[48%] rounded-4xl border border-emerald-500/5 bg-background/20 backdrop-blur-md -rotate-6 opacity-40 shadow-xl sm:h-72 sm:w-60" />
          <div className="absolute left-1/2 top-1/2 h-72 w-56 -translate-x-[48%] -translate-y-[44%] rounded-4xl border border-brand-border bg-background/40 backdrop-blur-md rotate-3 opacity-60 shadow-xl sm:h-80 sm:w-64" />

          {/* Floating Status */}
          <div className="absolute right-6 top-6 animate-bounce whitespace-nowrap rounded-full border border-brand-border bg-emerald-500 text-white px-4 py-1.5 text-[10px] font-black tracking-[0.2em] uppercase shadow-lg shadow-emerald-500/20 z-30">
            Match queued
          </div>

          <Card className="relative z-20 w-full max-w-84 overflow-hidden rounded-4xl border border-brand-border bg-background/80 text-foreground shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in duration-700">
            <div className="relative overflow-hidden border-b border-brand-border bg-linear-to-b from-emerald-500/5 to-transparent px-6 pb-8 pt-6">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-500/10 blur-3xl" />

              <div className="relative flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <Badge className="border-none bg-emerald-500 text-white px-3 py-1 font-black text-[10px]">
                    96% MATCH
                  </Badge>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground opacity-60">
                    Series C • remote
                  </p>
                </div>
                <div className="size-10 rounded-full border border-brand-border bg-background/80 flex items-center justify-center shadow-inner">
                  <FaBriefcase className="w-4 h-4 text-emerald-500" />
                </div>
              </div>

              <div className="relative mt-12">
                <p className="text-xs font-black text-emerald-600/60 uppercase tracking-widest">
                  Founding Role
                </p>
                <h3 className="mt-2 text-2xl font-black tracking-tighter leading-tight">
                  Founding Product Engineer
                </h3>
                <p className="mt-2 text-sm font-bold text-muted-foreground opacity-80">
                  $180k - $220k • product & AI systems
                </p>
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-wrap gap-2">
                {roleTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-xl border border-brand-border bg-emerald-500/3 px-3 py-1.5 text-[11px] font-bold text-emerald-600/80"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-6 z-30">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-red-500/20 bg-background/80 text-red-500 shadow-xl hover:bg-red-500/5 transition-colors group cursor-pointer">
              <FaTimes className="h-6 w-6 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-brand-border bg-emerald-500 text-white shadow-2xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer">
              <FaCheck className="h-8 w-8" />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-4xl border border-brand-border bg-emerald-500/2 p-6 group/stat hover:bg-emerald-500/4 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-2xl font-black tracking-tighter">{stat.value}</p>
                  <div className="size-10 rounded-xl bg-background/80 border border-brand-border flex items-center justify-center group-hover/stat:scale-110 transition-transform shadow-inner">
                    <Icon className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>
                <p className="mt-3 text-xs font-black uppercase tracking-widest text-foreground opacity-60">
                  {stat.label}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground font-medium opacity-80">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AuthShowcase;
