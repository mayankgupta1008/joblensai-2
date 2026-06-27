import { useState, useRef, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "@/store/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  FaBolt,
  FaBookmark,
  FaBriefcase,
  FaBuilding,
  FaChevronRight,
  FaCrown,
  FaFire,
  FaHeart,
  FaMapMarkerAlt,
  FaRegClock,
  FaTimes,
  FaUserTie,
  FaCommentDots,
  FaPlus,
  FaUsers,
  FaInbox,
} from "react-icons/fa";

/* ------------------------------------------------------------------ *
 * NOTE: every value below is HARDCODED mock data. Wire each block to a
 * real endpoint one by one (see the dashboard spec). Markers: // TODO(api)
 * ------------------------------------------------------------------ */

type Job = {
  id: string;
  title: string;
  company: string;
  logo: string; // emoji placeholder until company logos exist
  location: string;
  type: string;
  salary: string;
  match: number;
  skills: string[];
  posted: string;
};

// TODO(api): GET /api/job/feed
const MOCK_JOBS: Job[] = [
  {
    id: "j1",
    title: "Senior Frontend Engineer",
    company: "Razorpay",
    logo: "💳",
    location: "Bengaluru · Hybrid",
    type: "Full-time",
    salary: "₹35–55 LPA",
    match: 96,
    skills: ["React", "TypeScript", "Node.js", "Redux"],
    posted: "2d ago",
  },
  {
    id: "j2",
    title: "Full Stack Developer",
    company: "CRED",
    logo: "🟣",
    location: "Remote (India)",
    type: "Full-time",
    salary: "₹28–42 LPA",
    match: 91,
    skills: ["React", "Express", "MongoDB", "AWS"],
    posted: "4h ago",
  },
  {
    id: "j3",
    title: "Product Engineer",
    company: "Zerodha",
    logo: "📈",
    location: "Bengaluru · On-site",
    type: "Full-time",
    salary: "₹30–48 LPA",
    match: 88,
    skills: ["TypeScript", "Postgres", "Kafka"],
    posted: "1d ago",
  },
  {
    id: "j4",
    title: "Frontend Lead",
    company: "Swiggy",
    logo: "🛵",
    location: "Hyderabad · Hybrid",
    type: "Full-time",
    salary: "₹40–60 LPA",
    match: 84,
    skills: ["React", "Next.js", "Design Systems"],
    posted: "3d ago",
  },
];

// TODO(api): GET /api/job/feed?role=recruiter (candidate feed)
const MOCK_CANDIDATES: Job[] = [
  {
    id: "c1",
    title: "Aarav Mehta",
    company: "5 yrs · ex-Flipkart",
    logo: "🧑‍💻",
    location: "Bengaluru",
    type: "Notice: 30d",
    salary: "Expects ₹40 LPA",
    match: 94,
    skills: ["React", "TypeScript", "Node.js"],
    posted: "Active today",
  },
  {
    id: "c2",
    title: "Diya Sharma",
    company: "4 yrs · ex-Paytm",
    logo: "👩‍💻",
    location: "Remote",
    type: "Immediate",
    salary: "Expects ₹32 LPA",
    match: 90,
    skills: ["React", "AWS", "GraphQL"],
    posted: "Active 2d ago",
  },
  {
    id: "c3",
    title: "Kabir Singh",
    company: "6 yrs · ex-Razorpay",
    logo: "🧑‍🔧",
    location: "Pune",
    type: "Notice: 60d",
    salary: "Expects ₹50 LPA",
    match: 86,
    skills: ["Node.js", "Kafka", "Postgres"],
    posted: "Active today",
  },
];

const APPLICATIONS = [
  {
    company: "Notion",
    role: "Frontend Engineer",
    stage: "Interview",
    when: "Tomorrow, 3 PM",
    tone: "emerald",
  },
  {
    company: "Figma",
    role: "Product Engineer",
    stage: "Viewed",
    when: "Viewed 1d ago",
    tone: "blue",
  },
  {
    company: "Linear",
    role: "Senior SWE",
    stage: "Applied",
    when: "Applied 3d ago",
    tone: "muted",
  },
  { company: "Vercel", role: "DX Engineer", stage: "Offer", when: "Respond by Fri", tone: "amber" },
];

const PIPELINE = [
  { label: "Applied", count: 12 },
  { label: "Viewed", count: 7 },
  { label: "Interview", count: 3 },
  { label: "Offer", count: 1 },
];

/* ------------------------------------------------------------------ */
/* Small shared building blocks                                       */
/* ------------------------------------------------------------------ */

const SectionHeading = ({
  icon: Icon,
  title,
  action,
  onAction,
}: {
  icon: React.ElementType;
  title: string;
  action?: string;
  onAction?: () => void;
}) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="flex items-center gap-2.5 text-xl font-black tracking-tight">
      <span className="grid place-items-center w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500">
        <Icon className="w-4 h-4" />
      </span>
      {title}
    </h2>
    {action && (
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-emerald-600 font-bold"
        onClick={onAction}
      >
        {action} <FaChevronRight className="w-3 h-3 ml-1" />
      </Button>
    )}
  </div>
);

// Static classes only — Tailwind can't scan interpolated class names.
const STAT_ACCENT: Record<string, string> = {
  emerald: "bg-emerald-500/10 text-emerald-500",
  blue: "bg-blue-500/10 text-blue-500",
  amber: "bg-amber-500/10 text-amber-500",
};

const StatCard = ({
  icon: Icon,
  value,
  label,
  accent = "emerald",
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  accent?: string;
}) => (
  <Card className="border-brand-border bg-background/40 backdrop-blur-md">
    <CardContent className="p-5">
      <div className={`grid place-items-center w-10 h-10 rounded-xl mb-3 ${STAT_ACCENT[accent]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-3xl font-black tracking-tighter tabular-nums">{value}</div>
      <div className="text-sm text-muted-foreground font-medium">{label}</div>
    </CardContent>
  </Card>
);

const stageTone: Record<string, string> = {
  emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  amber: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  muted: "bg-muted text-muted-foreground border-brand-border",
};

/* ------------------------------------------------------------------ */
/* Swipe deck — native pointer drag, no extra dependency              */
/* ------------------------------------------------------------------ */

const SwipeDeck = ({ items, kind }: { items: Job[]; kind: "job" | "candidate" }) => {
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);

  const current = items[index];
  const next = items[index + 1];
  const done = index >= items.length;

  const fly = (dir: "left" | "right") => {
    if (dir === "right") {
      // TODO(api): POST /api/job/:id/swipe { direction: "right" }
      toast.success(
        kind === "job" ? "Interested — application sent! 🎉" : "Shortlisted candidate ✅",
        {
          description:
            kind === "job"
              ? "We'll notify you if it's a match."
              : "They'll be notified of your interest.",
        }
      );
    }
    setDrag(0);
    setDragging(false);
    startX.current = null;
    setIndex((i) => i + 1);
  };

  const onDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    setDrag(e.clientX - startX.current);
  };
  const onUp = () => {
    if (startX.current === null) return;
    if (drag > 110) fly("right");
    else if (drag < -110) fly("left");
    else {
      setDrag(0);
      setDragging(false);
      startX.current = null;
    }
  };

  if (done) {
    return (
      <Card className="border-brand-border bg-background/40 backdrop-blur-md h-[460px] grid place-items-center">
        <CardContent className="text-center p-8">
          <div className="text-5xl mb-4">🎯</div>
          <h3 className="text-xl font-black tracking-tight mb-1">You're all caught up</h3>
          <p className="text-muted-foreground font-medium mb-5">
            New {kind === "job" ? "jobs" : "candidates"} are matched daily. Check back soon.
          </p>
          <Button
            className="rounded-full font-bold bg-emerald-500 hover:bg-emerald-600"
            onClick={() => setIndex(0)}
          >
            Reset deck (demo)
          </Button>
        </CardContent>
      </Card>
    );
  }

  const rotate = drag / 18;
  const opacity = Math.min(Math.abs(drag) / 110, 1);

  return (
    <div className="relative h-[460px] select-none">
      {/* peek of next card */}
      {next && (
        <Card className="absolute inset-0 border-brand-border bg-background/30 backdrop-blur-md scale-[0.96] translate-y-3 -z-0" />
      )}

      {/* active card */}
      <Card
        className="absolute inset-0 border-brand-border bg-background/60 backdrop-blur-xl cursor-grab active:cursor-grabbing overflow-hidden touch-none"
        style={{
          transform: `translateX(${drag}px) rotate(${rotate}deg)`,
          transition: dragging ? "none" : "transform 0.3s ease",
        }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {/* LIKE / NOPE stamps */}
        <div
          className="absolute top-8 left-6 z-20 rotate-[-18deg] border-4 border-emerald-500 text-emerald-500 font-black text-2xl px-3 py-1 rounded-lg"
          style={{ opacity: drag > 0 ? opacity : 0 }}
        >
          {kind === "job" ? "APPLY" : "SHORTLIST"}
        </div>
        <div
          className="absolute top-8 right-6 z-20 rotate-[18deg] border-4 border-red-500 text-red-500 font-black text-2xl px-3 py-1 rounded-lg"
          style={{ opacity: drag < 0 ? opacity : 0 }}
        >
          PASS
        </div>

        <CardContent className="p-6 flex flex-col h-full">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid place-items-center w-14 h-14 rounded-2xl bg-emerald-500/10 text-3xl">
                {current.logo}
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight leading-tight">{current.title}</h3>
                <p className="text-muted-foreground font-semibold flex items-center gap-1.5">
                  <FaBuilding className="w-3.5 h-3.5" /> {current.company}
                </p>
              </div>
            </div>
            <Badge className="bg-emerald-500 text-white font-black text-sm px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/20">
              {current.match}% MATCH
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2 mt-5 text-sm font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <FaMapMarkerAlt className="w-3.5 h-3.5 text-emerald-500" /> {current.location}
            </span>
            <span className="flex items-center gap-1.5">
              <FaBriefcase className="w-3.5 h-3.5 text-emerald-500" /> {current.type}
            </span>
            <span className="flex items-center gap-1.5">
              <FaRegClock className="w-3.5 h-3.5 text-emerald-500" /> {current.posted}
            </span>
          </div>

          <div className="mt-5 p-4 rounded-2xl bg-emerald-500/5 border border-brand-border">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              {kind === "job" ? "Compensation" : "Expectation"}
            </p>
            <p className="text-2xl font-black tracking-tight text-emerald-600">{current.salary}</p>
          </div>

          <div className="mt-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              {kind === "job" ? "Required skills" : "Top skills"}
            </p>
            <div className="flex flex-wrap gap-2">
              {current.skills.map((s) => (
                <Badge
                  key={s}
                  variant="outline"
                  className="border-brand-border bg-background/40 font-semibold"
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-5 text-center text-xs text-muted-foreground font-medium">
            Drag the card, or use the buttons below
          </div>
        </CardContent>
      </Card>

      {/* action buttons */}
      <div className="absolute -bottom-7 left-0 right-0 flex items-center justify-center gap-4 z-30">
        <Button
          size="icon"
          className="w-14 h-14 rounded-full bg-background border-2 border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white shadow-xl"
          onClick={() => fly("left")}
          aria-label="Pass"
        >
          <FaTimes className="w-6 h-6" />
        </Button>
        <Button
          size="icon"
          className="w-12 h-12 rounded-full bg-background border-2 border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-white shadow-lg"
          onClick={() => toast("Saved for later 🔖")}
          aria-label="Save"
        >
          <FaBookmark className="w-5 h-5" />
        </Button>
        <Button
          size="icon"
          className="w-14 h-14 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 shadow-xl shadow-emerald-500/30"
          onClick={() => fly("right")}
          aria-label={kind === "job" ? "Apply" : "Shortlist"}
        >
          <FaHeart className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Jobseeker dashboard                                                */
/* ------------------------------------------------------------------ */

const JobseekerDashboard = ({ name }: { name: string }) => {
  const navigate = useNavigate();
  // TODO(api): derive from GET /api/account (profile completeness)
  const completeness = 72;
  // TODO(api): daily swipe quota — gate by Subscription.status
  const swipesUsed = 3;
  const swipesTotal = 5;

  return (
    <div className="space-y-12">
      {/* header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-3">
          <Badge
            variant="outline"
            className="px-4 py-1.5 border-brand-border bg-emerald-500/5 text-emerald-600 tracking-wide font-bold"
          >
            <FaFire className="w-3.5 h-3.5 mr-2 text-emerald-500" /> 5-DAY STREAK
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/60 leading-none">
            Hey {name} 👋
          </h1>
          <p className="text-muted-foreground text-lg font-medium opacity-80">
            You have <span className="text-emerald-600 font-bold">4 fresh matches</span> waiting.
            Start swiping.
          </p>
        </div>

        {/* quota + completeness */}
        <div className="flex gap-3">
          <Card className="border-brand-border bg-background/40 backdrop-blur-md w-44">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Profile
                </span>
                <span className="text-sm font-black text-emerald-600">{completeness}%</span>
              </div>
              <Progress value={completeness} className="h-2" />
              <button
                onClick={() => navigate("/settings")}
                className="mt-2 text-xs font-bold text-emerald-600 hover:underline"
              >
                Complete it →
              </button>
            </CardContent>
          </Card>
          <Card className="border-brand-border bg-background/40 backdrop-blur-md w-44">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Daily swipes
                </span>
                <FaBolt className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="text-2xl font-black tracking-tighter tabular-nums">
                {swipesTotal - swipesUsed}
                <span className="text-muted-foreground text-base">/{swipesTotal} left</span>
              </div>
              <button
                onClick={() => navigate("/subscription")}
                className="mt-1 text-xs font-bold text-amber-600 hover:underline flex items-center gap-1"
              >
                <FaCrown className="w-3 h-3" /> Go unlimited
              </button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* main grid: deck + side rail */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        <div>
          <SectionHeading icon={FaBolt} title="Discover jobs" />
          <SwipeDeck items={MOCK_JOBS} kind="job" />
        </div>

        <div className="space-y-6 lg:pt-[52px]">
          {/* stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={FaHeart} value={8} label="Matches" />
            <StatCard icon={FaBriefcase} value={12} label="Applied" accent="blue" />
            <StatCard icon={FaBookmark} value={5} label="Saved" accent="amber" />
            <StatCard icon={FaUserTie} value={3} label="Interviews" accent="emerald" />
          </div>

          {/* recent matches */}
          <Card className="border-brand-border bg-background/40 backdrop-blur-md">
            <CardContent className="p-5">
              <h3 className="font-black tracking-tight mb-3 flex items-center gap-2">
                <FaHeart className="w-4 h-4 text-emerald-500" /> Recent matches
              </h3>
              <div className="space-y-3">
                {MOCK_JOBS.slice(0, 3).map((j) => (
                  <div key={j.id} className="flex items-center gap-3">
                    <div className="grid place-items-center w-10 h-10 rounded-xl bg-emerald-500/10 text-xl">
                      {j.logo}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate">{j.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{j.company}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-emerald-600 font-bold px-2">
                      <FaCommentDots className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* application tracker */}
      <div>
        <SectionHeading
          icon={FaBriefcase}
          title="Application tracker"
          action="View all"
          onAction={() => {}}
        />
        {/* pipeline */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {PIPELINE.map((p) => (
            <Card key={p.label} className="border-brand-border bg-background/40 backdrop-blur-md">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-black tracking-tighter tabular-nums text-emerald-600">
                  {p.count}
                </div>
                <div className="text-sm text-muted-foreground font-bold uppercase tracking-wide">
                  {p.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* recent applications */}
        <Card className="border-brand-border bg-background/40 backdrop-blur-md">
          <CardContent className="p-0 divide-y divide-brand-border">
            {APPLICATIONS.map((a, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="grid place-items-center w-11 h-11 rounded-xl bg-muted text-muted-foreground font-black">
                  {a.company[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold truncate">{a.role}</p>
                  <p className="text-sm text-muted-foreground truncate">{a.company}</p>
                </div>
                <span className="text-sm text-muted-foreground font-medium hidden sm:block">
                  {a.when}
                </span>
                <Badge variant="outline" className={`font-bold ${stageTone[a.tone]}`}>
                  {a.stage}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Recruiter dashboard                                                */
/* ------------------------------------------------------------------ */

const RecruiterDashboard = ({ name }: { name: string }) => {
  // TODO(api): GET /api/job/mine
  const postings = [
    { title: "Senior Frontend Engineer", matches: 14, pipeline: 6, status: "Active" },
    { title: "Backend Engineer (Node)", matches: 9, pipeline: 3, status: "Active" },
    { title: "Product Designer", matches: 4, pipeline: 1, status: "Paused" },
  ];

  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-3">
          <Badge
            variant="outline"
            className="px-4 py-1.5 border-brand-border bg-emerald-500/5 text-emerald-600 tracking-wide font-bold"
          >
            <FaBuilding className="w-3.5 h-3.5 mr-2 text-emerald-500" /> RECRUITER
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/60 leading-none">
            {name}'s hiring desk
          </h1>
          <p className="text-muted-foreground text-lg font-medium opacity-80">
            <span className="text-emerald-600 font-bold">27 new candidate matches</span> across your
            open roles.
          </p>
        </div>
        <Button className="rounded-full font-bold h-12 px-6 bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20">
          <FaPlus className="w-4 h-4 mr-2" /> Post a job
        </Button>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={FaBriefcase} value={3} label="Active posts" />
        <StatCard icon={FaHeart} value={27} label="New matches" accent="emerald" />
        <StatCard icon={FaUsers} value={10} label="In pipeline" accent="blue" />
        <StatCard icon={FaInbox} value={5} label="Unread chats" accent="amber" />
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        <div>
          <SectionHeading icon={FaUsers} title="Review candidates" />
          <SwipeDeck items={MOCK_CANDIDATES} kind="candidate" />
        </div>

        <div className="lg:pt-[52px]">
          <SectionHeading icon={FaBriefcase} title="Your postings" />
          <div className="space-y-3">
            {postings.map((p, i) => (
              <Card key={i} className="border-brand-border bg-background/40 backdrop-blur-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold leading-tight">{p.title}</p>
                    <Badge
                      variant="outline"
                      className={`font-bold shrink-0 ${
                        p.status === "Active" ? stageTone.emerald : stageTone.muted
                      }`}
                    >
                      {p.status}
                    </Badge>
                  </div>
                  <div className="flex gap-4 mt-3 text-sm font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <FaHeart className="w-3.5 h-3.5 text-emerald-500" /> {p.matches} matches
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FaUsers className="w-3.5 h-3.5 text-blue-500" /> {p.pipeline} in pipeline
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Page shell                                                         */
/* ------------------------------------------------------------------ */

const DashboardPage = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const firstName = useMemo(() => user?.fullName?.split(" ")[0] ?? "there", [user]);
  const isRecruiter = user?.role === "recruiter";

  return (
    <div className="relative min-h-screen selection:bg-emerald-500/30 pb-28">
      {/* background blobs — matches SettingsPage */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] rounded-full bg-linear-to-br from-emerald-500/10 to-blue-500/5 blur-[130px] opacity-40" />
        <div className="absolute bottom-[5%] right-[-10%] w-[40%] h-[40%] rounded-full bg-linear-to-tr from-blue-600/8 to-emerald-500/10 blur-[110px] opacity-30" />
      </div>

      <div className="container mx-auto px-4 md:px-8 py-10 md:py-16 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        {isRecruiter ? (
          <RecruiterDashboard name={firstName} />
        ) : (
          <JobseekerDashboard name={firstName} />
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
