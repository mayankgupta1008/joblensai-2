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
  Heart,
  Mail,
  Briefcase,
  CheckCheck,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RootState } from "@/store/store";
import { logout } from "@/store/slices/authSlice";

/* --------------------------------------------------------------- */
/* Mock notifications — swap with real feed later                   */
/* --------------------------------------------------------------- */
const mockNotifications = [
  {
    id: "1",
    icon: Heart,
    tone: "text-pink-500 bg-pink-500/10",
    title: "New match!",
    body: "Acme Corp matched with you for Senior FE Engineer",
    time: "2m ago",
    unread: true,
  },
  {
    id: "2",
    icon: Mail,
    tone: "text-blue-500 bg-blue-500/10",
    title: "AI email sent",
    body: "Your outreach to Stripe was delivered",
    time: "14m ago",
    unread: true,
  },
  {
    id: "3",
    icon: Briefcase,
    tone: "text-green-500 bg-green-500/10",
    title: "Interview scheduled",
    body: "Linear — tech screen tomorrow at 2:00 PM",
    time: "1h ago",
    unread: true,
  },
  {
    id: "4",
    icon: Sparkles,
    tone: "text-yellow-500 bg-yellow-500/10",
    title: "3 new job picks",
    body: "Handpicked roles based on your Skill DNA",
    time: "3h ago",
    unread: false,
  },
];

const NavBar = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    setMobileOpen(false);
  };

  const initials =
    user?.fullName
      ?.split(" ")
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2 group shrink-0">
          <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2">
            <img src={logo} alt="JobLens AI" className="w-9 h-9" />
            <span className="font-bold text-xl tracking-tight hidden sm:inline-block whitespace-nowrap">
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
            <div className="hidden md:flex items-center gap-2 border-l pl-4 border-border/50">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-sm font-semibold border border-foreground"
              >
                <Link to="/login">Log in</Link>
              </Button>
              <Button
                size="sm"
                className="font-semibold shadow-md active:scale-95 transition-all"
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
                className="md:hidden rounded-full"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] sm:max-w-sm p-0 flex flex-col">
              <SheetHeader className="border-b border-border/40 px-6 pt-6 pb-4">
                <SheetTitle className="flex items-center gap-2 font-bold text-lg tracking-tight">
                  <img src={logo} alt="JobLens AI" className="w-7 h-7" />
                  JobLens AI
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
    <NavigationMenuList>
      <NavigationMenuItem>
        <NavigationMenuTrigger className="bg-transparent hover:bg-muted/50 transition-colors">
          Features
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul className="grid gap-3 p-6 md:w-100 lg:w-125 lg:grid-cols-[.75fr_1fr]">
            <ListItem href="#features" title="AI Outreach">
              Automated personalized handshake generated by LLM.
            </ListItem>
            <ListItem href="#features" title="Skill DNA">
              Matching based on technical skill fingerprints.
            </ListItem>
            <ListItem href="#features" title="Real-time">
              Instant notifications when you both swipe right.
            </ListItem>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
          <a href="#how-it-works">How it Works</a>
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
          <a href="#pricing">Pricing</a>
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
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
    <NavigationMenuList>
      <NavigationMenuItem>
        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
          <Link to="/dashboard">Dashboard</Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
          <Link to="/upload">Swipe</Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
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
  const unreadCount = mockNotifications.filter((n) => n.unread).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full hover:bg-muted/50"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[22rem] p-0 rounded-2xl border-border/60 shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-linear-to-r from-primary/5 via-transparent to-purple-500/5">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="default" className="text-[10px] font-bold px-1.5">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[11px] font-semibold text-muted-foreground hover:text-foreground rounded-full"
          >
            <CheckCheck className="w-3 h-3 mr-1" />
            Mark all read
          </Button>
        </div>

        {/* List */}
        <ScrollArea className="h-80">
          {mockNotifications.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-1">Start swiping to get matched</p>
            </div>
          ) : (
            mockNotifications.map((n) => (
              <button
                key={n.id}
                className={cn(
                  "w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors border-b border-border/20 last:border-0 relative",
                  n.unread && "bg-primary/5"
                )}
              >
                {n.unread && (
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                    n.tone
                  )}
                >
                  <n.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <p className="text-sm font-bold truncate">{n.title}</p>
                    <span className="text-[10px] text-muted-foreground font-semibold shrink-0">
                      {n.time}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                </div>
              </button>
            ))
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border/40 p-2">
          <Button variant="ghost" size="sm" className="w-full rounded-xl text-xs font-semibold">
            View all notifications
            <ChevronRight className="w-3 h-3 ml-1" />
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
        className="rounded-full ring-2 ring-transparent hover:ring-primary/30 transition-all active:scale-95"
        aria-label="User menu"
      >
        <Avatar size="default">
          {avatar && <AvatarImage src={avatar} alt={fullName} />}
          <AvatarFallback className="bg-primary/10 text-primary font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="end"
      sideOffset={8}
      className="w-64 rounded-2xl border-border/60 shadow-xl p-1.5"
    >
      <DropdownMenuLabel className="px-3 py-3">
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            {avatar && <AvatarImage src={avatar} alt={fullName} />}
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{fullName ?? "User"}</p>
            <p className="text-xs text-muted-foreground truncate font-normal">{email ?? "—"}</p>
          </div>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild className="rounded-lg cursor-pointer py-2">
        <Link to="/dashboard">
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild className="rounded-lg cursor-pointer py-2">
        <Link to="/dashboard">
          <UserIcon className="w-4 h-4" />
          Profile
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild className="rounded-lg cursor-pointer py-2">
        <Link to="/subscription">
          <CreditCard className="w-4 h-4" />
          Subscription
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild className="rounded-lg cursor-pointer py-2">
        <Link to="/dashboard">
          <Settings className="w-4 h-4" />
          Settings
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        variant="destructive"
        onClick={onLogout}
        className="rounded-lg cursor-pointer py-2 font-semibold"
      >
        <LogOut className="w-4 h-4" />
        Log out
      </DropdownMenuItem>
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
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30 border border-border/40">
      <Avatar size="lg">
        {avatar && <AvatarImage src={avatar} alt={fullName} />}
        <AvatarFallback className="bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate">{fullName ?? "User"}</p>
        <p className="text-xs text-muted-foreground truncate">{email ?? "—"}</p>
      </div>
    </div>

    <div className="space-y-1">
      <MobileLink to="/dashboard" icon={LayoutDashboard} onClick={onClose}>
        Dashboard
      </MobileLink>
      <MobileLink to="/upload" icon={Sparkles} onClick={onClose}>
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

    <Separator />

    <div className="flex items-center justify-between px-1">
      <span className="text-sm font-semibold text-muted-foreground">Theme</span>
      <ModeToggle />
    </div>

    <Button
      variant="outline"
      size="lg"
      onClick={onLogout}
      className="w-full rounded-full font-semibold text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
    >
      <LogOut className="w-4 h-4 mr-2" />
      Log out
    </Button>
  </div>
);

const MobilePublicMenu = ({ onClose }: { onClose: () => void }) => (
  <div className="space-y-5">
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
      <MobileLink to="/login" icon={Briefcase} onClick={onClose}>
        Post a Job
      </MobileLink>
    </div>

    <Separator />

    <div className="flex items-center justify-between px-1">
      <span className="text-sm font-semibold text-muted-foreground">Theme</span>
      <ModeToggle />
    </div>

    <div className="grid grid-cols-2 gap-3">
      <Button variant="outline" size="lg" className="rounded-full font-semibold" asChild>
        <Link to="/login" onClick={onClose}>
          Log in
        </Link>
      </Button>
      <Button size="lg" className="rounded-full font-semibold shadow-md active:scale-95" asChild>
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
    className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted/50 transition-colors font-semibold text-sm group"
  >
    <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
    <span className="flex-1">{children}</span>
    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
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
    className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted/50 transition-colors font-semibold text-sm group"
  >
    <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
    <span className="flex-1">{children}</span>
    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
  </a>
);

/* --------------------------------------------------------------- */
/* ListItem (original, for PublicNav Features dropdown)             */
/* --------------------------------------------------------------- */
interface ListItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  title: string;
}

const ListItem = ({ className, title, children, ...props }: ListItemProps) => (
  <li>
    <NavigationMenuLink asChild>
      <a
        className={cn(
          "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          className
        )}
        {...props}
      >
        <div className="text-sm font-medium leading-none">{title}</div>
        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{children}</p>
      </a>
    </NavigationMenuLink>
  </li>
);

export default NavBar;
