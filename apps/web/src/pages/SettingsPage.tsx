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
  LifeBuoy,
  ChevronLeft,
} from "lucide-react";
import ProfileTab from "@/components/ProfileTab";
import BillingTab from "@/components/BillingTab";
import AccountTab from "@/components/AccountTab";
import SecurityTab from "@/components/SecurityTab";
import NotificationsTab from "@/components/NotificationsTab";
import HelpCenterTab from "@/components/HelpCenterTab";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  { id: "help-support", label: "Help & Support", icon: LifeBuoy, component: HelpCenterTab },
];

const SettingsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("profile");

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logged out successfully");
  };

  const ActiveComponent = TABS.find((tab) => tab.id === activeTab)?.component || ProfileTab;

  return (
    <div className="min-h-screen bg-muted/40 pb-20">
      <div className="container mx-auto px-4 md:px-8 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground text-sm">
              Manage your account settings and preferences.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-fit flex items-center gap-2 hover:bg-transparent px-0 md:px-3 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
        </div>

        {/* Desktop Tabs Navigation */}
        <div className="hidden md:block mb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start h-12 p-1.5 gap-1.5">
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="px-6 h-full flex items-center gap-2"
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Mobile Accordion Navigation */}
        <div className="md:hidden mb-6">
          <Accordion
            type="single"
            collapsible
            className="w-full border rounded-xl bg-card overflow-hidden"
          >
            <AccordionItem value="settings-tabs" className="border-none">
              <AccordionTrigger className="px-4 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  {TABS.find((t) => t.id === activeTab)?.icon && (
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {React.createElement(TABS.find((t) => t.id === activeTab)!.icon, {
                        className: "w-4 h-4",
                      })}
                    </div>
                  )}
                  <span className="font-semibold text-base">
                    {TABS.find((t) => t.id === activeTab)?.label}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-2">
                <div className="flex flex-col gap-1">
                  {TABS.map((tab) => (
                    <Button
                      key={tab.id}
                      variant={activeTab === tab.id ? "secondary" : "ghost"}
                      className={`justify-start h-12 px-3 rounded-lg border ${
                        activeTab === tab.id
                          ? "border-border/60 bg-secondary"
                          : "border-border/10 hover:border-border/40"
                      }`}
                      onClick={() => {
                        setActiveTab(tab.id);
                      }}
                    >
                      <tab.icon className="w-4 h-4 mr-3" />
                      <span className="font-medium">{tab.label}</span>
                    </Button>
                  ))}
                  <Separator className="my-2 mx-2" />
                  <Button
                    variant="ghost"
                    className="justify-start h-12 px-3 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    <span className="font-medium">Log out</span>
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Main Content */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
