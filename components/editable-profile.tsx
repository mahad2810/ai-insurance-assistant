"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Edit, Save, X, User, MapPin, Briefcase, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

interface EditableProfileProps {
  userProfile: any;
  onProfileUpdate: (updatedProfile: any) => void;
}

export default function EditableProfile({ userProfile, onProfileUpdate }: EditableProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(userProfile || {});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleEdit = () => {
    setEditedProfile(userProfile || {});
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedProfile(userProfile || {});
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedProfile),
      });

      const data = await response.json();

      if (data.success) {
        onProfileUpdate(data.user);
        setIsEditing(false);
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated.",
        });
      } else {
        throw new Error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setEditedProfile((prev: any) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setEditedProfile((prev: any) => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleNestedChange = (parent: string, child: string, value: any) => {
    setEditedProfile((prev: any) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [child]: value
      }
    }));
  };

  const handleNotificationChange = (type: string, checked: boolean) => {
    setEditedProfile((prev: any) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        notifications: {
          ...prev.preferences?.notifications,
          [type]: checked
        }
      }
    }));
  };

  const calculateProfileCompletion = () => {
    if (!userProfile) return 0;

    const fields = [
      userProfile.firstName,
      userProfile.lastName,
      userProfile.email,
      userProfile.phone,
      userProfile.dateOfBirth,
      userProfile.gender,
      userProfile.address?.street,
      userProfile.address?.city,
      userProfile.address?.country,
      userProfile.occupation,
      userProfile.company
    ];

    const completedFields = fields.filter(field => field && field.trim() !== '').length;
    return Math.round((completedFields / fields.length) * 100);
  };

  if (!userProfile) {
    return (
      <Card className="glass">
        <CardContent className="p-6">
          <p className="text-gray-400">No profile data available</p>
        </CardContent>
      </Card>
    );
  }

  const profileCompletion = calculateProfileCompletion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <Card className="glass w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Profile Information
              </CardTitle>
              <CardDescription className="text-gray-300">
                {isEditing ? "Edit your profile information" : "View and manage your profile details"}
              </CardDescription>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-gray-400">Profile completion:</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-white">{profileCompletion}%</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button onClick={handleEdit} variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button onClick={handleCancel} variant="outline" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} size="sm" disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? "Saving..." : "Save"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-2 sm:p-4 bg-white/5 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-gray-400">Member Since</p>
              <p className="text-white font-medium">
                {userProfile.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400">Last Login</p>
              <p className="text-white font-medium">
                {userProfile.lastLoginAt ? new Date(userProfile.lastLoginAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400">Account Status</p>
              <Badge variant={userProfile.accountStatus === 'active' ? 'default' : 'destructive'} className="text-xs">
                {userProfile.accountStatus || 'Unknown'}
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400">Total Chats</p>
              <p className="text-white font-medium">
                {userProfile.stats?.totalChats || 0}
              </p>
            </div>
          </div>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2 xs:grid-cols-4 bg-white/5 overflow-x-auto">
              <TabsTrigger value="basic" className="flex items-center space-x-2 data-[state=active]:bg-white/10">
                <User className="w-4 h-4" />
                <span>Basic</span>
              </TabsTrigger>
              <TabsTrigger value="address" className="flex items-center space-x-2 data-[state=active]:bg-white/10">
                <MapPin className="w-4 h-4" />
                <span>Address</span>
              </TabsTrigger>
              <TabsTrigger value="professional" className="flex items-center space-x-2 data-[state=active]:bg-white/10">
                <Briefcase className="w-4 h-4" />
                <span>Professional</span>
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center space-x-2 data-[state=active]:bg-white/10">
                <Settings className="w-4 h-4" />
                <span>Preferences</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  {isEditing ? (
                    <Input
                      id="firstName"
                      value={editedProfile.firstName || ''}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      className="bg-white/5 border-white/10"
                    />
                  ) : (
                    <p className="text-white mt-1">{userProfile.firstName || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  {isEditing ? (
                    <Input
                      id="lastName"
                      value={editedProfile.lastName || ''}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      className="bg-white/5 border-white/10"
                    />
                  ) : (
                    <p className="text-white mt-1">{userProfile.lastName || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={editedProfile.email || ''}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="bg-white/5 border-white/10"
                    />
                  ) : (
                    <p className="text-white mt-1">{userProfile.email || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={editedProfile.phone || ''}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="bg-white/5 border-white/10"
                    />
                  ) : (
                    <p className="text-white mt-1">{userProfile.phone || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  {isEditing ? (
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={editedProfile.dateOfBirth ? new Date(editedProfile.dateOfBirth).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                      className="bg-white/5 border-white/10"
                    />
                  ) : (
                    <p className="text-white mt-1">
                      {userProfile.dateOfBirth ? new Date(userProfile.dateOfBirth).toLocaleDateString() : 'Not provided'}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  {isEditing ? (
                    <Select value={editedProfile.gender || ''} onValueChange={(value) => handleChange('gender', value)}>
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-white mt-1 capitalize">{userProfile.gender || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="address" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="street">Street Address</Label>
                  {isEditing ? (
                    <Input
                      id="street"
                      value={editedProfile.address?.street || ''}
                      onChange={(e) => handleNestedChange('address', 'street', e.target.value)}
                      className="bg-white/5 border-white/10"
                    />
                  ) : (
                    <p className="text-white mt-1">{userProfile.address?.street || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  {isEditing ? (
                    <Input
                      id="city"
                      value={editedProfile.address?.city || ''}
                      onChange={(e) => handleNestedChange('address', 'city', e.target.value)}
                      className="bg-white/5 border-white/10"
                    />
                  ) : (
                    <p className="text-white mt-1">{userProfile.address?.city || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="state">State/Province</Label>
                  {isEditing ? (
                    <Input
                      id="state"
                      value={editedProfile.address?.state || ''}
                      onChange={(e) => handleNestedChange('address', 'state', e.target.value)}
                      className="bg-white/5 border-white/10"
                    />
                  ) : (
                    <p className="text-white mt-1">{userProfile.address?.state || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  {isEditing ? (
                    <Input
                      id="country"
                      value={editedProfile.address?.country || ''}
                      onChange={(e) => handleNestedChange('address', 'country', e.target.value)}
                      className="bg-white/5 border-white/10"
                    />
                  ) : (
                    <p className="text-white mt-1">{userProfile.address?.country || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                  {isEditing ? (
                    <Input
                      id="zipCode"
                      value={editedProfile.address?.zipCode || ''}
                      onChange={(e) => handleNestedChange('address', 'zipCode', e.target.value)}
                      className="bg-white/5 border-white/10"
                    />
                  ) : (
                    <p className="text-white mt-1">{userProfile.address?.zipCode || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="professional" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="occupation">Occupation</Label>
                  {isEditing ? (
                    <Input
                      id="occupation"
                      value={editedProfile.occupation || ''}
                      onChange={(e) => handleChange('occupation', e.target.value)}
                      className="bg-white/5 border-white/10"
                    />
                  ) : (
                    <p className="text-white mt-1">{userProfile.occupation || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  {isEditing ? (
                    <Input
                      id="company"
                      value={editedProfile.company || ''}
                      onChange={(e) => handleChange('company', e.target.value)}
                      className="bg-white/5 border-white/10"
                    />
                  ) : (
                    <p className="text-white mt-1">{userProfile.company || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="language">Language</Label>
                  {isEditing ? (
                    <Select 
                      value={editedProfile.preferences?.language || 'en'} 
                      onValueChange={(value) => handleNestedChange('preferences', 'language', value)}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="hi">Hindi</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-white mt-1 uppercase">{userProfile.preferences?.language || 'EN'}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  {isEditing ? (
                    <Select 
                      value={editedProfile.preferences?.theme || 'system'} 
                      onValueChange={(value) => handleNestedChange('preferences', 'theme', value)}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-white mt-1 capitalize">{userProfile.preferences?.theme || 'System'}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Label className="text-gray-300">Notification Preferences</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="email-notifications"
                        checked={isEditing ? editedProfile.preferences?.notifications?.email ?? true : userProfile.preferences?.notifications?.email ?? true}
                        onChange={(e) => handleNotificationChange('email', e.target.checked)}
                        disabled={!isEditing}
                        className="rounded bg-white/5"
                      />
                      <Label htmlFor="email-notifications" className="text-sm text-gray-300">Email notifications</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="sms-notifications"
                        checked={isEditing ? editedProfile.preferences?.notifications?.sms ?? false : userProfile.preferences?.notifications?.sms ?? false}
                        onChange={(e) => handleNotificationChange('sms', e.target.checked)}
                        disabled={!isEditing}
                        className="rounded bg-white/5"
                      />
                      <Label htmlFor="sms-notifications" className="text-sm text-gray-300">SMS notifications</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="push-notifications"
                        checked={isEditing ? editedProfile.preferences?.notifications?.push ?? true : userProfile.preferences?.notifications?.push ?? true}
                        onChange={(e) => handleNotificationChange('push', e.target.checked)}
                        disabled={!isEditing}
                        className="rounded bg-white/5"
                      />
                      <Label htmlFor="push-notifications" className="text-sm text-gray-300">Push notifications</Label>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}
