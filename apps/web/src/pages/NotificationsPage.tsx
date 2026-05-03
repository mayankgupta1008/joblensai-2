import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  CheckCheck,
  CircleAlert,
  CreditCard,
  Mail,
  Settings2,
  Sparkles,
  Inbox,
  Filter,
} from "lucide-react";
import type { RootState } from "@/store/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type NotificationType =
  | "PAYMENT_FAILED"
  | "SUBSCRIPTION_STARTED"
  | "SUBSCRIPTION_CANCELLED"
  | "SUBSCRIPTION_REMINDER"
  | "SUBSCRIPTION_RENEWED"
  | "SUBSCRIPTION_RENEWAL_FAILED"
  | "JOB_APPLIED"
  | "JOB_INTERVIEW"
  | "JOB_OFFER"
  | "JOB_REJECTED"
  | "JOB_ACCEPTED";

type NotificationTab = "all" | "unread" | "jobs" | "billing";
type NotificationGroup = "Today" | "Yesterday" | "Earlier this week";
type NotificationBucket = "jobs" | "billing";

type NotificationItem = {
  id: string;
  type: NotificationType;
  bucket: NotificationBucket;
  category: string;
  group: NotificationGroup;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  tone: string;
  icon: LucideIcon;
  ctaLabel: string;
  ctaTo: string;
};

const initialNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    type: "JOB_INTERVIEW",
    bucket: "jobs",
    category: "Jobs",
    group: "Today",
    title: "Interview scheduled",
    message: "Linear wants a technical screen tomorrow at 2:00 PM.",
    time: "12m ago",
    isRead: false,
    tone: "bg-emerald-500/10 text-emerald-600",
    icon: BriefcaseBusiness,
    ctaLabel: "Open dashboard",
    ctaTo: "/dashboard",
  },
  {
    id: "notif-2",
    type: "JOB_OFFER",
    bucket: "jobs",
    category: "Jobs",
    group: "Today",
    title: "Offer received",
    message: "Vercel shared a compensation breakdown for Full-stack Engineer.",
    time: "1h ago",
    isRead: false,
    tone: "bg-blue-500/10 text-blue-600",
    icon: BadgeCheck,
    ctaLabel: "Review role",
    ctaTo: "/dashboard",
  },
  {
    id: "notif-3",
    type: "PAYMENT_FAILED",
    bucket: "billing",
    category: "Billing",
    group: "Today",
    title: "Payment failed",
    message: "Your Pro renewal needs a new card before Friday.",
    time: "3h ago",
    isRead: false,
    tone: "bg-red-500/10 text-red-600",
    icon: CircleAlert,
    ctaLabel: "Fix billing",
    ctaTo: "/subscription",
  },
  {
    id: "notif-4",
    type: "SUBSCRIPTION_RENEWED",
    bucket: "billing",
    category: "Billing",
    group: "Yesterday",
    title: "Subscription renewed",
    message: "Your Pro plan is active through May 23.",
    time: "Yesterday",
    isRead: true,
    tone: "bg-emerald-500/10 text-emerald-600",
    icon: Sparkles,
    ctaLabel: "Manage plan",
    ctaTo: "/subscription",
  },
  {
    id: "notif-5",
    type: "JOB_APPLIED",
    bucket: "jobs",
    category: "Jobs",
    group: "Yesterday",
    title: "Application received",
    message: "Acme Corp confirmed your Senior FE Engineer application.",
    time: "Yesterday",
    isRead: true,
    tone: "bg-blue-500/10 text-blue-600",
    icon: Mail,
    ctaLabel: "View activity",
    ctaTo: "/dashboard",
  },
  {
    id: "notif-6",
    type: "SUBSCRIPTION_REMINDER",
    bucket: "billing",
    category: "Billing",
    group: "Earlier this week",
    title: "Renewal reminder",
    message: "We will remind you before your plan renews next week.",
    time: "2d ago",
    isRead: true,
    tone: "bg-blue-500/10 text-blue-600",
    icon: CalendarClock,
    ctaLabel: "Open settings",
    ctaTo: "/settings",
  },
];

const groupOrder: NotificationGroup[] = ["Today", "Yesterday", "Earlier this week"];
const formatNotificationType = (type: NotificationType) =>
  type
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");

const NotificationsPage = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [items, setItems] = useState(initialNotifications);
  const [activeTab, setActiveTab] = useState<NotificationTab>("all");

  const initials = user?.fullName
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const unreadCount = items.filter((item) => !item.isRead).length;
  const jobCount = items.filter((item) => item.bucket === "jobs").length;
  const billingCount = items.filter((item) => item.bucket === "billing").length;
  const readRate =
    items.length > 0 ? Math.round(((items.length - unreadCount) / items.length) * 100) : 0;

  const filteredItems = items.filter((item) => {
    if (activeTab === "unread") return !item.isRead;
    if (activeTab === "jobs") return item.bucket === "jobs";
    if (activeTab === "billing") return item.bucket === "billing";
    return true;
  });

  const handleToggleRead = (id: string) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, isRead: !item.isRead } : item))
    );
  };

  const handleMarkAllRead = () => {
    setItems((current) => current.map((item) => ({ ...item, isRead: true })));
  };

  return (
    <div className="relative min-h-screen selection:bg-emerald-500/30">
      {/* Background Blobs */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] rounded-full bg-linear-to-br from-emerald-500/15 to-blue-500/5 blur-[130px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[5%] right-[-10%] w-[40%] h-[40%] rounded-full bg-linear-to-tr from-blue-600/8 to-emerald-500/15 blur-[110px] opacity-30" />
      </div>

      <div className="container mx-auto px-4 md:px-8 py-10 md:py-14 max-w-7xl">
        <section className="relative overflow-hidden rounded-5xl border border-brand-border bg-background/40 backdrop-blur-xl p-8 md:p-12 mb-8 shadow-2xl">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-[100px] opacity-60" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-blue-500/10 blur-[80px] opacity-40" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge
                variant="outline"
                className="mb-6 px-4 py-1.5 border-brand-border bg-emerald-500/5 text-emerald-600 tracking-wide font-bold"
              >
                <Bell className="w-3.5 h-3.5 mr-2 text-emerald-500 animate-pulse" />
                ACTIVITY CENTER
              </Badge>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/60 leading-none">
                Notifications
              </h1>
              <p className="mt-6 text-muted-foreground text-lg md:text-xl max-w-2xl font-medium opacity-90 leading-relaxed">
                Stay updated on your job search progress, subscription status, and account activity
                in real-time.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
              <Button
                variant="outline"
                size="lg"
                className="h-14 px-8 rounded-full font-bold border-brand-border hover:bg-emerald-500/5 transition-all"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
              >
                <CheckCheck className="w-5 h-5 mr-2 text-emerald-500" />
                Mark all as read
              </Button>
              <Button
                size="lg"
                className="h-14 px-8 rounded-full font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 active:scale-95 group transition-all"
                asChild
              >
                <Link to="/settings">
                  Settings
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative mt-10 flex flex-col gap-4 rounded-3xl border border-brand-border bg-background/60 p-5 shadow-sm md:flex-row md:items-center md:justify-between backdrop-blur-md">
            <div className="flex items-center gap-4">
              <Avatar className="size-14 border-2 border-brand-border shadow-lg">
                <AvatarImage src={user?.avatar ?? undefined} />
                <AvatarFallback className="bg-linear-to-br from-emerald-500 to-blue-600 text-white font-black text-lg">
                  {initials ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-base font-black tracking-tight">
                  {user?.fullName ?? "Your Inbox"}
                </p>
                <p className="text-sm text-muted-foreground font-medium">
                  {unreadCount} unread updates • {readRate}% completion rate
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant="secondary"
                className="rounded-full px-4 py-1 font-bold bg-blue-500/10 text-blue-600"
              >
                Jobs {jobCount}
              </Badge>
              <Badge
                variant="secondary"
                className="rounded-full px-4 py-1 font-bold bg-emerald-500/10 text-emerald-600"
              >
                Billing {billingCount}
              </Badge>
              <Separator orientation="vertical" className="h-6 bg-brand-border hidden md:block" />
              <Badge
                variant="outline"
                className="rounded-full px-4 py-1 border-brand-border font-bold"
              >
                {items.length} TOTAL
              </Badge>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            label="UNREAD"
            value={unreadCount.toString()}
            description="Awaiting action"
            tone="bg-red-500/10 text-red-600"
            icon={Bell}
          />
          <StatCard
            label="JOBS"
            value={jobCount.toString()}
            description="Pipeline activity"
            tone="bg-blue-500/10 text-blue-600"
            icon={BriefcaseBusiness}
          />
          <StatCard
            label="BILLING"
            value={billingCount.toString()}
            description="Renewal status"
            tone="bg-emerald-500/10 text-emerald-600"
            icon={CreditCard}
          />
          <StatCard
            label="READ RATE"
            value={`${readRate}%`}
            description="Inbox efficiency"
            tone="bg-emerald-500/10 text-emerald-600"
            icon={CheckCheck}
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as NotificationTab)}
            className="lg:col-span-8 w-full"
          >
            <Card className="rounded-4xl border-brand-border bg-background/40 backdrop-blur-xl overflow-hidden shadow-xl">
              <CardHeader className="gap-6 border-b border-brand-border p-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <CardTitle className="text-3xl font-black tracking-tighter">
                      Your Inbox
                    </CardTitle>
                    <CardDescription className="mt-2 text-base font-medium">
                      Manage all your platform activities in one unified feed.
                    </CardDescription>
                  </div>
                  <Badge className="rounded-full px-4 py-1.5 font-black bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                    {unreadCount} NEW
                  </Badge>
                </div>

                <TabsList className="w-full sm:w-fit rounded-2xl bg-emerald-500/5 p-1.5 border border-brand-border">
                  <TabsTrigger
                    value="all"
                    className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all"
                  >
                    All
                    <span className="ml-2 opacity-60">{items.length}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="unread"
                    className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all"
                  >
                    Unread
                    <span className="ml-2 opacity-60">{unreadCount}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="jobs"
                    className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all"
                  >
                    Jobs
                    <span className="ml-2 opacity-60">{jobCount}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="billing"
                    className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all"
                  >
                    Billing
                    <span className="ml-2 opacity-60">{billingCount}</span>
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent className="p-8">
                <NotificationFeed
                  items={filteredItems}
                  onToggleRead={handleToggleRead}
                  onShowAll={() => setActiveTab("all")}
                />
              </CardContent>
            </Card>
          </Tabs>

          <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-24 self-start">
            <Card className="rounded-4xl border-brand-border bg-background/40 backdrop-blur-xl shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                  <Inbox className="w-5 h-5 text-emerald-500" />
                  Inbox Health
                </CardTitle>
                <CardDescription className="font-medium text-sm">
                  Track your notification management efficiency.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-4xl font-black tracking-tighter text-emerald-600">
                      {readRate}%
                    </p>
                    <p className="text-xs text-muted-foreground font-black tracking-widest mt-1 uppercase opacity-60">
                      READ RATE
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="rounded-full border-brand-border bg-emerald-500/5 font-bold"
                  >
                    {items.length} TOTAL
                  </Badge>
                </div>

                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-emerald-500/10">
                  <div
                    className="h-full bg-linear-to-r from-emerald-500 to-blue-600 transition-all duration-500 ease-in-out"
                    style={{ width: `${readRate}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-bold tracking-tight">
                  <span className="text-emerald-600">{items.length - unreadCount} READ</span>
                  <span className="text-red-500">{unreadCount} UNREAD</span>
                </div>

                <Separator className="bg-brand-border" />

                <div className="space-y-4">
                  <ChannelRow
                    icon={Mail}
                    title="Email Alerts"
                    description="Critical job updates"
                    badge="Active"
                  />
                  <ChannelRow
                    icon={Bell}
                    title="Push Notifications"
                    description="Real-time web alerts"
                    badge="On"
                  />
                  <ChannelRow
                    icon={Settings2}
                    title="Preferences"
                    description="Fine-tune alert types"
                    badge="Live"
                  />
                </div>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-12 rounded-2xl font-bold border-brand-border hover:bg-emerald-500/5 transition-all"
                  asChild
                >
                  <Link to="/settings">Open preferences</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-4xl border-brand-border bg-background/40 backdrop-blur-xl shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                  <Filter className="w-5 h-5 text-emerald-500" />
                  Shortcuts
                </CardTitle>
                <CardDescription className="font-medium text-sm">
                  Jump to relevant app sections.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-12 justify-between rounded-2xl border-brand-border hover:border-emerald-500/30 hover:bg-emerald-500/5 font-bold transition-all group"
                  asChild
                >
                  <Link to="/dashboard">
                    Dashboard
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-12 justify-between rounded-2xl border-brand-border hover:border-emerald-500/30 hover:bg-emerald-500/5 font-bold transition-all group"
                  asChild
                >
                  <Link to="/subscription">
                    Billing
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

type StatCardProps = {
  label: string;
  value: string;
  description: string;
  tone: string;
  icon: LucideIcon;
};

const StatCard = ({ label, value, description, tone, icon: Icon }: StatCardProps) => (
  <Card className="rounded-4xl border-brand-border bg-background/40 backdrop-blur-xl hover:bg-background/60 transition-all shadow-lg group">
    <CardContent className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black mb-3 opacity-60">
            {label}
          </p>
          <p className="text-4xl font-black tracking-tighter leading-none">{value}</p>
          <p className="text-sm text-muted-foreground mt-3 font-medium opacity-80">{description}</p>
        </div>
        <div
          className={cn(
            "size-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform",
            tone
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </CardContent>
  </Card>
);

type NotificationFeedProps = {
  items: NotificationItem[];
  onToggleRead: (id: string) => void;
  onShowAll: () => void;
};

const NotificationFeed = ({ items, onToggleRead, onShowAll }: NotificationFeedProps) => {
  if (items.length === 0) {
    return <EmptyNotificationsState onShowAll={onShowAll} />;
  }

  const groupedItems = groupOrder
    .map((group) => ({
      group,
      items: items.filter((item) => item.group === group),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="space-y-10">
      {groupedItems.map((section) => (
        <section key={section.group} className="space-y-4">
          <div className="flex items-center gap-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 whitespace-nowrap">
              {section.group}
            </h3>
            <Separator className="bg-brand-border" />
            <span className="text-xs font-bold text-muted-foreground opacity-60">
              {section.items.length}
            </span>
          </div>

          <div className="space-y-4">
            {section.items.map((item) => (
              <NotificationRow key={item.id} item={item} onToggleRead={onToggleRead} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

const NotificationRow = ({
  item,
  onToggleRead,
}: {
  item: NotificationItem;
  onToggleRead: (id: string) => void;
}) => {
  const Icon = item.icon;

  return (
    <div
      className={cn(
        "rounded-3xl border border-brand-border bg-background/60 p-6 transition-all hover:border-emerald-500/30 hover:shadow-xl group/row",
        !item.isRead && "bg-emerald-500/3 border-brand-border shadow-lg shadow-emerald-500/5"
      )}
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <div
          className={cn(
            "flex size-14 shrink-0 items-center justify-center rounded-[1.25rem] shadow-sm",
            item.tone
          )}
        >
          <Icon className="w-6 h-6" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant="secondary"
              className="rounded-full px-3 py-1 font-bold bg-muted/60 text-muted-foreground border border-brand-border"
            >
              {item.category}
            </Badge>
            {!item.isRead ? (
              <Badge className="rounded-full px-3 py-1 font-black bg-emerald-500 text-white">
                UNREAD
              </Badge>
            ) : null}
            <span className="text-xs font-medium text-muted-foreground opacity-60 ml-auto">
              {item.time}
            </span>
          </div>

          <h4 className="mt-4 text-xl font-black tracking-tight leading-tight group-hover/row:text-emerald-600 transition-colors">
            {item.title}
          </h4>
          <p className="mt-2 text-base text-muted-foreground leading-relaxed font-medium opacity-90">
            {item.message}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl font-bold h-10 px-5 hover:bg-emerald-500/5 hover:text-emerald-600 transition-all"
              onClick={() => onToggleRead(item.id)}
            >
              {item.isRead ? "Mark unread" : "Mark as read"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="rounded-xl font-bold h-10 px-5 border-brand-border hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group/cta"
              asChild
            >
              <Link to={item.ctaTo}>
                {item.ctaLabel}
                <ArrowRight className="w-4 h-4 ml-2 group-hover/cta:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-end gap-3 shrink-0">
          <Badge
            variant="outline"
            className="rounded-full border-brand-border text-[10px] font-black uppercase tracking-widest px-3 py-1 text-muted-foreground opacity-60"
          >
            {formatNotificationType(item.type)}
          </Badge>
        </div>
      </div>
    </div>
  );
};

const EmptyNotificationsState = ({ onShowAll }: { onShowAll: () => void }) => (
  <div className="rounded-5xl border-2 border-dashed border-brand-border bg-emerald-500/2 p-16 text-center">
    <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-3xl bg-emerald-500/5 shadow-inner">
      <Bell className="w-10 h-10 text-emerald-500/40" />
    </div>
    <h3 className="text-2xl font-black tracking-tight">No notifications found</h3>
    <p className="mt-3 text-base text-muted-foreground max-w-md mx-auto font-medium opacity-80">
      There is nothing in this view right now. Try switching back to the full feed.
    </p>
    <div className="mt-10 flex flex-wrap justify-center gap-4">
      <Button
        size="lg"
        className="h-12 px-8 rounded-full font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
        onClick={onShowAll}
      >
        Show all notifications
      </Button>
      <Button
        variant="ghost"
        size="lg"
        className="h-12 px-8 rounded-full font-bold hover:bg-emerald-500/5 transition-all"
        asChild
      >
        <Link to="/dashboard">Go to dashboard</Link>
      </Button>
    </div>
  </div>
);

const ChannelRow = ({
  icon: Icon,
  title,
  description,
  badge,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  badge: string;
}) => (
  <div className="flex items-center gap-4 rounded-2xl border border-brand-border bg-background/40 p-4 hover:border-emerald-500/30 transition-all">
    <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/5 shadow-inner">
      <Icon className="w-5 h-5 text-emerald-600" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-black tracking-tight">{title}</p>
      <p className="text-xs text-muted-foreground font-medium opacity-80">{description}</p>
    </div>
    <Badge
      variant="secondary"
      className="rounded-full px-3 py-1 font-bold bg-emerald-500/10 text-emerald-600 border border-brand-border"
    >
      {badge}
    </Badge>
  </div>
);

export default NotificationsPage;
