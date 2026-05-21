import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "./mode-toggle";
import logo from "@/assets/joblensai.svg";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  Settings,
  LogOut,
  User as UserIcon,
  Menu,
  LayoutDashboard,
  CreditCard,
  Sparkles,
  BriefcaseBusiness,
  BadgeCheck,
  CircleAlert,
  CheckCheck,
  ChevronRight,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RootState } from "@/store/store";
import { logout } from "@/store/slices/authSlice";

import { markAllAsRead, type Notification } from "@/store/slices/notificationsSlice";
import axiosWrapper from "@/lib/axiosWrapper";
import { useBroadcastChannel } from "@/hooks/useBroadcastChannel";

const getNotificationConfig = (type: Notification["type"]) => {
  switch (type) {
    case "PAYMENT_FAILED":
    case "SUBSCRIPTION_RENEWAL_FAILED":
      return { icon: CircleAlert, tone: "text-red-500 bg-red-500/10" };
    case "SUBSCRIPTION_STARTED":
    case "SUBSCRIPTION_RENEWED":
      return { icon: Sparkles, tone: "text-emerald-500 bg-emerald-500/10" };
    case "JOB_APPLIED":
    case "JOB_INTERVIEW":
      return { icon: BriefcaseBusiness, tone: "text-blue-500 bg-blue-500/10" };
    case "JOB_OFFER":
    case "JOB_ACCEPTED":
      return { icon: BadgeCheck, tone: "text-emerald-600 bg-emerald-600/10" };
    default:
      return { icon: Bell, tone: "text-emerald-500 bg-emerald-500/10" };
  }
};

const NavBar = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);
  const [mobileOpen, setMobileOpen] = useState(false);
  const postAuth = useBroadcastChannel<{ type: "LOGOUT" }>("auth");

  const handleLogout = async () => {
    try {
      await axiosWrapper.post("/auth/logout");
    } catch (error) {
      console.error("Logout failed:", error);
      // Ignore
    } finally {
      dispatch(logout());
      setMobileOpen(false);
      postAuth({ type: "LOGOUT" });
    }
  };

  const initials =
    user?.fullName
      ?.split(" ")
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-brand-border bg-background/80 backdrop-blur-lg supports-backdrop-filter:bg-background/60 transition-all duration-300">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2 group shrink-0">
          <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2">
            <div className="relative group-hover:scale-110 transition-transform duration-300">
              <div className="absolute inset-0 bg-emerald-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <img src={logo} alt="JobLens AI" className="w-9 h-9 relative z-10" />
            </div>
            <span className="font-black text-xl tracking-tighter hidden sm:inline-block whitespace-nowrap bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/70 group-hover:from-emerald-500 group-hover:to-blue-600 transition-all duration-300">
              JobLens AI
            </span>
          </Link>
        </div>

        {/* Centered nav — desktop only */}
        <div className="hidden md:flex flex-1 justify-center">
          {isAuthenticated ? <AuthNav /> : <PublicNav />}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 md:gap-3">
          {isAuthenticated ? (
            <>
              <NotificationBell />
              <div className="hidden md:block">
                <UserMenu
                  fullName={user?.fullName}
                  email={user?.email}
                  avatar={user?.avatar}
                  initials={initials}
                  onLogout={handleLogout}
                />
              </div>
              <div className="hidden md:block">
                <ModeToggle />
              </div>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-3 border-l pl-5 border-brand-border">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-sm font-bold border border-brand-border hover:bg-emerald-500/5 text-emerald-600 transition-all rounded-full px-5"
              >
                <Link to="/login">Log in</Link>
              </Button>
              <Button
                size="sm"
                className="font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all rounded-full px-5"
                asChild
              >
                <Link to="/signup">Get Started</Link>
              </Button>
              <ModeToggle />
            </div>
          )}

          {/* Mobile hamburger — uses Sheet */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-full hover:bg-emerald-500/10 hover:text-emerald-600"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[85vw] sm:max-w-sm p-0 flex flex-col border-brand-border"
            >
              <SheetHeader className="border-b border-brand-border px-6 pt-6 pb-4">
                <SheetTitle className="flex items-center gap-2 font-black text-xl tracking-tighter">
                  <img src={logo} alt="JobLens AI" className="w-7 h-7" />
                  <span className="bg-clip-text text-transparent bg-linear-to-r from-emerald-500 to-blue-600">
                    JobLens AI
                  </span>
                </SheetTitle>
                <SheetDescription className="sr-only">Main navigation menu</SheetDescription>
              </SheetHeader>

              <ScrollArea className="flex-1">
                <div className="p-6">
                  {isAuthenticated ? (
                    <MobileAuthMenu
                      fullName={user?.fullName}
                      email={user?.email}
                      avatar={user?.avatar}
                      initials={initials}
                      onLogout={handleLogout}
                      onClose={() => setMobileOpen(false)}
                    />
                  ) : (
                    <MobilePublicMenu onClose={() => setMobileOpen(false)} />
                  )}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

/* --------------------------------------------------------------- */
/* Public nav (desktop)                                             */
/* --------------------------------------------------------------- */
const PublicNav = () => (
  <NavigationMenu>
    <NavigationMenuList className="gap-1">
      <NavigationMenuItem>
        <NavigationMenuTrigger className="bg-transparent hover:bg-emerald-500/5 hover:text-emerald-600 transition-colors rounded-full font-semibold">
          Features
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul className="grid gap-3 p-6 md:w-100 lg:w-125 lg:grid-cols-[.75fr_1fr] bg-background/95 backdrop-blur-xl border border-brand-border rounded-3xl">
            <ListItem href="#features" title="AI Outreach" icon={Sparkles}>
              Automated personalized handshake generated by LLM.
            </ListItem>
            <ListItem href="#features" title="Skill DNA" icon={Flame}>
              Matching based on technical skill fingerprints.
            </ListItem>
            <ListItem href="#features" title="Real-time" icon={Bell}>
              Instant notifications when you both swipe right.
            </ListItem>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink
          asChild
          className={cn(
            navigationMenuTriggerStyle(),
            "bg-transparent hover:bg-emerald-500/5 hover:text-emerald-600 transition-colors rounded-full font-semibold"
          )}
        >
          <a href="#how-it-works">How it Works</a>
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink
          asChild
          className={cn(
            navigationMenuTriggerStyle(),
            "bg-transparent hover:bg-emerald-500/5 hover:text-emerald-600 transition-colors rounded-full font-semibold"
          )}
        >
          <a href="#pricing">Pricing</a>
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink
          asChild
          className={cn(
            navigationMenuTriggerStyle(),
            "bg-transparent hover:bg-emerald-500/5 hover:text-emerald-600 transition-colors rounded-full font-semibold"
          )}
        >
          <Link to="/login">Post a Job</Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
);

/* --------------------------------------------------------------- */
/* Authenticated nav (desktop)                                      */
/* --------------------------------------------------------------- */
const AuthNav = () => (
  <NavigationMenu>
    <NavigationMenuList className="gap-1">
      <NavigationMenuItem>
        <NavigationMenuLink
          asChild
          className={cn(
            navigationMenuTriggerStyle(),
            "bg-transparent hover:bg-emerald-500/5 hover:text-emerald-600 transition-colors rounded-full font-semibold px-5"
          )}
        >
          <Link to="/dashboard">Dashboard</Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink
          asChild
          className={cn(
            navigationMenuTriggerStyle(),
            "bg-transparent hover:bg-emerald-500/5 hover:text-emerald-600 transition-colors rounded-full font-semibold px-5"
          )}
        >
          <Link to="/upload">Swipe</Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink
          asChild
          className={cn(
            navigationMenuTriggerStyle(),
            "bg-transparent hover:bg-emerald-500/5 hover:text-emerald-600 transition-colors rounded-full font-semibold px-5"
          )}
        >
          <Link to="/subscription">Subscription</Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
);

/* --------------------------------------------------------------- */
/* Notification Bell — Popover + ScrollArea                         */
/* --------------------------------------------------------------- */
const NotificationBell = () => {
  const dispatch = useDispatch();
  const { items, unreadCount } = useSelector((s: RootState) => s.notifications);
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full hover:bg-emerald-500/10 hover:text-emerald-600 transition-all"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-88 p-0 rounded-3xl border-brand-border shadow-2xl overflow-hidden bg-background/95 backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border bg-linear-to-r from-emerald-500/5 via-transparent to-blue-500/5">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-500" />
            <span className="font-black text-sm tracking-tight">Notifications</span>
            {unreadCount > 0 && (
              <Badge
                variant="default"
                className="text-[10px] font-bold px-1.5 bg-emerald-500 shadow-md shadow-emerald-500/20"
              >
                {unreadCount} new
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              try {
                await axiosWrapper.patch("/notifications/read-all");
                dispatch(markAllAsRead());
              } catch (err) {
                console.error("Failed to mark all as read:", err);
              }
            }}
            className="h-7 text-[11px] font-bold text-emerald-600 hover:bg-emerald-500/10 rounded-full"
          >
            <CheckCheck className="w-3 h-3 mr-1" />
            Mark all read
          </Button>
        </div>

        {/* List */}
        <ScrollArea className="h-80">
          {items.length === 0 ? (
            <div className="py-12 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Bell className="w-6 h-6 text-muted-foreground opacity-50" />
              </div>
              <p className="text-sm font-black tracking-tight">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-2 font-medium">
                Start swiping to get matched and land your dream role.
              </p>
            </div>
          ) : (
            items.map((n) => {
              const { icon: Icon, tone } = getNotificationConfig(n.type);
              return (
                <button
                  key={n._id}
                  className={cn(
                    "w-full text-left flex items-start gap-3 px-5 py-4 hover:bg-emerald-500/5 transition-colors border-b border-brand-border last:border-0 relative",
                    !n.isRead && "bg-emerald-500/3"
                  )}
                >
                  {!n.isRead && (
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm" />
                  )}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-95",
                      tone
                    )}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                      <p className="text-sm font-black tracking-tight truncate">{n.title}</p>
                      <span className="text-[10px] text-muted-foreground font-bold shrink-0 uppercase tracking-widest opacity-70">
                        {new Date(n.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 font-medium leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-brand-border p-2.5">
          <Button
            variant="ghost"
            size="sm"
            className="w-full rounded-xl text-xs font-bold text-emerald-600 hover:bg-emerald-500/5"
            asChild
          >
            <Link to="/notifications" onClick={() => setOpen(false)}>
              View all notifications
              <ChevronRight className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

/* --------------------------------------------------------------- */
/* User avatar menu — DropdownMenu                                  */
/* --------------------------------------------------------------- */
interface UserMenuProps {
  fullName?: string;
  email?: string;
  avatar?: string;
  initials: string;
  onLogout: () => void;
}

const UserMenu = ({ fullName, email, avatar, initials, onLogout }: UserMenuProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button
        className="rounded-full ring-2 ring-transparent hover:ring-emerald-500/30 transition-all active:scale-95 p-0.5"
        aria-label="User menu"
      >
        <Avatar size="default" className="border-2 border-background">
          {avatar && <AvatarImage src={avatar} alt={fullName} />}
          <AvatarFallback className="bg-emerald-500/10 text-emerald-600 font-black">
            {initials}
          </AvatarFallback>
        </Avatar>
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="end"
      sideOffset={8}
      className="w-64 rounded-3xl border-brand-border shadow-2xl p-2 bg-background/95 backdrop-blur-xl"
    >
      <DropdownMenuLabel className="px-3 py-4">
        <div className="flex items-center gap-3">
          <Avatar size="lg" className="ring-2 ring-brand-border">
            {avatar && <AvatarImage src={avatar} alt={fullName} />}
            <AvatarFallback className="bg-emerald-500/10 text-emerald-600 font-black text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black tracking-tight truncate">{fullName ?? "User"}</p>
            <p className="text-xs text-muted-foreground truncate font-medium opacity-80">
              {email ?? "—"}
            </p>
          </div>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator className="bg-brand-border" />
      <div className="p-1 space-y-0.5">
        <DropdownMenuItem
          asChild
          className="rounded-xl cursor-pointer py-2.5 font-bold focus:bg-emerald-500/10 focus:text-emerald-600 transition-all"
        >
          <Link to="/dashboard">
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          asChild
          className="rounded-xl cursor-pointer py-2.5 font-bold focus:bg-emerald-500/10 focus:text-emerald-600 transition-all"
        >
          <Link to="/dashboard">
            <UserIcon className="w-4 h-4 mr-2" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          asChild
          className="rounded-xl cursor-pointer py-2.5 font-bold focus:bg-emerald-500/10 focus:text-emerald-600 transition-all"
        >
          <Link to="/subscription">
            <CreditCard className="w-4 h-4 mr-2" />
            Subscription
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          asChild
          className="rounded-xl cursor-pointer py-2.5 font-bold focus:bg-emerald-500/10 focus:text-emerald-600 transition-all"
        >
          <Link to="/settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Link>
        </DropdownMenuItem>
      </div>
      <DropdownMenuSeparator className="bg-brand-border" />
      <div className="p-1">
        <DropdownMenuItem
          variant="destructive"
          onClick={onLogout}
          className="rounded-xl cursor-pointer py-2.5 font-black focus:bg-red-500/10 focus:text-red-500"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log out
        </DropdownMenuItem>
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
);

/* --------------------------------------------------------------- */
/* Mobile menu contents                                             */
/* --------------------------------------------------------------- */
interface MobileAuthMenuProps {
  fullName?: string;
  email?: string;
  avatar?: string;
  initials: string;
  onClose: () => void;
  onLogout: () => void;
}

const MobileAuthMenu = ({
  fullName,
  email,
  avatar,
  initials,
  onClose,
  onLogout,
}: MobileAuthMenuProps) => (
  <div className="space-y-6">
    {/* User summary */}
    <div className="flex items-center gap-4 p-5 rounded-4xl bg-emerald-500/3 border border-brand-border">
      <Avatar size="lg" className="ring-2 ring-brand-border">
        {avatar && <AvatarImage src={avatar} alt={fullName} />}
        <AvatarFallback className="bg-emerald-500/10 text-emerald-600 font-black text-lg">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-black text-base tracking-tight truncate">{fullName ?? "User"}</p>
        <p className="text-xs text-muted-foreground truncate font-medium">{email ?? "—"}</p>
      </div>
    </div>

    <div className="space-y-1">
      <MobileLink to="/dashboard" icon={LayoutDashboard} onClick={onClose}>
        Dashboard
      </MobileLink>
      <MobileLink to="/notifications" icon={Bell} onClick={onClose}>
        Notifications
      </MobileLink>
      <MobileLink to="/upload" icon={Flame} onClick={onClose}>
        Swipe jobs
      </MobileLink>
      <MobileLink to="/dashboard" icon={UserIcon} onClick={onClose}>
        Profile
      </MobileLink>
      <MobileLink to="/subscription" icon={CreditCard} onClick={onClose}>
        Subscription
      </MobileLink>
      <MobileLink to="/dashboard" icon={Settings} onClick={onClose}>
        Settings
      </MobileLink>
    </div>

    <Separator className="bg-brand-border" />

    <div className="flex items-center justify-between px-2">
      <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest text-[10px]">
        Theme
      </span>
      <ModeToggle />
    </div>

    <Button
      variant="outline"
      size="lg"
      onClick={onLogout}
      className="w-full rounded-full font-black text-destructive border-red-500/20 hover:bg-red-500/10 active:scale-95 transition-all"
    >
      <LogOut className="w-4 h-4 mr-2" />
      Log out
    </Button>
  </div>
);

const MobilePublicMenu = ({ onClose }: { onClose: () => void }) => (
  <div className="space-y-6">
    <div className="space-y-1">
      <MobileAnchor href="#features" icon={Sparkles} onClick={onClose}>
        Features
      </MobileAnchor>
      <MobileAnchor href="#how-it-works" icon={ChevronRight} onClick={onClose}>
        How it works
      </MobileAnchor>
      <MobileAnchor href="#pricing" icon={CreditCard} onClick={onClose}>
        Pricing
      </MobileAnchor>
      <MobileLink to="/login" icon={BriefcaseBusiness} onClick={onClose}>
        Post a Job
      </MobileLink>
    </div>

    <Separator className="bg-brand-border" />

    <div className="flex items-center justify-between px-2">
      <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest text-[10px]">
        Theme
      </span>
      <ModeToggle />
    </div>

    <div className="grid grid-cols-2 gap-3">
      <Button
        variant="outline"
        size="lg"
        className="rounded-full font-bold border-brand-border text-emerald-600 hover:bg-emerald-500/5"
        asChild
      >
        <Link to="/login" onClick={onClose}>
          Log in
        </Link>
      </Button>
      <Button
        size="lg"
        className="rounded-full font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
        asChild
      >
        <Link to="/signup" onClick={onClose}>
          Get Started
        </Link>
      </Button>
    </div>
  </div>
);

interface MobileLinkProps {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  children: React.ReactNode;
}

const MobileLink = ({ to, icon: Icon, onClick, children }: MobileLinkProps) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-emerald-500/5 transition-all font-bold text-sm group active:bg-emerald-500/10"
  >
    <Icon className="w-5 h-5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
    <span className="flex-1 tracking-tight">{children}</span>
    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
  </Link>
);

interface MobileAnchorProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  children: React.ReactNode;
}

const MobileAnchor = ({ href, icon: Icon, onClick, children }: MobileAnchorProps) => (
  <a
    href={href}
    onClick={onClick}
    className="flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-emerald-500/5 transition-all font-bold text-sm group active:bg-emerald-500/10"
  >
    <Icon className="w-5 h-5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
    <span className="flex-1 tracking-tight">{children}</span>
    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
  </a>
);

/* --------------------------------------------------------------- */
/* ListItem (original, for PublicNav Features dropdown)             */
/* --------------------------------------------------------------- */
interface ListItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const ListItem = ({ className, title, children, icon: Icon, ...props }: ListItemProps) => (
  <li>
    <NavigationMenuLink asChild>
      <a
        className={cn(
          "flex items-start gap-4 select-none space-y-1 rounded-xl p-4 leading-none no-underline outline-none transition-all hover:bg-emerald-500/5 hover:text-emerald-600 focus:bg-emerald-500/10 focus:text-emerald-600 group",
          className
        )}
        {...props}
      >
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/10 transition-colors">
            <Icon className="w-5 h-5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
          </div>
        )}
        <div>
          <div className="text-sm font-black tracking-tight leading-none mb-1.5">{title}</div>
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground font-medium opacity-80 group-hover:text-emerald-600/70 transition-colors">
            {children}
          </p>
        </div>
      </a>
    </NavigationMenuLink>
  </li>
);

export default NavBar;
