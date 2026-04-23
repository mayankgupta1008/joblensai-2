import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const AccountTab = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const initials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-2xl">Account</CardTitle>
          <CardDescription>Manage your core account details and preferences.</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Avatar</CardTitle>
          <CardDescription>Change your profile picture</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-8">
          <Avatar className="w-24 h-24 border-4 border-muted">
            <AvatarImage src={user?.avatar ?? undefined} />
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button size="sm">Upload new photo</Button>
              <Button size="sm" variant="outline">
                Remove
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Allowed JPG, GIF or PNG. Max size of 800K
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input placeholder="username" defaultValue={user?.email?.split("@")[0]} />
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Input placeholder="English (US)" defaultValue="English (US)" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" className="w-full md:w-fit">
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountTab;
