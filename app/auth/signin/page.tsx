"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import MobileAuthGuard from "@/components/mobile-auth-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Get callback URL from search params
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const validateFields = () => {
    const errors: {
      email?: string;
      password?: string;
    } = {};
    
    if (!email) {
      errors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = "Invalid email format";
    }
    
    if (!password) {
      errors.password = "Password is required";
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    
    if (!validateFields()) {
      return;
    }
    
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setFormError("Invalid email or password");
        toast({
          title: "Login failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
      } else if (result?.ok) {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        // Force a longer delay and use window.location for better mobile compatibility
        setTimeout(() => {
          // Use window.location.href for better mobile browser compatibility
          window.location.href = callbackUrl;
        }, 500);
      } else {
        setFormError("Something went wrong during login");
        toast({
          title: "Login failed",
          description: "Something went wrong during login",
          variant: "destructive",
        });
      }
    } catch (error) {
      setFormError("Something went wrong. Please try again.");
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl });
  };

  return (
    <MobileAuthGuard requireAuth={false} redirectTo={callbackUrl}>
      <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Card className="w-full max-w-md glass">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Sign In</CardTitle>
            <CardDescription className="text-center text-gray-300">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formError && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex justify-between">
                  Email
                  {fieldErrors.email && (
                    <span className="text-xs text-red-500">{fieldErrors.email}</span>
                  )}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors({
                        ...fieldErrors,
                        email: undefined,
                      });
                    }
                  }}
                  className={`bg-white/5 border-white/10 ${
                    fieldErrors.email ? "border-red-500 focus-visible:ring-red-500" : ""
                  }`}
                  onBlur={() => {
                    if (!email) {
                      setFieldErrors({
                        ...fieldErrors,
                        email: "Email is required",
                      });
                    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
                      setFieldErrors({
                        ...fieldErrors,
                        email: "Invalid email format",
                      });
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="flex justify-between">
                  Password
                  {fieldErrors.password && (
                    <span className="text-xs text-red-500">{fieldErrors.password}</span>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) {
                        setFieldErrors({
                          ...fieldErrors,
                          password: undefined,
                        });
                      }
                    }}
                    className={`bg-white/5 border-white/10 ${
                      fieldErrors.password ? "border-red-500 focus-visible:ring-red-500" : ""
                    }`}
                    onBlur={() => {
                      if (!password) {
                        setFieldErrors({
                          ...fieldErrors,
                          password: "Password is required",
                        });
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-gray-400">Or continue with</span>
              </div>
            </div>
            
            <Button variant="outline" onClick={handleGoogleSignIn} className="w-full border-white/20 text-white bg-white/5 hover:bg-white/10">
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>
            
            <div className="text-center text-sm text-gray-300">
              Don't have an account?{" "}
              <Link href="/auth/register" className="text-blue-400 hover:underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
    </MobileAuthGuard>
  );
}
