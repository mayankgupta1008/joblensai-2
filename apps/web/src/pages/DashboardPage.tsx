import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import type { RootState } from "@/store/store";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  Flame,
  ArrowRight,
  ArrowUpRight,
  Heart,
  MessageSquare,
  Briefcase,
  CheckCircle2,
  Clock,
  TrendingUp,
  Zap,
  MapPin,
  Bell,
  Plus,
  Eye,
  Mail,
  Rocket,
  Target,
  Calendar,
  PartyPopper,
  Circle,
  ChevronRight,
} from "lucide-react";

const DashboardPage = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const firstName = user?.fullName?.split(" ")[0] ?? "there";

  return (
    <div className="relative min-h-screen selection:bg-primary/30">
      {/* Ambient background blobs — match LandingPage vibe */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] rounded-full bg-linear-to-br from-primary/15 to-blue-500/5 blur-[130px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[5%] right-[-10%] w-[40%] h-[40%] rounded-full bg-linear-to-tr from-purple-500/8 to-primary/15 blur-[110px] opacity-30" />
      </div>

      <div className="container mx-auto px-4 md:px-8 py-10 md:py-14 max-w-7xl">
        {/* Weekly Recap Ribbon */}
        <WeeklyRecap />

        {/* Header — greeting + role chip + primary CTA */}
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <Badge
              variant="outline"
              className="mb-4 px-3 py-1 border-primary/20 bg-primary/5 text-primary tracking-wide"
            >
              <Sparkles className="w-3 h-3 mr-1.5 animate-pulse text-yellow-500" />
              Welcome back
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/60 leading-[1.05]">
              Hi {firstName}.
              <br />
              <span className="text-primary">Let's find a match.</span>
            </h1>
            <p className="mt-4 text-muted-foreground text-base md:text-lg max-w-xl">
              You have <span className="text-foreground font-semibold">3 new matches</span> and{" "}
              <span className="text-foreground font-semibold">12 AI drafts</span> waiting.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button variant="outline" size="lg" className="rounded-full font-semibold" asChild>
              <Link to="/subscription">
                <Rocket className="w-4 h-4 mr-2" />
                Upgrade
              </Link>
            </Button>
            <Button
              size="lg"
              className="rounded-full font-bold shadow-lg shadow-primary/20 active:scale-95 group"
              asChild
            >
              <Link to="/upload">
                Resume Swiping
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Hero row — Streak ring + Application funnel */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <StreakCard />
          <FunnelStrip />
        </section>

        {/* Mid row — Active matches rail */}
        <section className="mb-6">
          <ActiveMatches />
        </section>

        {/* Bento row — AI outreach + Profile strength */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <AIOutreachFeed />
          <ProfileStrength />
        </section>

        {/* Recommended jobs bento */}
        <section className="mb-6">
          <RecommendedJobs />
        </section>

        {/* Agenda + AI usage footer */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TodayAgenda />
          <AIUsageCard />
        </section>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Weekly Recap Ribbon                                                 */
/* ------------------------------------------------------------------ */
const WeeklyRecap = () => (
  <div className="mb-8 group relative overflow-hidden rounded-3xl border border-primary/20 bg-linear-to-r from-primary/5 via-purple-500/5 to-blue-500/5 p-5 md:p-6">
    <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary/10 blur-3xl opacity-50 group-hover:opacity-70 transition-opacity" />
    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <PartyPopper className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">
            Your week in review
          </p>
          <p className="text-sm md:text-base font-semibold">
            You swiped <span className="text-primary">143 jobs</span>, matched{" "}
            <span className="text-primary">8</span>, and landed{" "}
            <span className="text-primary">2 interviews</span>.
          </p>
        </div>
      </div>
      <Button variant="ghost" size="sm" className="rounded-full self-start md:self-auto">
        View recap <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Streak Card — big ring + flame                                      */
/* ------------------------------------------------------------------ */
const StreakCard = () => {
  const goal = 25;
  const done = 18;
  const pct = (done / goal) * 100;
  const radius = 58;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;

  return (
    <Card className="rounded-3xl border-border/40 dark:border-primary/20 bg-muted/20 hover:bg-muted/30 transition-all p-6 lg:col-span-1">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
            Daily Swipe Goal
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Flame className="w-5 h-5 text-orange-500 fill-orange-500/30" />
            <span className="text-2xl font-black tracking-tight">7-day streak</span>
          </div>
        </div>
        <Badge variant="outline" className="border-orange-500/30 bg-orange-500/10 text-orange-500">
          On fire
        </Badge>
      </div>

      <div className="flex items-center justify-center py-4">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
            <circle
              cx="70"
              cy="70"
              r={radius}
              strokeWidth="10"
              className="stroke-muted fill-none"
            />
            <circle
              cx="70"
              cy="70"
              r={radius}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              className="stroke-primary fill-none transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black tracking-tighter">{done}</span>
            <span className="text-xs text-muted-foreground font-semibold">of {goal} today</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          <TrendingUp className="w-3.5 h-3.5 inline mr-1 text-green-500" />
          28% above avg
        </span>
        <Button variant="ghost" size="sm" className="h-8 rounded-full text-xs">
          View heatmap
        </Button>
      </div>
    </Card>
  );
};

/* ------------------------------------------------------------------ */
/* Funnel Strip — 4 stats + sparklines                                  */
/* ------------------------------------------------------------------ */
const FunnelStrip = () => {
  const stats = [
    { label: "Swiped", value: 143, delta: "+18%", icon: Heart, tone: "text-pink-500" },
    { label: "Matched", value: 24, delta: "+12%", icon: Sparkles, tone: "text-yellow-500" },
    { label: "Replied", value: 11, delta: "+6%", icon: MessageSquare, tone: "text-blue-500" },
    { label: "Interviews", value: 3, delta: "+50%", icon: Briefcase, tone: "text-green-500" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:col-span-2 gap-4">
      {stats.map((s) => (
        <Card
          key={s.label}
          className="rounded-3xl border-border/40 dark:border-primary/20 bg-muted/20 hover:bg-muted/30 transition-all p-5 gap-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center">
              <s.icon className={`w-4 h-4 ${s.tone}`} />
            </div>
            <Badge variant="ghost" className="text-green-500 text-[10px] font-bold px-1.5">
              {s.delta}
            </Badge>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">
              {s.label}
            </p>
            <p className="text-3xl font-black tracking-tighter">{s.value}</p>
          </div>
          <Sparkline />
        </Card>
      ))}
    </div>
  );
};

const Sparkline = () => {
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
    <svg viewBox="0 0 100 30" className="w-full h-8" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L100,30 L0,30 Z`} fill="url(#sparkFill)" className="text-primary" />
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
      />
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* Active Matches Rail                                                  */
/* ------------------------------------------------------------------ */
const matches = [
  { company: "Acme Corp", role: "Senior FE Engineer", salary: "$140–180k", unread: true, pct: 94 },
  { company: "Stripe", role: "Product Engineer", salary: "$160–200k", unread: true, pct: 91 },
  { company: "Linear", role: "Design Engineer", salary: "$150–190k", unread: false, pct: 89 },
  { company: "Vercel", role: "Full-stack Dev", salary: "$135–175k", unread: true, pct: 86 },
  { company: "Figma", role: "React Engineer", salary: "$145–185k", unread: false, pct: 84 },
];

const ActiveMatches = () => (
  <Card className="rounded-3xl border-border/40 dark:border-primary/20 bg-muted/20 p-6 gap-5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-pink-500/10 flex items-center justify-center">
          <Heart className="w-5 h-5 text-pink-500 fill-pink-500/20" />
        </div>
        <div>
          <CardTitle className="text-lg font-bold">Your matches</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Recruiters who swiped right on you</p>
        </div>
      </div>
      <Button variant="ghost" size="sm" className="rounded-full">
        See all <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>

    <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x scrollbar-none">
      {matches.map((m) => (
        <div
          key={m.company}
          className="snap-start shrink-0 w-64 rounded-2xl border border-border/40 dark:border-primary/20 bg-background/60 p-4 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 transition-all group cursor-pointer"
        >
          <div className="flex items-start justify-between mb-4">
            <Avatar size="lg" className="ring-2 ring-primary/10">
              <AvatarImage src={`https://api.dicebear.com/7.x/shapes/svg?seed=${m.company}`} />
              <AvatarFallback>{m.company[0]}</AvatarFallback>
            </Avatar>
            {m.unread && (
              <span className="relative flex h-2 w-2 mt-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-semibold mb-0.5">{m.company}</p>
          <p className="font-bold text-sm mb-1 line-clamp-1">{m.role}</p>
          <p className="text-xs text-muted-foreground mb-3">{m.salary}</p>
          <div className="flex items-center justify-between">
            <Badge variant="ghost" className="bg-green-500/10 text-green-500 font-bold text-[10px]">
              {m.pct}% match
            </Badge>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
        </div>
      ))}

      <div className="snap-start shrink-0 w-64 rounded-2xl border border-dashed border-border/60 flex items-center justify-center p-4 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/10 transition-colors">
            <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
          </div>
          <p className="text-xs font-semibold text-muted-foreground">More matches await</p>
          <p className="text-[10px] text-muted-foreground/70">Keep swiping</p>
        </div>
      </div>
    </div>
  </Card>
);

/* ------------------------------------------------------------------ */
/* AI Outreach Feed                                                     */
/* ------------------------------------------------------------------ */
const drafts = [
  {
    company: "Acme Corp",
    subject: "Re: Senior FE Engineer — excited to connect",
    time: "2m ago",
    status: "generating",
  },
  {
    company: "Stripe",
    subject: "Introduction + my work on distributed systems",
    time: "14m ago",
    status: "sent",
  },
  {
    company: "Linear",
    subject: "Design Engineer — portfolio + availability",
    time: "1h ago",
    status: "opened",
  },
  {
    company: "Vercel",
    subject: "Re: Full-stack role — my Next.js work",
    time: "3h ago",
    status: "replied",
  },
];

const statusStyles: Record<string, string> = {
  generating: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  sent: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  opened: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  replied: "bg-green-500/10 text-green-500 border-green-500/20",
};

const AIOutreachFeed = () => (
  <Card className="rounded-3xl border-border/40 dark:border-primary/20 bg-muted/20 p-6 gap-5 lg:col-span-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            AI Outreach
            <Badge variant="ghost" className="bg-primary/10 text-primary text-[10px] font-bold">
              <Sparkles className="w-2.5 h-2.5 mr-0.5" /> LIVE
            </Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Personalized emails, auto-drafted on every match
          </p>
        </div>
      </div>
      <Button variant="ghost" size="sm" className="rounded-full">
        View all <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>

    <div className="space-y-2">
      {drafts.map((d, i) => (
        <div
          key={i}
          className="relative overflow-hidden flex items-center gap-4 p-4 rounded-2xl border border-border/40 dark:border-primary/10 bg-background/40 hover:bg-background/70 transition-colors group"
        >
          {d.status === "generating" && (
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-primary/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite] pointer-events-none" />
          )}
          <Avatar size="default">
            <AvatarImage src={`https://api.dicebear.com/7.x/shapes/svg?seed=${d.company}`} />
            <AvatarFallback>{d.company[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs text-muted-foreground font-semibold">{d.company}</span>
              <Circle className="w-0.5 h-0.5 fill-muted-foreground text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{d.time}</span>
            </div>
            <p className="text-sm font-semibold truncate">{d.subject}</p>
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] font-bold uppercase tracking-wider ${statusStyles[d.status]}`}
          >
            {d.status === "generating" && (
              <span className="w-1.5 h-1.5 rounded-full bg-current mr-1 animate-pulse" />
            )}
            {d.status}
          </Badge>
          <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>
      ))}
    </div>
  </Card>
);

/* ------------------------------------------------------------------ */
/* Profile Strength                                                     */
/* ------------------------------------------------------------------ */
const strengthItems = [
  { label: "Profile photo", done: true },
  { label: "Headline & bio", done: true },
  { label: "Skills (min 5)", done: true },
  { label: "Resume uploaded", done: true },
  { label: "Portfolio link", done: false },
  { label: "Salary expectations", done: false },
];

const ProfileStrength = () => {
  const done = strengthItems.filter((x) => x.done).length;
  const pct = Math.round((done / strengthItems.length) * 100);

  return (
    <Card className="rounded-3xl border-border/40 dark:border-primary/20 bg-muted/20 p-6 gap-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
          <Target className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <CardTitle className="text-lg font-bold">Profile strength</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Complete for better matches</p>
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-4xl font-black tracking-tighter">{pct}%</span>
          <Badge variant="ghost" className="bg-blue-500/10 text-blue-500 font-bold text-[10px]">
            +18% match rate if completed
          </Badge>
        </div>
        <Progress value={pct} className="h-2" />
      </div>

      <div className="space-y-2">
        {strengthItems.map((item) => (
          <div key={item.label} className="flex items-center gap-3 text-sm">
            {item.done ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
            <span className={item.done ? "text-muted-foreground line-through" : "font-semibold"}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" className="rounded-full w-full font-semibold">
        Complete profile
      </Button>
    </Card>
  );
};

/* ------------------------------------------------------------------ */
/* Recommended Jobs Bento                                               */
/* ------------------------------------------------------------------ */
const jobs = [
  {
    company: "Notion",
    role: "Senior Product Engineer",
    location: "Remote · US",
    salary: "$170–210k",
    pct: 96,
    featured: true,
    skills: ["React", "TypeScript", "Node"],
  },
  {
    company: "Anthropic",
    role: "Frontend Engineer, Claude",
    location: "San Francisco",
    salary: "$180–240k",
    pct: 93,
    featured: false,
    skills: ["React", "Next.js", "AI"],
  },
  {
    company: "Perplexity",
    role: "Full-stack Engineer",
    location: "Remote · Global",
    salary: "$160–200k",
    pct: 90,
    featured: false,
    skills: ["TypeScript", "Python", "LLMs"],
  },
  {
    company: "Cursor",
    role: "Growth Engineer",
    location: "NYC · Hybrid",
    salary: "$150–190k",
    pct: 88,
    featured: false,
    skills: ["React", "Analytics", "Growth"],
  },
];

const RecommendedJobs = () => (
  <Card className="rounded-3xl border-border/40 dark:border-primary/20 bg-muted/20 p-6 gap-5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-purple-500" />
        </div>
        <div>
          <CardTitle className="text-lg font-bold">Next best swipes</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            AI-curated roles matching your Skill DNA
          </p>
        </div>
      </div>
      <Button size="sm" className="rounded-full font-semibold" asChild>
        <Link to="/upload">
          Start swiping <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Link>
      </Button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {jobs.map((job) => (
        <div
          key={job.company}
          className={`relative rounded-2xl p-5 hover:-translate-y-0.5 transition-all cursor-pointer group ${
            job.featured
              ? "border-2 border-primary/30 bg-linear-to-br from-primary/5 via-transparent to-purple-500/5"
              : "border border-border/40 dark:border-primary/10 bg-background/40 hover:bg-background/70"
          }`}
        >
          {job.featured && (
            <Badge
              variant="default"
              className="absolute -top-2.5 left-5 text-[10px] font-bold shadow-lg shadow-primary/20"
            >
              <Sparkles className="w-2.5 h-2.5 mr-0.5" /> TOP PICK
            </Badge>
          )}
          <div className="flex items-start justify-between mb-4">
            <Avatar size="lg" className="ring-2 ring-background">
              <AvatarImage src={`https://api.dicebear.com/7.x/shapes/svg?seed=${job.company}`} />
              <AvatarFallback>{job.company[0]}</AvatarFallback>
            </Avatar>
            <Badge variant="ghost" className="bg-green-500/10 text-green-500 font-bold">
              {job.pct}% match
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-semibold mb-1">{job.company}</p>
          <h3 className="font-bold text-base mb-2 line-clamp-1">{job.role}</h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {job.location}
            </span>
            <Circle className="w-0.5 h-0.5 fill-current" />
            <span className="font-semibold text-foreground/80">{job.salary}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {job.skills.map((s) => (
              <span
                key={s}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  </Card>
);

/* ------------------------------------------------------------------ */
/* Today Agenda                                                         */
/* ------------------------------------------------------------------ */
const agendaItems = [
  { time: "10:30", title: "Intro call — Stripe", sub: "Google Meet", type: "interview" },
  { time: "14:00", title: "Tech screen — Linear", sub: "Zoom", type: "interview" },
  { time: "17:00", title: "Resume review reminder", sub: "Update portfolio link", type: "task" },
];

const TodayAgenda = () => (
  <Card className="rounded-3xl border-border/40 dark:border-primary/20 bg-muted/20 p-6 gap-5 lg:col-span-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-green-500" />
        </div>
        <div>
          <CardTitle className="text-lg font-bold">Today's agenda</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Tuesday, April 21</p>
        </div>
      </div>
      <Button variant="ghost" size="sm" className="rounded-full">
        <Bell className="w-4 h-4 mr-1.5" />
        Notify me
      </Button>
    </div>

    <div className="space-y-1">
      {agendaItems.map((item, i) => (
        <div key={i} className="flex items-center gap-4 py-2">
          <div className="w-14 shrink-0 text-right">
            <p className="text-sm font-black tracking-tight">{item.time}</p>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
              {item.type === "interview" ? "call" : "task"}
            </p>
          </div>
          <Separator orientation="vertical" className="h-10" />
          <div className="flex-1">
            <p className="text-sm font-bold">{item.title}</p>
            <p className="text-xs text-muted-foreground">{item.sub}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
            {item.type === "interview" ? (
              <Briefcase className="w-3.5 h-3.5" />
            ) : (
              <Clock className="w-3.5 h-3.5" />
            )}
          </div>
        </div>
      ))}
    </div>
  </Card>
);

/* ------------------------------------------------------------------ */
/* AI Usage Card                                                        */
/* ------------------------------------------------------------------ */
const AIUsageCard = () => {
  const used = 47;
  const limit = 100;
  const pct = (used / limit) * 100;

  return (
    <Card className="relative overflow-hidden rounded-3xl border-primary/30 bg-linear-to-br from-primary/5 via-transparent to-purple-500/10 p-6 gap-5">
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/20 blur-3xl opacity-40" />
      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold">AI credits</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Free plan · resets monthly</p>
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-4xl font-black tracking-tighter">{used}</span>
          <span className="text-muted-foreground font-semibold">/ {limit}</span>
          <span className="ml-auto text-xs text-muted-foreground font-semibold">
            AI emails sent
          </span>
        </div>
        <Progress value={pct} className="h-2 mb-4" />

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <Eye className="w-3 h-3" />
          <span>Open rate: </span>
          <span className="text-green-500 font-bold">68%</span>
          <Circle className="w-0.5 h-0.5 fill-muted-foreground text-muted-foreground mx-0.5" />
          <span>Reply rate:</span>
          <span className="text-green-500 font-bold">24%</span>
        </div>

        <Button
          size="sm"
          className="rounded-full w-full font-semibold shadow-md active:scale-95"
          asChild
        >
          <Link to="/subscription">
            <Rocket className="w-3.5 h-3.5 mr-1.5" />
            Go unlimited
          </Link>
        </Button>
      </div>
    </Card>
  );
};

export default DashboardPage;
