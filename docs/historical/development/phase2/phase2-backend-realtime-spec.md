# PHASE 2: Backend & Real-Time Infrastructure - Technical Specification

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

### **Performance Testing**

```typescript
// Load Testing with Artillery
// artillery.yml
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100

scenarios:
  - name: 'User Registration and Check-in Flow'
    weight: 70
    flow:
      - post:
          url: '/api/v1/auth/register'
          json:
            username: 'user{{ $randomString() }}'
            email: '{{ $randomString() }}@example.com'
            password: 'TestPass123!'
          capture:
            - json: '$.data.accessToken'
              as: 'token'
      - post:
          url: '/api/v1/checkins'
          headers:
            Authorization: 'Bearer {{ token }}'
          json:
            groupId: '{{ $randomUUID() }}'
            productive: '{{ $randomInt(1, 10) }}'
            satisfied: '{{ $randomInt(1, 10) }}'
            body: '{{ $randomInt(1, 10) }}'
            care: '{{ $randomInt(1, 10) }}'
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
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

### **CI/CD Pipeline**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: hucares_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/hucares_test
      
      - name: Run E2E tests
        run: npm run test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Railway
        uses: railway/cli@v2
        with:
          command: deploy
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 📊 **MONITORING & OBSERVABILITY**

### **Logging Strategy**

```typescript
// Winston Logger Configuration
import winston from 'winston'

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'hucares-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
})

// Structured Logging Examples
logger.info('User registered', {
  userId: user.id,
  username: user.username,
  email: user.email,
  timestamp: new Date().toISOString()
})

logger.warn('Failed login attempt', {
  email: req.body.email,
  ip: req.ip,
  userAgent: req.get('User-Agent'),
  attempts: failedAttempts
})

logger.error('Database connection failed', {
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString()
})
```

### **Metrics Collection**

```typescript
// Prometheus Metrics
import prometheus from 'prom-client'

// Custom metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
})

const checkInsTotal = new prometheus.Counter({
  name: 'checkins_total',
  help: 'Total number of check-ins submitted',
  labelNames: ['group_id']
})

const activeUsers = new prometheus.Gauge({
  name: 'active_users',
  help: 'Number of currently active users'
})

// Middleware for metrics collection
app.use((req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode.toString())
      .observe(duration)
  })
  
  next()
})
```

---

## 🔒 **SECURITY SPECIFICATIONS**

### **Security Headers**

```typescript
// Helmet.js Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}))
```

### **Rate Limiting**

```typescript
// Rate Limiting Configuration
import rateLimit from 'express-rate-limit'

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
})

// Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  skipSuccessfulRequests: true
})

app.use('/api/', apiLimiter)
app.use('/api/v1/auth/', authLimiter)
```

### **Input Validation**

```typescript
// Joi Validation Schemas
import Joi from 'joi'

const userRegistrationSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(20)
    .required()
    .pattern(/^[a-zA-Z0-9_]+$/)
    .messages({
      'string.pattern.base': 'Username can only contain letters, numbers, and underscores'
    }),
    
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .max(255),
    
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    })
})

// Middleware for validation
const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    })
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        }
      })
    }
    
    req.body = value
    next()
  }
}
```

---

## 📈 **PERFORMANCE REQUIREMENTS**

### **Response Time Targets**

```typescript
// Performance SLAs
const PERFORMANCE_TARGETS = {
  // API Response Times (95th percentile)
  authentication: 200, // ms
  userProfile: 150,    // ms
  checkInSubmission: 300, // ms
  groupData: 250,      // ms
  analytics: 500,      // ms
  
  // Database Query Limits
  simpleQuery: 50,     // ms
  complexQuery: 200,   // ms
  analyticsQuery: 1000, // ms
  
  // Real-time Latency
  socketConnection: 100, // ms
  eventPropagation: 50,  // ms
  
  // Throughput Requirements
  concurrentUsers: 1000,
  requestsPerSecond: 500,
  
  // Availability
  uptime: 99.9 // %
}
```

### **Caching Strategy**

```typescript
// Redis Caching Implementation
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

class CacheService {
  // Cache user profile for 5 minutes
  async cacheUserProfile(userId: string, profile: UserProfile) {
    await redis.setex(`user:${userId}`, 300, JSON.stringify(profile))
  }
  
  // Cache group data for 10 minutes
  async cacheGroupData(groupId: string, groupData: GroupData) {
    await redis.setex(`group:${groupId}`, 600, JSON.stringify(groupData))
  }
  
  // Cache weekly check-ins for 1 hour
  async cacheWeeklyCheckIns(groupId: string, weekStart: string, checkIns: CheckInData[]) {
    await redis.setex(
      `checkins:${groupId}:${weekStart}`, 
      3600, 
      JSON.stringify(checkIns)
    )
  }
  
  // Invalidate cache patterns
  async invalidateUserCache(userId: string) {
    const keys = await redis.keys(`user:${userId}*`)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }
}
```

---

## 🎯 **SUCCESS CRITERIA**

### **Technical Metrics**

- [ ] **API Response Times**: 95% of requests under target times
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

## 🚨 **RISK ASSESSMENT**

### **High Risk**

1. **Data Migration Complexity**
   - Risk: Users lose data during localStorage -> backend migration
   - Mitigation: Comprehensive migration tool with rollback capability

2. **Performance Degradation**
   - Risk: Backend slower than localStorage
   - Mitigation: Aggressive caching, performance testing, CDN

3. **Authentication Security**
   - Risk: JWT token compromise
   - Mitigation: Short-lived tokens, refresh rotation, rate limiting

### **Medium Risk**

1. **Real-time Complexity**
   - Risk: Socket.io connection issues
   - Mitigation: Connection recovery, fallback to polling

2. **Database Scaling**
   - Risk: PostgreSQL performance under load
   - Mitigation: Connection pooling, read replicas, monitoring

3. **Third-party Dependencies**
   - Risk: Service provider outages
   - Mitigation: Multi-provider strategy, monitoring, alerts

### **Low Risk**

1. **API Versioning**
   - Risk: Breaking changes affect clients
   - Mitigation: Semantic versioning, deprecation notices

2. **Deployment Complexity**
   - Risk: Production deployment issues
   - Mitigation: Staging environment, automated testing, rollback procedures

---

## 📅 **TIMELINE ESTIMATE**

**Total Duration**: 12 weeks
**Team Size**: 2-3 developers
**Effort**: ~400-500 developer hours

### **Critical Path**
1. Database Schema & API Design (2 weeks)
2. Authentication System (2 weeks)
3. Core API Development (3 weeks)
4. Real-time Implementation (2 weeks)
5. Frontend Integration (2 weeks)
6. Testing & Deployment (1 week)

### **Dependencies**
- Frontend team coordination for API integration
- DevOps support for deployment infrastructure
- Database administrator for production setup
- Security review for authentication system

---

**This completes the comprehensive Phase 2 specification. Ready to build the backend cathedral! 🏗️** 