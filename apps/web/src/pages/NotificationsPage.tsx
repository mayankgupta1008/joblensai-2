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
} from "lucide-react";
import type { RootState } from "@/store/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
    tone: "bg-green-500/10 text-green-500",
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
    tone: "bg-blue-500/10 text-blue-500",
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
    tone: "bg-red-500/10 text-red-500",
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
    tone: "bg-yellow-500/10 text-yellow-500",
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
    tone: "bg-blue-500/10 text-blue-500",
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
    tone: "bg-purple-500/10 text-purple-500",
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
    <div className="relative min-h-screen selection:bg-primary/30">
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] rounded-full bg-linear-to-br from-primary/15 to-blue-500/5 blur-[130px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[5%] right-[-10%] w-[40%] h-[40%] rounded-full bg-linear-to-tr from-purple-500/8 to-primary/15 blur-[110px] opacity-30" />
      </div>

      <div className="container mx-auto px-4 md:px-8 py-10 md:py-14 max-w-7xl">
        <section className="relative overflow-hidden rounded-4xl border border-primary/20 bg-linear-to-br from-primary/10 via-background to-blue-500/5 p-6 md:p-8 mb-6">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl opacity-60" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-blue-500/10 blur-3xl opacity-40" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge
                variant="outline"
                className="mb-4 px-3 py-1 border-primary/20 bg-primary/5 text-primary tracking-wide"
              >
                <Bell className="w-3 h-3 mr-1.5 text-primary" />
                Activity center
              </Badge>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/60 leading-[1.05]">
                Notifications
              </h1>
              <p className="mt-4 text-muted-foreground text-base md:text-lg max-w-2xl">
                Keep track of job updates, billing events, and account changes without digging
                through the rest of the app.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full font-semibold"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark all read
              </Button>
              <Button
                size="lg"
                className="rounded-full font-bold shadow-lg shadow-primary/20 active:scale-95 group"
                asChild
              >
                <Link to="/settings">
                  Notification settings
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative mt-6 flex flex-col gap-3 rounded-2xl border border-border/40 bg-background/70 p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="size-12 border border-border/40">
                <AvatarImage src={user?.avatar ?? undefined} />
                <AvatarFallback className="bg-linear-to-br from-primary to-secondary text-primary-foreground font-bold">
                  {initials ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{user?.fullName ?? "Your inbox"}</p>
                <p className="text-xs text-muted-foreground">
                  {unreadCount} unread updates and a {readRate}% read rate
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                Jobs {jobCount}
              </Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                Billing {billingCount}
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 border-primary/20">
                {items.length} total
              </Badge>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Unread"
            value={unreadCount.toString()}
            description="Needs your attention"
            tone="bg-red-500/10 text-red-500"
            icon={Bell}
          />
          <StatCard
            label="Job updates"
            value={jobCount.toString()}
            description="Applications and interviews"
            tone="bg-blue-500/10 text-blue-500"
            icon={BriefcaseBusiness}
          />
          <StatCard
            label="Billing"
            value={billingCount.toString()}
            description="Payments and renewals"
            tone="bg-yellow-500/10 text-yellow-500"
            icon={CreditCard}
          />
          <StatCard
            label="Read rate"
            value={`${readRate}%`}
            description="Inbox status at a glance"
            tone="bg-green-500/10 text-green-500"
            icon={CheckCheck}
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as NotificationTab)}
            className="lg:col-span-8 w-full"
          >
            <Card className="rounded-3xl border-border/40 dark:border-primary/20 bg-muted/20 overflow-hidden">
              <CardHeader className="gap-4 border-b border-border/40 p-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold">Inbox</CardTitle>
                    <CardDescription className="mt-1">
                      The latest events from your job search and subscription activity.
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="rounded-full w-fit px-3 py-1">
                    {unreadCount} unread
                  </Badge>
                </div>

                <TabsList className="w-full sm:w-auto rounded-full bg-muted/60 p-1">
                  <TabsTrigger value="all" className="rounded-full px-4">
                    All
                    <span className="ml-2 text-xs text-muted-foreground">{items.length}</span>
                  </TabsTrigger>
                  <TabsTrigger value="unread" className="rounded-full px-4">
                    Unread
                    <span className="ml-2 text-xs text-muted-foreground">{unreadCount}</span>
                  </TabsTrigger>
                  <TabsTrigger value="jobs" className="rounded-full px-4">
                    Jobs
                    <span className="ml-2 text-xs text-muted-foreground">{jobCount}</span>
                  </TabsTrigger>
                  <TabsTrigger value="billing" className="rounded-full px-4">
                    Billing
                    <span className="ml-2 text-xs text-muted-foreground">{billingCount}</span>
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent className="p-6">
                <NotificationFeed
                  items={filteredItems}
                  onToggleRead={handleToggleRead}
                  onShowAll={() => setActiveTab("all")}
                />
              </CardContent>
            </Card>
          </Tabs>

          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 self-start">
            <Card className="rounded-3xl border-border/40 dark:border-primary/20 bg-muted/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold">Inbox health</CardTitle>
                <CardDescription>
                  Read rate and delivery status for the notifications in this feed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-3xl font-black tracking-tight">{readRate}%</p>
                    <p className="text-xs text-muted-foreground">Read rate</p>
                  </div>
                  <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5">
                    {items.length} total
                  </Badge>
                </div>

                <Progress value={readRate} className="h-2" />

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{items.length - unreadCount} read</span>
                  <span>{unreadCount} unread</span>
                </div>

                <Separator className="my-2" />

                <div className="space-y-3">
                  <ChannelRow
                    icon={Mail}
                    title="Email alerts"
                    description="Critical job and billing updates"
                    badge="On"
                  />
                  <ChannelRow
                    icon={Bell}
                    title="In-app feed"
                    description="Real-time updates while you are online"
                    badge="Live"
                  />
                  <ChannelRow
                    icon={Settings2}
                    title="Preferences"
                    description="Fine-tune alert types and frequency"
                    badge="Edit"
                  />
                </div>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full rounded-full font-semibold"
                  asChild
                >
                  <Link to="/settings">Open notification settings</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/40 dark:border-primary/20 bg-muted/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold">Shortcuts</CardTitle>
                <CardDescription>Jump to the screens these notifications point to.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full justify-between rounded-full"
                  asChild
                >
                  <Link to="/dashboard">
                    Open dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full justify-between rounded-full"
                  asChild
                >
                  <Link to="/subscription">
                    Manage subscription
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full justify-between rounded-full"
                  asChild
                >
                  <Link to="/settings">
                    Update settings
                    <ArrowRight className="w-4 h-4" />
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
  <Card className="rounded-3xl border-border/40 dark:border-primary/20 bg-muted/20 hover:bg-muted/30 transition-all">
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">
            {label}
          </p>
          <p className="text-3xl font-black tracking-tight">{value}</p>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <div className={cn("size-11 rounded-2xl flex items-center justify-center shrink-0", tone)}>
          <Icon className="w-5 h-5" />
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
    <div className="space-y-6">
      {groupedItems.map((section) => (
        <section key={section.group} className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              {section.group}
            </h3>
            <span className="text-xs text-muted-foreground">
              {section.items.length} update{section.items.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="space-y-3">
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
        "rounded-2xl border border-border/40 bg-background/70 p-4 transition-all hover:border-primary/20 hover:shadow-sm",
        !item.isRead && "bg-primary/5"
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div
          className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", item.tone)}
        >
          <Icon className="w-5 h-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {item.category}
            </Badge>
            {!item.isRead ? (
              <Badge
                variant="outline"
                className="rounded-full px-3 py-1 border-primary/20 text-primary"
              >
                Unread
              </Badge>
            ) : null}
            <span className="text-xs text-muted-foreground">{item.time}</span>
          </div>

          <h4 className="mt-2 text-base font-semibold leading-tight">{item.title}</h4>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.message}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={() => onToggleRead(item.id)}
            >
              {item.isRead ? "Mark unread" : "Mark read"}
            </Button>

            <Button variant="outline" size="sm" className="rounded-full" asChild>
              <Link to={item.ctaTo}>
                {item.ctaLabel}
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 md:flex-col md:items-end md:justify-between">
          <span className="text-xs text-muted-foreground">{item.group}</span>
          <Badge
            variant="outline"
            className="rounded-full border-border/60 text-[10px] uppercase tracking-widest"
          >
            {formatNotificationType(item.type)}
          </Badge>
        </div>
      </div>
    </div>
  );
};

const EmptyNotificationsState = ({ onShowAll }: { onShowAll: () => void }) => (
  <div className="rounded-2xl border border-dashed border-border/60 bg-background/60 p-10 text-center">
    <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted/60">
      <Bell className="w-6 h-6 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold">No notifications in this filter</h3>
    <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
      There is nothing here right now. Switch back to the full inbox to see the rest of your
      updates.
    </p>
    <div className="mt-6 flex flex-wrap justify-center gap-3">
      <Button variant="outline" className="rounded-full font-semibold" onClick={onShowAll}>
        Show all notifications
      </Button>
      <Button variant="ghost" className="rounded-full font-semibold" asChild>
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
  <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-background/70 p-3">
    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/5">
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
    <Badge variant="secondary" className="rounded-full px-3 py-1">
      {badge}
    </Badge>
  </div>
);

export default NotificationsPage;
