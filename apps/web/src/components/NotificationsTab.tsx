import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

const NotificationsTab = () => {
  return (
    <div>
      <Card className="flex flex-col gap-6 py-6 shadow-sm border-border/80">
        {/* Header */}
        <div className="px-6 flex flex-col gap-1">
          <CardTitle className="text-2xl font-bold tracking-tight">Notifications</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Manage your notification preferences
          </CardDescription>
        </div>
        <CardContent className="flex flex-col px-6">
          <div className="w-full flex flex-col">
            <Tabs defaultValue="all" className="w-full flex flex-col">
              <div className="space-y-4">
                <Card className="bg-muted/10 border border-border/60 shadow-none">
                  <CardContent className="flex flex-row justify-between py-3 px-4">
                    <div className="flex flex-col">
                      <p className="font-medium text-sm">Email Alerts</p>
                      <p className="text-xs text-muted-foreground">Get notified by emails</p>
                    </div>
                    <div className="flex items-center">
                      <Switch />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/10 border border-border/60 shadow-none">
                  <CardContent className="flex flex-row justify-between py-3 px-4">
                    <div className="flex flex-col">
                      <p className="font-medium text-sm">In-App Alerts</p>
                      <p className="text-xs text-muted-foreground">Get in-app notifications</p>
                    </div>
                    <div className="flex items-center">
                      <Switch />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/10 border border-border/60 shadow-none">
                  <CardContent className="flex flex-row justify-between py-3 px-4">
                    <div className="flex flex-col">
                      <p className="font-medium text-sm">Billing Alerts</p>
                      <p className="text-xs text-muted-foreground">
                        Billing and subscription updates
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Switch />
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="flex justify-end mt-6">
                <Button onClick={() => {}}>Save Changes</Button>
              </div>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsTab;
