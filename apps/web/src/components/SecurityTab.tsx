import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Lock, Smartphone, Monitor } from "lucide-react";

const SecurityTab = () => {
  return (
    <div className="space-y-6">
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-2xl">Security</CardTitle>
          <CardDescription>
            Secure your account with multi-factor authentication and strong passwords.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your password to stay secure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 max-w-md">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input type="password" />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input type="password" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button>Update Password</Button>
        </CardFooter>
      </Card>

      {/* 2FA */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </div>
            <Switch />
          </div>
        </CardHeader>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>Devices that are currently logged into your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-xl">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Monitor className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">MacOS - San Francisco, USA</p>
                <p className="text-xs text-muted-foreground">Chrome Browser • Active now</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] uppercase font-bold">
              Current
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Badge = ({
  children,
  variant,
  className,
}: {
  children: React.ReactNode;
  variant?: any;
  className?: string;
}) => (
  <span
    className={`px-2 py-0.5 rounded text-xs ${variant === "outline" ? "border" : "bg-muted"} ${className}`}
  >
    {children}
  </span>
);

export default SecurityTab;
