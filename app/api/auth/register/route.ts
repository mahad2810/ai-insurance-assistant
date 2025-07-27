import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
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
    
    // Basic validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }
    
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }
    
    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' },
        { status: 400 }
      );
    }
    
    const user = await createUser(userData);
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        fullName: user.fullName
      }
    });
    
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 400 }
    );
  }
}
