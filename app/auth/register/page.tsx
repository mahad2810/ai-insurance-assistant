"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Eye, EyeOff, Loader2, Check, X, User, Mail, Phone, MapPin, Briefcase, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Register() {
  const [currentTab, setCurrentTab] = useState("basic");
  const [formErrors, setFormErrors] = useState<{
    basic?: string;
    personal?: string;
    preferences?: string;
  }>({});
  const [fieldErrors, setFieldErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    phone?: string;
  }>({});
  
  const [formData, setFormData] = useState({
    // Basic Info
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    
    // Address
    address: {
      street: "",
      city: "",
      state: "",
      country: "",
      zipCode: ""
    },
    
    // Professional
    occupation: "",
    company: "",
    
    // Preferences
    preferences: {
      language: "en",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      theme: "system",
      notifications: {
        email: true,
        sms: false,
        push: true
      }
    }
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const passwordRequirements = [
    { regex: /.{8,}/, text: "At least 8 characters" },
    { regex: /[A-Z]/, text: "One uppercase letter" },
    { regex: /[a-z]/, text: "One lowercase letter" },
    { regex: /\d/, text: "One number" },
    { regex: /[@$!%*?&]/, text: "One special character" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else if (name.startsWith('preferences.')) {
      const prefField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear field errors when user changes input
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name.startsWith('preferences.')) {
      const prefField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleNotificationChange = (type: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        notifications: {
          ...prev.preferences.notifications,
          [type]: checked
        }
      }
    }));
  };

  const validateBasicInfo = () => {
    const errors: {
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    // First Name validation
    if (!formData.firstName) {
      errors.firstName = "First name is required";
    }

    // Last Name validation
    if (!formData.lastName) {
      errors.lastName = "Last name is required";
    }
    
    // Email validation
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = "Password is required";
    } else {
      const failedRequirements = passwordRequirements.filter(
        (req) => !req.regex.test(formData.password)
      );
      
      if (failedRequirements.length > 0) {
        errors.password = "Password does not meet requirements";
      }
    }
    
    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    
    setFieldErrors(prev => ({
      ...prev,
      ...errors
    }));
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(prev => ({
        ...prev,
        basic: "Please fix the errors before continuing"
      }));
      return false;
    }
    
    setFormErrors(prev => ({
      ...prev,
      basic: undefined
    }));
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateBasicInfo()) return;
    
    setIsLoading(true);

    try {
      const submitData = {
        ...formData,
        name: `${formData.firstName} ${formData.lastName}`.trim()
      };

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Registration successful",
          description: "Please sign in with your new account",
        });
        router.push("/auth/signin");
      } else {
        if (data.error.includes("already exists")) {
          setFormErrors(prev => ({
            ...prev,
            basic: "A user with this email already exists"
          }));
          setFieldErrors(prev => ({
            ...prev,
            email: "Email already registered"
          }));
          setCurrentTab("basic");
        } else if (data.error.includes("Password")) {
          setFormErrors(prev => ({
            ...prev,
            basic: "Password does not meet requirements"
          }));
          setFieldErrors(prev => ({
            ...prev,
            password: data.error
          }));
          setCurrentTab("basic");
        } else {
          setFormErrors(prev => ({
            ...prev,
            basic: data.error
          }));
        }
        
        toast({
          title: "Registration failed",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      setFormErrors(prev => ({
        ...prev,
        basic: "Something went wrong. Please try again."
      }));
      
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const nextTab = () => {
    if (currentTab === "basic" && validateBasicInfo()) {
      setCurrentTab("personal");
    } else if (currentTab === "personal") {
      setCurrentTab("preferences");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Card className="w-full max-w-2xl glass">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Create Account</CardTitle>
            <CardDescription className="text-center text-gray-300">
              Enter your information to create your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Tabs value={currentTab} onValueChange={setCurrentTab}>
                <TabsList className="grid w-full grid-cols-3 bg-white/5">
                  <TabsTrigger value="basic" className="flex items-center space-x-2 data-[state=active]:bg-white/10">
                    <User className="w-4 h-4" />
                    <span>Basic</span>
                  </TabsTrigger>
                  <TabsTrigger value="personal" className="flex items-center space-x-2 data-[state=active]:bg-white/10">
                    <MapPin className="w-4 h-4" />
                    <span>Personal</span>
                  </TabsTrigger>
                  <TabsTrigger value="preferences" className="flex items-center space-x-2 data-[state=active]:bg-white/10">
                    <Briefcase className="w-4 h-4" />
                    <span>Preferences</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-6">
                  {formErrors.basic && (
                    <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{formErrors.basic}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="flex justify-between">
                        First Name *
                        {fieldErrors.firstName && (
                          <span className="text-xs text-red-500">{fieldErrors.firstName}</span>
                        )}
                      </Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={handleChange}
                        className={`bg-white/5 border-white/10 ${
                          fieldErrors.firstName ? "border-red-500 focus-visible:ring-red-500" : ""
                        }`}
                        onBlur={() => {
                          if (!formData.firstName) {
                            setFieldErrors(prev => ({
                              ...prev,
                              firstName: "First name is required"
                            }));
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="flex justify-between">
                        Last Name *
                        {fieldErrors.lastName && (
                          <span className="text-xs text-red-500">{fieldErrors.lastName}</span>
                        )}
                      </Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={handleChange}
                        className={`bg-white/5 border-white/10 ${
                          fieldErrors.lastName ? "border-red-500 focus-visible:ring-red-500" : ""
                        }`}
                        onBlur={() => {
                          if (!formData.lastName) {
                            setFieldErrors(prev => ({
                              ...prev,
                              lastName: "Last name is required"
                            }));
                          }
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex justify-between">
                      Email *
                      {fieldErrors.email && (
                        <span className="text-xs text-red-500">{fieldErrors.email}</span>
                      )}
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john.doe@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className={`bg-white/5 border-white/10 ${
                        fieldErrors.email ? "border-red-500 focus-visible:ring-red-500" : ""
                      }`}
                      onBlur={() => {
                        if (!formData.email) {
                          setFieldErrors(prev => ({
                            ...prev,
                            email: "Email is required"
                          }));
                        } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
                          setFieldErrors(prev => ({
                            ...prev,
                            email: "Invalid email format"
                          }));
                        }
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={formData.phone}
                      onChange={handleChange}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex justify-between">
                      Password *
                      {fieldErrors.password && (
                        <span className="text-xs text-red-500">{fieldErrors.password}</span>
                      )}
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`bg-white/5 border-white/10 ${
                          fieldErrors.password ? "border-red-500 focus-visible:ring-red-500" : ""
                        }`}
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
                    {formData.password && (
                      <div className="space-y-1">
                        {passwordRequirements.map((req, index) => (
                          <div key={index} className="flex items-center text-xs">
                            {req.regex.test(formData.password) ? (
                              <Check className="h-3 w-3 text-green-500 mr-2" />
                            ) : (
                              <X className="h-3 w-3 text-red-500 mr-2" />
                            )}
                            <span className={req.regex.test(formData.password) ? "text-green-600" : "text-red-600"}>
                              {req.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="flex justify-between">
                      Confirm Password *
                      {fieldErrors.confirmPassword && (
                        <span className="text-xs text-red-500">{fieldErrors.confirmPassword}</span>
                      )}
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`bg-white/5 border-white/10 ${
                          fieldErrors.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : ""
                        }`}
                        onBlur={() => {
                          if (formData.password !== formData.confirmPassword) {
                            setFieldErrors(prev => ({
                              ...prev,
                              confirmPassword: "Passwords do not match"
                            }));
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <Button 
                    type="button" 
                    onClick={nextTab} 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Next: Personal Information
                  </Button>
                </TabsContent>

                <TabsContent value="personal" className="space-y-4 mt-6">
                  {formErrors.personal && (
                    <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{formErrors.personal}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={formData.gender} onValueChange={(value) => handleSelectChange('gender', value)}>
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
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-300">Address</h3>
                    <div className="space-y-2">
                      <Label htmlFor="address.street">Street Address</Label>
                      <Input
                        id="address.street"
                        name="address.street"
                        placeholder="123 Main Street"
                        value={formData.address.street}
                        onChange={handleChange}
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="address.city">City</Label>
                        <Input
                          id="address.city"
                          name="address.city"
                          placeholder="New York"
                          value={formData.address.city}
                          onChange={handleChange}
                          className="bg-white/5 border-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address.state">State/Province</Label>
                        <Input
                          id="address.state"
                          name="address.state"
                          placeholder="NY"
                          value={formData.address.state}
                          onChange={handleChange}
                          className="bg-white/5 border-white/10"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="address.country">Country</Label>
                        <Input
                          id="address.country"
                          name="address.country"
                          placeholder="United States"
                          value={formData.address.country}
                          onChange={handleChange}
                          className="bg-white/5 border-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address.zipCode">ZIP/Postal Code</Label>
                        <Input
                          id="address.zipCode"
                          name="address.zipCode"
                          placeholder="10001"
                          value={formData.address.zipCode}
                          onChange={handleChange}
                          className="bg-white/5 border-white/10"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="occupation">Occupation</Label>
                      <Input
                        id="occupation"
                        name="occupation"
                        placeholder="Software Engineer"
                        value={formData.occupation}
                        onChange={handleChange}
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        name="company"
                        placeholder="Tech Corp"
                        value={formData.company}
                        onChange={handleChange}
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="button" 
                    onClick={nextTab} 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Next: Preferences
                  </Button>
                </TabsContent>

                <TabsContent value="preferences" className="space-y-4 mt-6">
                  {formErrors.preferences && (
                    <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{formErrors.preferences}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="preferences.language">Language</Label>
                      <Select 
                        value={formData.preferences.language} 
                        onValueChange={(value) => handleSelectChange('preferences.language', value)}
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
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preferences.theme">Theme</Label>
                      <Select 
                        value={formData.preferences.theme} 
                        onValueChange={(value) => handleSelectChange('preferences.theme', value)}
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
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-gray-300">Notification Preferences</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="email-notifications"
                          checked={formData.preferences.notifications.email}
                          onChange={(e) => handleNotificationChange('email', e.target.checked)}
                          className="rounded bg-white/5"
                        />
                        <Label htmlFor="email-notifications" className="text-sm text-gray-300">Email notifications</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="sms-notifications"
                          checked={formData.preferences.notifications.sms}
                          onChange={(e) => handleNotificationChange('sms', e.target.checked)}
                          className="rounded bg-white/5"
                        />
                        <Label htmlFor="sms-notifications" className="text-sm text-gray-300">SMS notifications</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="push-notifications"
                          checked={formData.preferences.notifications.push}
                          onChange={(e) => handleNotificationChange('push', e.target.checked)}
                          className="rounded bg-white/5"
                        />
                        <Label htmlFor="push-notifications" className="text-sm text-gray-300">Push notifications</Label>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" 
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </TabsContent>
              </Tabs>
            </form>
            
            <div className="text-center text-sm mt-6 text-gray-300">
              Already have an account?{" "}
              <Link href="/auth/signin" className="text-blue-400 hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
