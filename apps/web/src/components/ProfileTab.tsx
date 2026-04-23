import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const ProfileTab = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-2xl">Profile</CardTitle>
          <CardDescription>Manage your profile settings and preferences.</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Your full name"
                defaultValue={user?.fullName || ""}
                className="max-w-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Your email address"
                defaultValue={user?.email || ""}
                disabled
                className="max-w-md bg-muted/50"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Rate Limit</h3>
            <div className="bg-muted/30 rounded-lg p-4 max-w-md border border-dashed">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-destructive">0 requests remaining</p>
                  <p className="text-xs text-muted-foreground">
                    Resets in: <span className="text-foreground">Reset now</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Resume</h3>
            <div className="flex flex-col gap-4 max-w-md">
              <div className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4 hover:border-primary/50 transition-colors">
                <div className="bg-primary/10 p-3 rounded-full">
                  <svg
                    className="w-6 h-6 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">No resume uploaded yet</p>
                  <p className="text-xs text-muted-foreground">
                    Upload your resume in PDF format. Max size of 4MB.
                  </p>
                </div>
                <Button variant="default" className="w-full max-w-50">
                  Choose File
                </Button>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                  Pdf (4mb)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button className="px-8 h-11">Save Changes</Button>
      </div>
    </div>
  );
};

export default ProfileTab;
