"use client";

import { useEffect, useState } from "react";
import EditableProfile from "@/components/editable-profile";
import { Card, CardContent } from "@/components/ui/card";

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const res = await fetch("/api/user/profile");
        const data = await res.json();
        if (data.success) {
          setUserProfile(data.user);
        } else {
          setError(data.error || "Failed to load profile");
        }
      } catch (err) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleProfileUpdate = (updatedProfile: any) => {
    setUserProfile(updatedProfile);
  };

  if (loading) {
    return (
      <Card className="mt-24 w-full max-w-2xl mx-auto shadow-xl">
        <CardContent className="p-4 sm:p-8 text-center text-gray-400">Loading profile...</CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-24 w-full max-w-2xl mx-auto shadow-xl">
        <CardContent className="p-4 sm:p-8 text-center text-red-400">{error}</CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-24 w-full max-w-2xl mx-auto px-2 sm:px-4 md:px-6 pb-16">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-lg">
        My Profile
      </h1>
      <EditableProfile userProfile={userProfile} onProfileUpdate={handleProfileUpdate} />
    </div>
  );
} 