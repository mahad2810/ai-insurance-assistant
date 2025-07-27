import bcrypt from 'bcryptjs';
import dbConnect from './mongodb';
import { User } from './models';
import { v4 as uuidv4 } from 'uuid';

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export async function createUser(userData: any) {
  await dbConnect();
  
  const { 
    email, 
    password, 
    name,
    firstName,
    lastName,
    phone,
    dateOfBirth,
    gender,
    address,
    occupation,
    company,
    preferences 
  } = userData;
  
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('User already exists');
  }
  
  // Hash password
  const hashedPassword = await hashPassword(password);
  
  // Create user with comprehensive data
  const user = await User.create({
    userId: uuidv4(),
    email,
    password: hashedPassword,
    name,
    firstName: firstName || name.split(' ')[0],
    lastName: lastName || name.split(' ').slice(1).join(' '),
    phone,
    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    gender,
    address,
    occupation,
    company,
    preferences: {
      ...preferences,
      language: preferences?.language || 'en',
      timezone: preferences?.timezone || 'UTC',
      theme: preferences?.theme || 'system',
      notifications: {
        email: preferences?.notifications?.email ?? true,
        sms: preferences?.notifications?.sms ?? false,
        push: preferences?.notifications?.push ?? true
      }
    },
    providers: [{
      provider: 'credentials',
      providerId: email,
      connectedAt: new Date()
    }],
    isEmailVerified: false,
    accountStatus: 'active',
    lastLoginAt: new Date()
  });
  
  return {
    id: user.userId,
    email: user.email,
    name: user.name,
    fullName: user.fullName,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    image: user.image
  };
}

export async function authenticateUser(email: string, password: string) {
  await dbConnect();
  
  const user = await User.findOne({ email });
  if (!user || !user.password) {
    return null;
  }
  
  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return null;
  }
  
  // Update last login time and stats
  user.lastLoginAt = new Date();
  user.stats.lastActiveAt = new Date();
  await user.save();
  
  return {
    id: user.userId,
    email: user.email,
    name: user.name,
    fullName: user.fullName,
    firstName: user.firstName,
    lastName: user.lastName,
    image: user.image,
    phone: user.phone,
    preferences: user.preferences,
    stats: user.stats,
    subscription: user.subscription
  };
}

export async function updateUserStats(userId: string, field: string) {
  await dbConnect();
  
  const user = await User.findOne({ userId });
  if (user) {
    await user.incrementStats(field);
  }
}
