import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bell, Mail, Smartphone, CreditCard, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const NotificationsTab = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border-emerald-500/10 bg-background/40 backdrop-blur-xl rounded-[2rem] shadow-xl overflow-hidden">
        <CardHeader className="p-8 border-b border-emerald-500/10">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-inner">
              <Bell className="w-6 h-6" />
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
                <Mail className="w-5 h-5 text-emerald-500" />
                Delivery Channels
              </h3>
              <div className="space-y-4">
                <NotificationToggle
                  title="Email Alerts"
                  description="Receive activity reports and job matches via email."
                  icon={Mail}
                  defaultChecked
                />
                <NotificationToggle
                  title="Push Notifications"
                  description="Real-time web alerts while you're browsing."
                  icon={Smartphone}
                />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                Alert Categories
              </h3>
              <div className="space-y-4">
                <NotificationToggle
                  title="Job Matching"
                  description="Get notified when AI finds a high-signal role."
                  icon={Bell}
                  defaultChecked
                />
                <NotificationToggle
                  title="Billing & Plan"
                  description="Subscription renewals and payment status."
                  icon={CreditCard}
                  defaultChecked
                />
              </div>
            </div>
          </div>

          <Separator className="bg-emerald-500/10" />

          <div className="p-8 rounded-[2rem] bg-emerald-500/[0.03] border border-emerald-500/10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <h4 className="text-lg font-black tracking-tight">Weekly Digest</h4>
              <p className="text-sm text-muted-foreground font-medium opacity-80">
                Receive a summarized report of your job search progress every Monday.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="rounded-full px-4 py-1 border-emerald-500/10 font-bold text-muted-foreground uppercase tracking-widest text-[10px]"
              >
                RECOMENDED
              </Badge>
              <Switch className="data-[state=checked]:bg-emerald-500" defaultChecked />
            </div>
          </div>
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

const NotificationToggle = ({
  title,
  description,
  icon: Icon,
  defaultChecked,
}: {
  title: string;
  description: string;
  icon: any;
  defaultChecked?: boolean;
}) => (
  <Card className="bg-background/60 border border-emerald-500/10 rounded-2xl shadow-sm hover:border-emerald-500/30 transition-all group/toggle">
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

export default NotificationsTab;
