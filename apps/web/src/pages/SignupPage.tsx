import { useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import googleLogo from "@/assets/google-logo.svg";
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "react-router-dom";

const SignupPage = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      toast.error("Passwords don't match!");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authClient.signUp.email({
        email,
        password,
        name: fullName,
      });

      if (response.error) {
        toast.error(response.error.statusText);
        return;
      }

      toast.success("Account created successfully!");
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    // This will redirect the page - no response to handle
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
    // This code never runs - user gets redirected
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && fullName && email && password && confirmPassword) {
      handleSubmit();
    }
  };

  const isFormValid =
    fullName &&
    email &&
    password &&
    confirmPassword &&
    password === confirmPassword;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-slate-200 p-4">
        <Card className="w-full max-w-md shadow-2xl border-gray-200 bg-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-gray-900">
              Create an account
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Enter your information to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-gray-700">
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-sm text-red-600">Passwords don't match</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              onClick={handleSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? "Creating account..." : "Sign up"}
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              disabled={isLoading}
              onClick={handleGoogleSignIn}
              className="w-full bg-white border-gray-300 text-gray-700 hover:bg-gray-50 inline-flex items-center justify-center gap-2"
            >
              <img src={googleLogo} className="size-5" alt="Google" />
              Google
            </Button>
            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <a
                href="#"
                className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                onClick={() => navigate("/login")}
              >
                Sign in
              </a>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SignupPage;
