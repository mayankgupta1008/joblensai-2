import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import type { RootState } from "@/store/store";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sparkles,
  Flame,
  ArrowRight,
  ArrowUpRight,
  Heart,
  MessageSquare,
  Briefcase,
  CheckCircle2,
  TrendingUp,
  Zap,
  MapPin,
  Rocket,
  Target,
  Calendar,
  PartyPopper,
  Circle,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DashboardPage = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const firstName = user?.fullName?.split(" ")[0] ?? "there";

  return (
    <div className="relative min-h-screen selection:bg-emerald-500/30 overflow-x-hidden bg-background">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] rounded-full bg-linear-to-br from-emerald-500/15 to-blue-500/5 blur-[130px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[5%] right-[-10%] w-[40%] h-[40%] rounded-full bg-linear-to-tr from-blue-600/8 to-emerald-500/15 blur-[110px] opacity-30" />
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-8 py-10 md:py-16 max-w-7xl">
        {/* Weekly Recap Ribbon */}
        <WeeklyRecap />

        {/* Header Section */}
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <div className="space-y-4">
            <Badge
              variant="outline"
              className="px-4 py-1.5 border-brand-border bg-emerald-500/5 text-emerald-600 tracking-wide font-bold"
            >
              <Sparkles className="w-3.5 h-3.5 mr-2 text-emerald-500 animate-pulse" />
              SYSTEMS ONLINE
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/60 leading-[0.95]">
              Welcome back,
              <br />
              <span className="text-emerald-500">{firstName}.</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-xl font-medium opacity-80 leading-relaxed">
              You have{" "}
              <span className="text-foreground font-black tracking-tight">3 new matches</span> and{" "}
              <span className="text-foreground font-black tracking-tight">12 AI drafts</span>{" "}
              waiting for your approval.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <Button
              variant="outline"
              size="lg"
              className="h-14 px-8 rounded-full font-black border-brand-border bg-background/40 backdrop-blur-md hover:bg-emerald-500/5 transition-all"
              asChild
            >
              <Link to="/subscription">
                <Rocket className="w-5 h-5 mr-3 text-emerald-500" />
                Upgrade to Pro
              </Link>
            </Button>
            <Button
              size="lg"
              className="h-14 px-10 rounded-full font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xl shadow-emerald-500/30 active:scale-95 group transition-all"
              asChild
            >
              <Link to="/upload">
                Resume Swiping
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-8">
            {/* Stats Overview */}
            <FunnelStrip />

            {/* Active Matches Rail */}
            <ActiveMatches />

            {/* Recommended Jobs */}
            <RecommendedJobs />
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4 space-y-8">
            <StreakCard />
            <ProfileStrength />
            <AIUsageCard />
            <TodayAgenda />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Weekly Recap Ribbon                                                 */
/* ------------------------------------------------------------------ */
const WeeklyRecap = () => (
  <div className="mb-10 group relative overflow-hidden rounded-[2.5rem] border border-brand-border bg-background/40 backdrop-blur-xl p-6 md:p-8 shadow-xl">
    <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-[100px] opacity-40 group-hover:opacity-60 transition-all duration-700" />
    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="flex items-center gap-6">
        <div className="size-16 rounded-[1.25rem] bg-emerald-500/10 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
          <PartyPopper className="w-8 h-8 text-emerald-500" />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-black opacity-50">
            Performance Insights
          </p>
          <p className="text-lg md:text-xl font-black tracking-tight leading-tight">
            You swiped <span className="text-emerald-500">143 jobs</span>, matched{" "}
            <span className="text-emerald-500">8</span>, and landed{" "}
            <span className="text-blue-500">2 interviews</span> this week.
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        className="h-12 rounded-full px-6 font-black hover:bg-emerald-500/10 text-emerald-600 transition-all group"
      >
        View full recap
        <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
      </Button>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Streak Card                                                         */
/* ------------------------------------------------------------------ */
const StreakCard = () => {
  const goal = 25;
  const done = 18;
  const pct = (done / goal) * 100;
  const radius = 58;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;

  return (
    <Card className="rounded-[2.5rem] border-brand-border bg-background/40 backdrop-blur-xl shadow-xl p-8 hover:bg-background/60 transition-all group overflow-hidden">
      <div className="absolute -top-20 -left-20 size-40 bg-orange-500/10 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black opacity-60">
            Consistency
          </p>
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500 fill-orange-500/20" />
            <span className="text-2xl font-black tracking-tighter">7-day streak</span>
          </div>
        </div>
        <Badge
          variant="outline"
          className="border-orange-500/20 bg-orange-500/5 text-orange-500 font-black text-[10px] tracking-widest px-3"
        >
          ON FIRE
        </Badge>
      </div>

      <div className="flex items-center justify-center py-4 relative z-10">
        <div className="relative size-44 group-hover:scale-105 transition-transform duration-500">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
            <circle
              cx="70"
              cy="70"
              r={radius}
              strokeWidth="12"
              className="stroke-muted/30 fill-none"
            />
            <circle
              cx="70"
              cy="70"
              r={radius}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              className="stroke-emerald-500 fill-none transition-all duration-1000 shadow-lg"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-black tracking-tighter text-foreground">{done}</span>
            <span className="text-xs text-muted-foreground font-black uppercase tracking-widest opacity-60">
              of {goal} today
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-8 relative z-10">
        <span className="text-xs font-bold text-muted-foreground">
          <TrendingUp className="w-4 h-4 inline mr-1.5 text-emerald-500" />
          28% above avg
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/5 transition-all"
        >
          View Stats
        </Button>
      </div>
    </Card>
  );
};

/* ------------------------------------------------------------------ */
/* Funnel Strip                                                        */
/* ------------------------------------------------------------------ */
const FunnelStrip = () => {
  const stats = [
    {
      label: "Swiped",
      value: 143,
      delta: "+18%",
      icon: Heart,
      tone: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Matched",
      value: 24,
      delta: "+12%",
      icon: Sparkles,
      tone: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Replied",
      value: 11,
      delta: "+6%",
      icon: MessageSquare,
      tone: "text-blue-600",
      bg: "bg-blue-600/10",
    },
    {
      label: "Interviews",
      value: 3,
      delta: "+50%",
      icon: Briefcase,
      tone: "text-emerald-600",
      bg: "bg-emerald-600/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {stats.map((s) => (
        <Card
          key={s.label}
          className="rounded-[2rem] border-brand-border bg-background/40 backdrop-blur-xl shadow-xl hover:bg-background/60 transition-all p-6 space-y-4 group/card overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div
              className={`size-11 rounded-xl ${s.bg} flex items-center justify-center shadow-inner group-hover/card:scale-110 transition-transform`}
            >
              <s.icon className={`w-5 h-5 ${s.tone}`} />
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-600 text-[10px] font-black border-none px-2 h-5">
              {s.delta}
            </Badge>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black opacity-60 mb-1">
              {s.label}
            </p>
            <p className="text-4xl font-black tracking-tighter">{s.value}</p>
          </div>
          <Sparkline color={s.tone.includes("emerald") ? "#10b981" : "#3b82f6"} />
        </Card>
      ))}
    </div>
  );
};

const Sparkline = ({ color }: { color: string }) => {
  const points = [8, 12, 9, 14, 11, 18, 16, 22, 19, 26];
  const max = Math.max(...points);
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * 100;
      const y = 30 - (p / max) * 28;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 30"
      className="w-full h-10 opacity-40 group-hover/card:opacity-100 transition-opacity"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`fill-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L100,30 L0,30 Z`} fill={`url(#fill-${color})`} />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* Active Matches                                                       */
/* ------------------------------------------------------------------ */
const matches = [
  { company: "Acme Corp", role: "Senior FE Engineer", salary: "$140–180k", unread: true, pct: 94 },
  { company: "Stripe", role: "Product Engineer", salary: "$160–200k", unread: true, pct: 91 },
  { company: "Linear", role: "Design Engineer", salary: "$150–190k", unread: false, pct: 89 },
  { company: "Vercel", role: "Full-stack Dev", salary: "$135–175k", unread: true, pct: 86 },
];

const ActiveMatches = () => (
  <Card className="rounded-[2.5rem] border-brand-border bg-background/40 backdrop-blur-xl p-8 space-y-8 shadow-xl">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="size-14 rounded-[1.25rem] bg-blue-500/10 flex items-center justify-center shadow-inner">
          <Heart className="w-7 h-7 text-blue-500 fill-blue-500/20" />
        </div>
        <div>
          <CardTitle className="text-2xl font-black tracking-tight">Active Matches</CardTitle>
          <p className="text-sm font-medium text-muted-foreground opacity-80 mt-1">
            Recruiters who swiped right on you recently.
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        className="rounded-full h-12 px-6 font-black hover:bg-blue-500/5 text-blue-600 group"
      >
        See all{" "}
        <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
      </Button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {matches.map((m) => (
        <div
          key={m.company}
          className="rounded-[2rem] border border-brand-border bg-background/60 p-6 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all group cursor-pointer"
        >
          <div className="flex items-start justify-between mb-6">
            <Avatar className="size-14 ring-4 ring-brand-border">
              <AvatarImage src={`https://api.dicebear.com/7.x/shapes/svg?seed=${m.company}`} />
              <AvatarFallback>{m.company[0]}</AvatarFallback>
            </Avatar>
            {m.unread && (
              <span className="relative flex h-3 w-3 mt-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            )}
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50 mb-1">
            {m.company}
          </p>
          <p className="font-black text-base mb-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">
            {m.role}
          </p>
          <p className="text-sm font-bold text-muted-foreground opacity-80 mb-6">{m.salary}</p>
          <div className="flex items-center justify-between">
            <Badge className="bg-emerald-500 text-white font-black text-[10px] border-none px-2 h-6">
              {m.pct}% match
            </Badge>
            <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
        </div>
      ))}
    </div>
  </Card>
);

/* ------------------------------------------------------------------ */
/* Recommended Jobs                                                     */
/* ------------------------------------------------------------------ */
const jobs = [
  {
    company: "Notion",
    role: "Senior Product Engineer",
    location: "Remote · US",
    salary: "$170–210k",
    pct: 96,
    featured: true,
  },
  {
    company: "Anthropic",
    role: "Frontend Engineer",
    location: "SF · Hybrid",
    salary: "$180–240k",
    pct: 93,
    featured: false,
  },
];

const RecommendedJobs = () => (
  <Card className="rounded-[2.5rem] border-brand-border bg-background/40 backdrop-blur-xl p-8 space-y-8 shadow-xl">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="size-14 rounded-[1.25rem] bg-emerald-500/10 flex items-center justify-center shadow-inner">
          <Sparkles className="w-7 h-7 text-emerald-500" />
        </div>
        <div>
          <CardTitle className="text-2xl font-black tracking-tight">Next Best Swipes</CardTitle>
          <p className="text-sm font-medium text-muted-foreground opacity-80 mt-1">
            AI-curated roles matching your unique DNA.
          </p>
        </div>
      </div>
      <Button className="h-12 px-8 rounded-full font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 active:scale-95">
        Start swiping
      </Button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {jobs.map((job) => (
        <div
          key={job.company}
          className={cn(
            "relative rounded-[2rem] p-8 hover:-translate-y-1 transition-all cursor-pointer group",
            job.featured
              ? "border-2 border-brand-border bg-emerald-500/[0.03]"
              : "border border-brand-border bg-background/40 hover:bg-background/80"
          )}
        >
          {job.featured && (
            <Badge className="absolute -top-3 left-8 text-[10px] font-black tracking-widest bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
              TOP PICK
            </Badge>
          )}
          <div className="flex items-start justify-between mb-8">
            <Avatar className="size-16 ring-4 ring-background/50 shadow-xl">
              <AvatarImage src={`https://api.dicebear.com/7.x/shapes/svg?seed=${job.company}`} />
              <AvatarFallback>{job.company[0]}</AvatarFallback>
            </Avatar>
            <Badge
              variant="outline"
              className="border-brand-border bg-emerald-500/10 text-emerald-600 font-black px-3 py-1"
            >
              {job.pct}% MATCH
            </Badge>
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-50 mb-1">
            {job.company}
          </p>
          <h3 className="text-2xl font-black tracking-tight mb-4 group-hover:text-emerald-600 transition-colors leading-tight">
            {job.role}
          </h3>
          <div className="flex items-center gap-4 text-sm font-bold text-muted-foreground opacity-80">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> {job.location}
            </span>
            <span className="text-foreground font-black tracking-tight">{job.salary}</span>
          </div>
        </div>
      ))}
    </div>
  </Card>
);

/* ------------------------------------------------------------------ */
/* Profile Strength                                                     */
/* ------------------------------------------------------------------ */
const ProfileStrength = () => {
  const pct = 72;
  return (
    <Card className="rounded-[2.5rem] border-brand-border bg-background/40 backdrop-blur-xl p-8 space-y-6 shadow-xl overflow-hidden group">
      <div className="absolute -bottom-10 -right-10 size-40 bg-blue-500/10 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-center gap-4 relative z-10">
        <div className="size-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shadow-inner">
          <Target className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <CardTitle className="text-xl font-black tracking-tight">Profile Strength</CardTitle>
          <p className="text-xs font-medium text-muted-foreground opacity-80">
            Complete for better matching.
          </p>
        </div>
      </div>

      <div className="relative z-10">
        <div className="flex items-baseline justify-between mb-4">
          <span className="text-5xl font-black tracking-tighter text-foreground">{pct}%</span>
          <Badge
            variant="ghost"
            className="bg-blue-500/10 text-blue-600 font-black text-[10px] uppercase tracking-widest"
          >
            +18% REACH
          </Badge>
        </div>
        <Progress value={pct} className="h-3 bg-blue-500/10" />
      </div>

      <div className="space-y-4 relative z-10 pt-4">
        <StrengthItem label="Resume Uploaded" done />
        <StrengthItem label="Bio Optimized" done />
        <StrengthItem label="Portfolio Linked" />
      </div>

      <Button
        variant="outline"
        className="w-full h-12 rounded-2xl font-black border-blue-500/10 hover:bg-blue-500/5 text-blue-600 transition-all mt-4 relative z-10"
      >
        Complete Profile
      </Button>
    </Card>
  );
};

const StrengthItem = ({ label, done }: { label: string; done?: boolean }) => (
  <div className="flex items-center gap-3 text-sm">
    <div
      className={cn(
        "size-5 rounded-full flex items-center justify-center shadow-inner",
        done ? "bg-emerald-500/10 text-emerald-500" : "bg-muted/40 text-muted-foreground"
      )}
    >
      {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
    </div>
    <span
      className={cn(
        "font-bold tracking-tight",
        done ? "text-muted-foreground/60 line-through" : "text-foreground/80"
      )}
    >
      {label}
    </span>
  </div>
);

/* ------------------------------------------------------------------ */
/* AI Usage Card                                                        */
/* ------------------------------------------------------------------ */
const AIUsageCard = () => {
  const used = 47;
  const limit = 100;
  const pct = (used / limit) * 100;

  return (
    <Card className="relative overflow-hidden rounded-[2.5rem] border-brand-border bg-linear-to-br from-emerald-500/5 to-blue-500/5 p-8 shadow-2xl group">
      <div className="absolute -top-16 -right-16 size-40 bg-emerald-500/20 blur-[80px] opacity-40 group-hover:opacity-70 transition-all duration-700" />

      <div className="relative z-10 space-y-6">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shadow-inner">
            <Zap className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <CardTitle className="text-xl font-black tracking-tight">AI Credits</CardTitle>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
              Explorer Plan
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black tracking-tighter">{used}</span>
              <span className="text-muted-foreground font-black text-xl opacity-40">/{limit}</span>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[10px]">
              68% OPEN RATE
            </Badge>
          </div>
          <Progress value={pct} className="h-3 bg-emerald-500/10" />
        </div>

        <Button className="w-full h-14 rounded-2xl font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 active:scale-95 group transition-all">
          <Rocket className="w-5 h-5 mr-2 group-hover:animate-bounce" />
          Go Unlimited
        </Button>
      </div>
    </Card>
  );
};

/* ------------------------------------------------------------------ */
/* Today Agenda                                                         */
/* ------------------------------------------------------------------ */
const TodayAgenda = () => (
  <Card className="rounded-[2.5rem] border-brand-border bg-background/40 backdrop-blur-xl p-8 space-y-8 shadow-xl">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="size-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shadow-inner">
          <Calendar className="w-6 h-6 text-blue-500" />
        </div>
        <CardTitle className="text-xl font-black tracking-tight">Agenda</CardTitle>
      </div>
      <Badge
        variant="outline"
        className="rounded-full border-brand-border bg-emerald-500/5 text-emerald-600 font-black text-[10px] tracking-widest px-3"
      >
        APR 21
      </Badge>
    </div>

    <div className="space-y-6">
      <AgendaItem time="10:30" title="Intro call — Stripe" sub="Google Meet" interview />
      <AgendaItem time="14:00" title="Tech screen — Linear" sub="Zoom" interview />
      <AgendaItem time="17:00" title="Portfolio Update" sub="Final polish" />
    </div>
  </Card>
);

const AgendaItem = ({ time, title, sub, interview }: any) => (
  <div className="flex items-center gap-6 group cursor-pointer">
    <div className="w-14 text-right">
      <p className="text-base font-black tracking-tighter group-hover:text-blue-500 transition-colors leading-none">
        {time}
      </p>
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50 mt-1">
        {interview ? "CALL" : "TASK"}
      </p>
    </div>
    <div className="flex-1 h-px bg-brand-border" />
    <div className="flex-2">
      <p className="text-base font-black tracking-tight group-hover:text-blue-600 transition-colors leading-none">
        {title}
      </p>
      <p className="text-xs font-medium text-muted-foreground opacity-70 mt-1">{sub}</p>
    </div>
  </div>
);

export default DashboardPage;
