import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { useState } from "react";
import { signInWithGoogle } from "@/lib/firebase-auth";

export function GoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      // First sign in with Firebase
      const user = await signInWithGoogle();
      if (user) {
        // Then sign in with NextAuth
        const result = await signIn("credentials", {
          email: user.email,
          name: user.displayName,
          image: user.photoURL,
          callbackUrl: "/dashboard",
        });
      }
    } catch (error) {
      console.error("Google sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full border-gray-700 hover:bg-gray-800"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="w-5 h-5 mr-2 border-2 border-gray-300 border-t-white rounded-full animate-spin" />
      ) : (
        <FcGoogle className="w-5 h-5 mr-2" />
      )}
      Continue with Google
    </Button>
  );
}
