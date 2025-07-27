"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  
  let errorMessage = "An unknown error occurred during authentication.";
  
  if (error === "AccessDenied") {
    errorMessage = "Access denied. You don't have permission to access this resource.";
  } else if (error === "Configuration") {
    errorMessage = "There is a problem with the server configuration.";
  } else if (error === "Verification") {
    errorMessage = "The verification token has expired or has already been used.";
  } else if (error === "OAuthAccountNotLinked") {
    errorMessage = "To confirm your identity, sign in with the same account you used originally.";
  }
  
  return (
    <Card className="w-full max-w-md bg-white/5 backdrop-blur-xl border-white/10">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center text-red-400">Authentication Error</CardTitle>
        <CardDescription className="text-center">
          <div className="flex justify-center mb-2">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          There was a problem signing you in
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg mb-4">
          <p className="text-red-300 text-sm">{errorMessage}</p>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex flex-col w-full gap-2">
          <Link href="/auth/signin" className="w-full">
            <Button className="w-full">
              Try Again
            </Button>
          </Link>
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full bg-white/5 hover:bg-white/10 text-white">
              Return to Home
            </Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function AuthError() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Suspense fallback={
        <Card className="w-full max-w-md bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Loading...</CardTitle>
          </CardHeader>
        </Card>
      }>
        <AuthErrorContent />
      </Suspense>
    </div>
  );
} 