import mongoose from 'mongoose';

// Enhanced User model with comprehensive details
const UserSchema = new mongoose.Schema({
  userId: {
    type: String, 
    required: true,
    unique: true
  },
  email: { 
    type: String, 
    required: true,
    unique: true 
  },
  password: {
    type: String,
    required: false // Optional for OAuth users
  },
  name: { 
    type: String,
    required: true
  },
  firstName: {
    type: String
  },
  lastName: {
    type: String
  },
  image: { 
    type: String 
  },
  phone: {
    type: String
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say']
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  occupation: {
    type: String
  },
  company: {
    type: String
  },
  // Account settings
  preferences: {
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    }
  },
  // Account status and verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  accountStatus: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending'],
    default: 'active'
  },
  // OAuth provider info
  provider: {
    type: String,
    enum: ['credentials', 'google'],
    default: 'credentials'
  },
  providers: [{
    provider: {
      type: String,
      enum: ['google', 'credentials']
    },
    providerId: String,
    connectedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Usage statistics
  stats: {
    totalChats: {
      type: Number,
      default: 0
    },
    totalQueries: {
      type: Number,
      default: 0
    },
    documentsAnalyzed: {
      type: Number,
      default: 0
    },
    lastActiveAt: {
      type: Date,
      default: Date.now
    }
  },
  // Subscription/Plan info
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true
    },
    features: {
      maxChatsPerMonth: {
        type: Number,
        default: 10
      },
      maxDocumentsPerMonth: {
        type: Number,
        default: 5
      },
      advancedAnalytics: {
        type: Boolean,
        default: false
      }
    }
  },
  // Timestamps
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date
  }
});

// Update the updatedAt field before saving
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Update stats when user performs actions
UserSchema.methods.incrementStats = function(field: string) {
  this.stats[field] = (this.stats[field] || 0) + 1;
  this.stats.lastActiveAt = new Date();
  return this.save();
};

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.name;
});

// Virtual for full address
UserSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  const { street, city, state, country, zipCode } = this.address;
  return [street, city, state, country, zipCode].filter(Boolean).join(', ');
});

// Ensure virtual fields are serialized
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

// Chat session model
const ChatSessionSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    default: "New Chat"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Message model
const MessageSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true,
    unique: true
  },
  chatId: {
    type: String,
    required: true,
    index: true
  },
  sender: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Export models with fallback for already compiled models
// Use 'users' as the collection name to match the existing collection in bajaj_hack database
export const User = mongoose.models.User || mongoose.model('User', UserSchema, 'users');
export const ChatSession = mongoose.models.ChatSession || mongoose.model('ChatSession', ChatSessionSchema, 'chat_sessions');
export const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema, 'messages'); 
