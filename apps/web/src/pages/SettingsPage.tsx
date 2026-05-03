import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "@/store/slices/authSlice";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  User as UserIcon,
  Lock,
  CreditCard as CreditCardIcon,
  Shield,
  LogOut,
  Bell,
  ChevronLeft,
  Settings,
  Sparkles,
  WrenchIcon,
} from "lucide-react";
import ProfileTab from "@/components/ProfileTab";
import BillingTab from "@/components/BillingTab";
import AccountTab from "@/components/AccountTab";
import SecurityTab from "@/components/SecurityTab";
import NotificationsTab from "@/components/NotificationsTab";
import HelpCenterTab from "@/components/HelpCenterTab";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const TABS = [
  { id: "profile", label: "Profile", icon: UserIcon, component: ProfileTab },
  { id: "account", label: "Account", icon: Lock, component: AccountTab },
  { id: "billing", label: "Billing", icon: CreditCardIcon, component: BillingTab },
  { id: "security", label: "Security", icon: Shield, component: SecurityTab },
  { id: "notifications", label: "Notifications", icon: Bell, component: NotificationsTab },
  { id: "help-support", label: "Help & Support", icon: WrenchIcon, component: HelpCenterTab },
];

const SettingsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("profile");
  const [accordionValue, setAccordionValue] = useState("");

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logged out successfully");
  };

  const ActiveComponent = TABS.find((tab) => tab.id === activeTab)?.component || ProfileTab;

  return (
    <div className="relative min-h-screen selection:bg-emerald-500/30 pb-20">
      {/* Background Blobs */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] rounded-full bg-linear-to-br from-emerald-500/10 to-blue-500/5 blur-[130px] opacity-40" />
        <div className="absolute bottom-[5%] right-[-10%] w-[40%] h-[40%] rounded-full bg-linear-to-tr from-blue-600/8 to-emerald-500/10 blur-[110px] opacity-30" />
      </div>

      <div className="container mx-auto px-4 md:px-8 py-10 md:py-16 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-3">
            <Badge
              variant="outline"
              className="px-4 py-1.5 border-brand-border bg-emerald-500/5 text-emerald-600 tracking-wide font-bold"
            >
              <Settings className="w-3.5 h-3.5 mr-2 text-emerald-500 animate-spin-slow" />
              SYSTEM PREFERENCES
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/60 leading-none">
              Settings
            </h1>
            <p className="text-muted-foreground text-lg font-medium opacity-80 max-w-xl leading-relaxed">
              Configure your platform preferences, manage security, and fine-tune your account
              experience.
            </p>
          </div>

          <Button
            variant="outline"
            size="lg"
            className="w-fit h-12 rounded-full font-bold border-brand-border hover:bg-emerald-500/5 transition-all text-muted-foreground hover:text-emerald-600"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            <span>Back to Dashboard</span>
          </Button>
        </div>

        {/* Desktop Tabs Navigation */}
        <div className="hidden md:block mb-12">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start h-14 p-1.5 gap-2 rounded-2xl bg-emerald-500/5 border border-brand-border backdrop-blur-md">
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="px-8 h-full flex items-center gap-2.5 rounded-xl font-bold data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/20 transition-all group"
                >
                  <tab.icon className="w-4 h-4 group-data-[state=active]:scale-110 transition-transform" />
                  <span>{tab.label}</span>
                </TabsTrigger>
              ))}
              <Separator orientation="vertical" className="mx-2 h-8 bg-brand-border" />
              <Button
                variant="ghost"
                className="h-full px-6 flex items-center gap-2.5 rounded-xl font-bold text-red-500 hover:bg-red-500/10 transition-all ml-auto"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </Button>
            </TabsList>
          </Tabs>
        </div>

        {/* Mobile Accordion Navigation */}
        <div className="md:hidden mb-8">
          <Accordion
            type="single"
            collapsible
            value={accordionValue}
            onValueChange={setAccordionValue}
            className="w-full border border-brand-border rounded-2xl bg-background/40 backdrop-blur-xl overflow-hidden shadow-xl"
          >
            <AccordionItem value="settings-tabs" className="border-none">
              <AccordionTrigger className="px-6 py-5 hover:no-underline font-black text-lg">
                <div className="flex items-center gap-3">
                  {TABS.find((t) => t.id === activeTab)?.icon && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 shadow-inner">
                      {React.createElement(TABS.find((t) => t.id === activeTab)!.icon, {
                        className: "w-5 h-5",
                      })}
                    </div>
                  )}
                  <span className="tracking-tight">
                    {TABS.find((t) => t.id === activeTab)?.label}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <div className="flex flex-col gap-2">
                  {TABS.map((tab) => (
                    <Button
                      key={tab.id}
                      variant={activeTab === tab.id ? "secondary" : "ghost"}
                      className={`justify-start h-14 px-4 rounded-xl transition-all border ${
                        activeTab === tab.id
                          ? "border-brand-border bg-emerald-500/10 text-emerald-600 shadow-sm"
                          : "border-transparent hover:bg-emerald-500/5 hover:text-emerald-600"
                      }`}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setAccordionValue("");
                      }}
                    >
                      <tab.icon className="w-5 h-5 mr-4" />
                      <span className="font-bold">{tab.label}</span>
                    </Button>
                  ))}
                  <Separator className="my-3 mx-2 bg-brand-border" />
                  <Button
                    variant="ghost"
                    className="justify-start h-14 px-4 text-red-500 hover:bg-red-500/10 rounded-xl font-bold transition-all"
                    onClick={() => {
                      handleLogout();
                      setAccordionValue("");
                    }}
                  >
                    <LogOut className="w-5 h-5 mr-4" />
                    <span>Sign Out</span>
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Main Content Area */}
        <div className="relative group/content animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="absolute -inset-1 bg-linear-to-r from-emerald-500/20 via-blue-500/10 to-emerald-500/20 rounded-5xl blur-2xl opacity-20 group-hover/content:opacity-30 transition-opacity" />
          <div className="relative">
            <ActiveComponent />
          </div>
        </div>

        {/* Premium Support Badge */}
        <div className="mt-16 text-center">
          <Badge
            variant="outline"
            className="px-6 py-2 rounded-full border-brand-border bg-background/40 backdrop-blur-md text-muted-foreground font-medium text-sm shadow-sm"
          >
            <Sparkles className="w-4 h-4 mr-2 text-emerald-500" />
            Need help? Contact our premium support 24/7
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
