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
    
    // Email validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // Name validation
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    // Password validation
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
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
    
    try {
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
      // Handle specific errors from createUser
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 } // 409 Conflict for resource conflicts
        );
      }
      
      throw error; // Re-throw other errors
    }
    
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
