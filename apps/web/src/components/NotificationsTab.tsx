import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { FaBell, FaEnvelope, FaMobileAlt, FaCreditCard, FaShieldAlt } from "react-icons/fa";
import { Separator } from "@/components/ui/separator";

const NotificationsTab = () => {
  const notificationToggle = ({
    title,
    description,
    icon: Icon,
    defaultChecked,
  }: {
    title: string;
    description: string;
    icon: React.ElementType;
    defaultChecked?: boolean;
  }) => (
    <Card className="bg-background/60 border border-brand-border rounded-2xl shadow-sm hover:border-emerald-500/30 transition-all group/toggle">
      <CardContent className="flex flex-row items-center justify-between p-5">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/5 text-emerald-600 group-hover/toggle:scale-110 transition-transform">
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <p className="font-black tracking-tight text-base">{title}</p>
            <p className="text-xs text-muted-foreground font-medium opacity-80">{description}</p>
          </div>
        </div>
        <div className="flex items-center ml-4">
          <Switch className="data-[state=checked]:bg-emerald-500" defaultChecked={defaultChecked} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border-brand-border bg-background/40 backdrop-blur-xl rounded-4xl shadow-xl overflow-hidden dark:bg-white/5 dark:ring-1 dark:ring-white/10">
        <CardHeader className="p-8 border-b border-brand-border">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-inner">
              <FaBell className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black tracking-tight">
                Notification Preferences
              </CardTitle>
              <CardDescription className="font-medium">
                Control how and when you want to be notified.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                <FaEnvelope className="w-5 h-5 text-emerald-500" />
                Delivery Channels
              </h3>
              <div className="space-y-4">
                {notificationToggle({
                  title: "Email Alerts",
                  description: "Receive activity reports and job matches via email.",
                  icon: FaEnvelope,
                  defaultChecked: true,
                })}
                {notificationToggle({
                  title: "Push Notifications",
                  description: "Real-time web alerts while you're browsing.",
                  icon: FaMobileAlt,
                })}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                <FaShieldAlt className="w-5 h-5 text-emerald-500" />
                Alert Categories
              </h3>
              <div className="space-y-4">
                {notificationToggle({
                  title: "Job Matching",
                  description: "Get notified when AI finds a high-signal role.",
                  icon: FaBell,
                  defaultChecked: true,
                })}
                {notificationToggle({
                  title: "Billing & Plan",
                  description: "Subscription renewals and payment status.",
                  icon: FaCreditCard,
                  defaultChecked: true,
                })}
              </div>
            </div>
          </div>

          <Separator className="bg-brand-border" />
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button className="h-14 px-12 rounded-full font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">
          Save Notification Changes
        </Button>
      </div>
    </div>
  );
};

export default NotificationsTab;
