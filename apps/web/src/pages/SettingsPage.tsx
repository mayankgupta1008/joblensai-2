import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/store/store";
import { logout } from "@/store/slices/authSlice";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  User as UserIcon,
  Mail,
  Lock,
  CreditCard as CreditCardIcon,
  Shield,
  LogOut,
  Plus,
  CheckCircle2,
  Sparkles,
  TriangleAlert,
  Gem,
} from "lucide-react";
import ProfileTab from "@/components/ProfileTab";
import BillingTab from "@/components/BillingTab";
import AccountTab from "@/components/AccountTab";
import SecurityTab from "@/components/SecurityTab";

const SettingsPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState("profile");

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logged out successfully");
  };

  const initials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isSubscribed = user?.subscriptionId;
  const isEmailVerified = user?.emailVerified;
  return (
    <div className="min-h-screen bg-muted/40">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-linear-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-4 md:px-8 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-background shadow-lg">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="text-4xl font-bold bg-linear-to-br from-primary to-primary/80 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  className="absolute bottom-0 right-0 rounded-full bg-background text-primary hover:bg-primary hover:text-white border border-border"
                  title="Change photo"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-linear-to-r from-primary to-secondary bg-clip-text text-foreground">
                  {user?.fullName}
                </h1>
                <p className="text-muted-foreground mt-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </p>
                <div className="flex items-center gap-4 mt-4">
                  {isEmailVerified ? (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Verified Email
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <TriangleAlert className="w-4 h-4 text-yellow-500" />
                      Unverified Email
                    </Badge>
                  )}
                  {isSubscribed ? (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Gem className="w-4 h-4" />
                      Pro Member
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                      Free Member
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-3">
            <Card className="sticky top-24">
              <CardContent className="p-4">
                <nav className="flex flex-col gap-2">
                  <Button
                    variant={activeTab === "profile" ? "default" : "ghost"}
                    className="justify-start h-12"
                    onClick={() => setActiveTab("profile")}
                  >
                    <UserIcon className="w-5 h-5 mr-3" />
                    Profile
                  </Button>
                  <Button
                    variant={activeTab === "account" ? "default" : "ghost"}
                    className="justify-start h-12"
                    onClick={() => setActiveTab("account")}
                  >
                    <Lock className="w-5 h-5 mr-3" />
                    Account
                  </Button>
                  <Button
                    variant={activeTab === "billing" ? "default" : "ghost"}
                    className="justify-start h-12"
                    onClick={() => setActiveTab("billing")}
                  >
                    <CreditCardIcon className="w-5 h-5 mr-3" />
                    Billing
                  </Button>
                  <Button
                    variant={activeTab === "security" ? "default" : "ghost"}
                    className="justify-start h-12"
                    onClick={() => setActiveTab("security")}
                  >
                    <Shield className="w-5 h-5 mr-3" />
                    Security
                  </Button>
                  <Separator className="my-2" />
                  <Button
                    variant="ghost"
                    className="justify-start h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Log out
                  </Button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9">
            {activeTab === "profile" && <ProfileTab />}
            {activeTab === "account" && <AccountTab />}
            {activeTab === "billing" && <BillingTab />}
            {activeTab === "security" && <SecurityTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
