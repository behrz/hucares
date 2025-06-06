# PHASE 2: Backend & Real-Time Infrastructure - Technical Specification

> ⚠️ **DEPRECATION NOTICE**: This document is **HISTORICAL** and contains outdated information.
> 
> **Current System**: HuCares now uses username + 4-digit PIN authentication (no email required).
> 
> **For Current Info See**:
> - 📋 [PIN Authentication Migration Guide](../PIN-AUTHENTICATION-MIGRATION.md)
> - 📊 [Phase 2 Backend Summary](./phase2-backend-summary.md) (updated)
> - 📚 [Main README](../../README.md) (current architecture)
> 
> This file is preserved for historical reference only.

---

## 🎯 **PHASE OVERVIEW**

**Objective**: Transform HuCares from localStorage-only to a real backend with authentication, real-time sync, and cloud data persistence.

**Current State**: Pure client-side with localStorage
**Target State**: Full-stack application with real backend, authentication, and real-time capabilities

---

## 🏗️ **TECHNICAL ARCHITECTURE**

### **Backend Technology Stack**

```typescript
// Primary Stack
- Runtime: Node.js 20+
- Framework: Express.js + TypeScript
- Database: PostgreSQL (primary) + Redis (sessions/cache)
- ORM: Prisma ORM
- Authentication: JWT + Refresh Tokens
- Real-time: Socket.io
- File Storage: AWS S3 / Cloudinary
- Deployment: Railway/Render/Vercel Functions
```

### **Database Schema Design**

```sql
-- Users table (enhanced from localStorage version)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  timezone VARCHAR(50) DEFAULT 'UTC',
  
  -- Preferences
  notification_preferences JSONB DEFAULT '{}',
  privacy_settings JSONB DEFAULT '{"profile": "friends", "scores": "group"}',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  last_active_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Verification
  email_verification_token VARCHAR(255),
  email_verification_expires TIMESTAMP WITH TIME ZONE,
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP WITH TIME ZONE
);

-- Enhanced Groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  access_code VARCHAR(10) UNIQUE NOT NULL,
  
  -- Settings
  is_private BOOLEAN DEFAULT TRUE,
  max_members INTEGER DEFAULT 20,
  allow_member_invite BOOLEAN DEFAULT TRUE,
  check_in_frequency VARCHAR(20) DEFAULT 'weekly', -- 'daily', 'weekly', 'biweekly'
  timezone VARCHAR(50) DEFAULT 'UTC',
  
  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Stats (computed)
  member_count INTEGER DEFAULT 0,
  total_check_ins INTEGER DEFAULT 0,
  average_participation_rate DECIMAL(4,2) DEFAULT 0.0
);

-- Group memberships with roles
CREATE TABLE group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  
  -- Role and permissions
  role VARCHAR(20) DEFAULT 'member', -- 'admin', 'moderator', 'member'
  permissions JSONB DEFAULT '{"can_invite": false, "can_kick": false}',
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'banned'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE,
  
  -- Preferences
  notification_enabled BOOLEAN DEFAULT TRUE,
  
  UNIQUE(user_id, group_id)
);

-- Enhanced Check-ins table
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  
  -- Temporal data
  week_start_date DATE NOT NULL,
  check_in_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Core scores (1-10)
  productive_score INTEGER CHECK (productive_score >= 1 AND productive_score <= 10),
  satisfied_score INTEGER CHECK (satisfied_score >= 1 AND satisfied_score <= 10),
  body_score INTEGER CHECK (body_score >= 1 AND body_score <= 10),
  care_score INTEGER CHECK (care_score >= 1 AND care_score <= 10),
  
  -- Computed score
  hu_cares_score INTEGER GENERATED ALWAYS AS (
    productive_score + satisfied_score + body_score - care_score
  ) STORED,
  
  -- Optional fields
  reflection_note TEXT,
  mood_emoji VARCHAR(10),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
  
  -- Metadata
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_private BOOLEAN DEFAULT FALSE,
  
  UNIQUE(user_id, group_id, week_start_date)
);

-- Real-time sessions for Socket.io
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  socket_id VARCHAR(255) NOT NULL,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Content
  type VARCHAR(50) NOT NULL, -- 'friend_check_in', 'group_invitation', 'weekly_reminder'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}', -- Additional payload
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  is_sent BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);
```

---

## 🔐 **AUTHENTICATION SYSTEM**

### **JWT Token Strategy**

```typescript
// Token Structure
interface JWTPayload {
  userId: string
  username: string
  email: string
  role: 'user' | 'admin'
  iat: number
  exp: number
}

// Token Configuration
const TOKEN_CONFIG = {
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET,
    expiresIn: '15m'
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d'
  }
}
```

### **Authentication Endpoints**

```typescript
// Auth API Specification
POST /api/v1/auth/register
Body: {
  username: string (3-20 chars, alphanumeric + underscore)
  email: string (valid email format)
  password: string (min 8 chars, 1 upper, 1 lower, 1 number)
}
Response: {
  user: UserProfile
  accessToken: string
  refreshToken: string
}

POST /api/v1/auth/login
Body: {
  email: string
  password: string
}
Response: {
  user: UserProfile
  accessToken: string
  refreshToken: string
}

POST /api/v1/auth/refresh
Body: {
  refreshToken: string
}
Response: {
  accessToken: string
  refreshToken: string
}

POST /api/v1/auth/logout
Headers: { Authorization: "Bearer <token>" }
Response: { message: "Logged out successfully" }

POST /api/v1/auth/forgot-password
Body: { email: string }
Response: { message: "Reset link sent" }

POST /api/v1/auth/reset-password
Body: {
  token: string
  newPassword: string
}
Response: { message: "Password reset successful" }

POST /api/v1/auth/verify-email
Body: { token: string }
Response: { message: "Email verified" }
```

---

## 🔄 **REAL-TIME SYSTEM**

### **Socket.io Events**

```typescript
// Client -> Server Events
interface ClientToServerEvents {
  'join-group': (groupId: string) => void
  'leave-group': (groupId: string) => void
  'user-typing': (groupId: string, isTyping: boolean) => void
  'heartbeat': () => void
}

// Server -> Client Events
interface ServerToClientEvents {
  'friend-checked-in': (data: {
    userId: string
    username: string
    groupId: string
    huCaresScore: number
    timestamp: string
  }) => void
  
  'group-updated': (data: {
    groupId: string
    type: 'member-joined' | 'member-left' | 'settings-changed'
    data: any
  }) => void
  
  'notification': (data: {
    type: string
    title: string
    message: string
    data?: any
  }) => void
  
  'user-online': (userId: string) => void
  'user-offline': (userId: string) => void
}
```

### **Real-time Features**

```typescript
// Real-time Sync Manager
class RealtimeManager {
  // Live check-in notifications
  async notifyGroupOfCheckIn(checkIn: CheckInData) {
    const groupMembers = await getGroupMembers(checkIn.groupId)
    
    groupMembers.forEach(member => {
      if (member.id !== checkIn.userId) {
        this.io.to(member.socketId).emit('friend-checked-in', {
          userId: checkIn.userId,
          username: checkIn.username,
          groupId: checkIn.groupId,
          huCaresScore: checkIn.huCaresScore,
          timestamp: checkIn.submittedAt
        })
      }
    })
  }
  
  // Live group updates
  async broadcastGroupUpdate(groupId: string, updateType: string, data: any) {
    this.io.to(`group-${groupId}`).emit('group-updated', {
      groupId,
      type: updateType,
      data
    })
  }
  
  // Online status tracking
  async updateUserOnlineStatus(userId: string, isOnline: boolean) {
    const userGroups = await getUserGroups(userId)
    
    userGroups.forEach(group => {
      this.io.to(`group-${group.id}`).emit(
        isOnline ? 'user-online' : 'user-offline', 
        userId
      )
    })
  }
}
```

---

## 📡 **API DESIGN**

### **Core API Endpoints**

```typescript
// Users API
GET    /api/v1/users/profile          // Get current user profile
PUT    /api/v1/users/profile          // Update user profile
DELETE /api/v1/users/account          // Delete user account
POST   /api/v1/users/avatar           // Upload profile picture
GET    /api/v1/users/search?q=string  // Search users by username

// Groups API
POST   /api/v1/groups                 // Create new group
GET    /api/v1/groups                 // Get user's groups
GET    /api/v1/groups/:id             // Get specific group details
PUT    /api/v1/groups/:id             // Update group (admin only)
DELETE /api/v1/groups/:id             // Delete group (admin only)
POST   /api/v1/groups/join            // Join group with access code
POST   /api/v1/groups/:id/leave       // Leave group
GET    /api/v1/groups/:id/members     // Get group members
POST   /api/v1/groups/:id/invite      // Invite user to group
DELETE /api/v1/groups/:id/members/:userId // Remove member (admin)

// Check-ins API
POST   /api/v1/checkins               // Submit new check-in
GET    /api/v1/checkins               // Get user's check-ins
GET    /api/v1/checkins/current       // Get current week's check-in
PUT    /api/v1/checkins/:id           // Update check-in (same week only)
DELETE /api/v1/checkins/:id           // Delete check-in
GET    /api/v1/checkins/group/:id     // Get group's check-ins
GET    /api/v1/checkins/history       // Get historical data with pagination

// Analytics API
GET    /api/v1/analytics/personal     // Personal wellness trends
GET    /api/v1/analytics/group/:id    // Group analytics
GET    /api/v1/analytics/comparison   // Personal vs group comparison
GET    /api/v1/analytics/insights     // AI-generated insights

// Notifications API
GET    /api/v1/notifications          // Get user notifications
PUT    /api/v1/notifications/:id/read // Mark notification as read
POST   /api/v1/notifications/read-all // Mark all as read
DELETE /api/v1/notifications/:id      // Delete notification
```

### **API Response Standards**

```typescript
// Success Response Format
interface APIResponse<T> {
  success: true
  data: T
  message?: string
  meta?: {
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
    timestamp: string
    version: string
  }
}

// Error Response Format
interface APIError {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
  meta: {
    timestamp: string
    requestId: string
  }
}

// HTTP Status Codes
200 - OK (successful GET, PUT)
201 - Created (successful POST)
204 - No Content (successful DELETE)
400 - Bad Request (validation error)
401 - Unauthorized (authentication required)
403 - Forbidden (insufficient permissions)
404 - Not Found (resource doesn't exist)
409 - Conflict (duplicate resource)
422 - Unprocessable Entity (validation failed)
429 - Too Many Requests (rate limited)
500 - Internal Server Error
```

---

## 🛠️ **IMPLEMENTATION ROADMAP**

### **Phase 2.1: Foundation Setup** (Week 1-2)

```bash
# Project Structure
backend/
├── src/
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Auth, validation, error handling
│   ├── models/          # Prisma models
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   ├── types/           # TypeScript definitions
│   ├── config/          # Configuration
│   └── app.ts           # Express app setup
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Database migrations
├── tests/
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   └── e2e/             # End-to-end tests
├── docker-compose.yml   # Local development
├── Dockerfile           # Production build
└── package.json
```

**Deliverables:**
- [ ] Express.js + TypeScript setup
- [ ] PostgreSQL + Prisma configuration
- [ ] Basic middleware (CORS, body parsing, logging)
- [ ] Environment configuration
- [ ] Docker development environment
- [ ] Basic health check endpoint

### **Phase 2.2: Authentication System** (Week 3-4)

**Deliverables:**
- [ ] User registration with email verification
- [ ] Login/logout with JWT tokens
- [ ] Password reset functionality
- [ ] Refresh token rotation
- [ ] Rate limiting for auth endpoints
- [ ] Input validation and sanitization
- [ ] Password strength requirements
- [ ] Session management

### **Phase 2.3: Core API Development** (Week 5-7)

**Deliverables:**
- [ ] User profile CRUD operations
- [ ] Group management (create, join, leave)
- [ ] Check-in submission and retrieval
- [ ] Data migration tools (localStorage -> backend)
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Error handling and logging
- [ ] Input validation for all endpoints

### **Phase 2.4: Real-time Implementation** (Week 8-9)

**Deliverables:**
- [ ] Socket.io server setup
- [ ] Real-time check-in notifications
- [ ] Online status tracking
- [ ] Group activity broadcasts
- [ ] Connection management and cleanup
- [ ] Real-time testing suite

### **Phase 2.5: Frontend Integration** (Week 10-11)

**Deliverables:**
- [ ] API client service
- [ ] Authentication state management
- [ ] Real-time event handling
- [ ] Data synchronization logic
- [ ] Error boundary and retry logic
- [ ] Loading states and offline handling
- [ ] Migration from localStorage

### **Phase 2.6: Testing & Deployment** (Week 12)

**Deliverables:**
- [ ] Comprehensive test suite (unit, integration, e2e)
- [ ] Performance testing and optimization
- [ ] Security audit and penetration testing
- [ ] Production deployment pipeline
- [ ] Monitoring and alerting setup
- [ ] Database backup and recovery procedures

---

## 🧪 **TESTING STRATEGY**

### **Unit Testing**

```typescript
// Example: Authentication Service Tests
describe('AuthService', () => {
  describe('registerUser', () => {
    it('should create user with valid data', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'SecurePass123!'
      }
      
      const result = await authService.registerUser(userData)
      
      expect(result.success).toBe(true)
      expect(result.user.email).toBe(userData.email)
      expect(result.user.password).toBeUndefined() // No password in response
    })
    
    it('should reject duplicate email', async () => {
      // Create user first
      await authService.registerUser({
        username: 'user1',
        email: 'duplicate@example.com',
        password: 'SecurePass123!'
      })
      
      // Try to create another user with same email
      const result = await authService.registerUser({
        username: 'user2',
        email: 'duplicate@example.com',
        password: 'AnotherPass123!'
      })
      
      expect(result.success).toBe(false)
      expect(result.error.code).toBe('EMAIL_ALREADY_EXISTS')
    })
  })
})
```

### **Integration Testing**

```typescript
// Example: Check-in API Integration Tests
describe('POST /api/v1/checkins', () => {
  let authToken: string
  let userId: string
  let groupId: string
  
  beforeEach(async () => {
    // Setup test user and group
    const { user, token } = await createTestUser()
    authToken = token
    userId = user.id
    
    const group = await createTestGroup(userId)
    groupId = group.id
  })
  
  it('should create check-in with valid data', async () => {
    const checkInData = {
      groupId,
      productive: 8,
      satisfied: 7,
      body: 6,
      care: 9
    }
    
    const response = await request(app)
      .post('/api/v1/checkins')
      .set('Authorization', `Bearer ${authToken}`)
      .send(checkInData)
      .expect(201)
    
    expect(response.body.success).toBe(true)
    expect(response.body.data.huCaresScore).toBe(12) // 8+7+6-9
  })
  
  it('should prevent duplicate check-ins for same week', async () => {
    // Create first check-in
    await request(app)
      .post('/api/v1/checkins')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ groupId, productive: 5, satisfied: 5, body: 5, care: 5 })
      .expect(201)
    
    // Try to create second check-in same week
    const response = await request(app)
      .post('/api/v1/checkins')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ groupId, productive: 8, satisfied: 8, body: 8, care: 8 })
      .expect(409)
    
    expect(response.body.error.code).toBe('DUPLICATE_CHECKIN')
  })
})
```

---

## 🚀 **DEPLOYMENT SPECIFICATION**

### **Production Environment**

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=hucares
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    
  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  postgres_data:
```

---

## 📊 **SUCCESS CRITERIA**

### **Technical Metrics**

- [ ] **API Response Times**: 95% of requests under 200ms
- [ ] **Database Performance**: All queries under 200ms average
- [ ] **Real-time Latency**: Events propagated within 50ms
- [ ] **Uptime**: 99.9% availability
- [ ] **Test Coverage**: 90%+ code coverage
- [ ] **Security**: Zero critical vulnerabilities
- [ ] **Load Testing**: Handle 1000 concurrent users

### **Functional Requirements**

- [ ] **User Registration**: Email verification working
- [ ] **Authentication**: JWT tokens with refresh rotation
- [ ] **Data Persistence**: All data stored in PostgreSQL
- [ ] **Real-time Updates**: Live check-in notifications
- [ ] **API Documentation**: Complete OpenAPI specification
- [ ] **Migration Tool**: localStorage to backend migration
- [ ] **Error Handling**: Comprehensive error responses

### **User Experience**

- [ ] **Seamless Migration**: Users can migrate from localStorage
- [ ] **Multi-device Sync**: Access from any device
- [ ] **Offline Capability**: Graceful offline mode
- [ ] **Real-time Feedback**: Instant friend activity updates
- [ ] **Performance**: No noticeable slowdown from localStorage version

---

**Total Duration**: 12 weeks | **Team Size**: 2-3 developers | **Effort**: ~400-500 hours

**This completes the comprehensive Phase 2 specification. Ready to build the backend cathedral! 🏗️** 