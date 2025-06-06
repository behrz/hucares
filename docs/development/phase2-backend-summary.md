# Phase 2: Backend & Real-Time - Implementation Guide

## 🎯 **OBJECTIVE**
Transform HuCares from localStorage to real backend with authentication and real-time sync.

## 🏗️ **TECH STACK**
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM  
- **Auth**: JWT tokens + refresh rotation
- **Real-time**: Socket.io
- **Deployment**: Railway/Render

## 📊 **DATABASE SCHEMA**

```sql
-- Core tables to implement
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- 4-digit PIN, bcrypt hashed
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE groups (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  access_code VARCHAR(10) UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id)
);

CREATE TABLE check_ins (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  group_id UUID REFERENCES groups(id),
  week_start_date DATE NOT NULL,
  productive_score INTEGER CHECK (productive_score >= 1 AND productive_score <= 10),
  satisfied_score INTEGER CHECK (satisfied_score >= 1 AND satisfied_score <= 10),
  body_score INTEGER CHECK (body_score >= 1 AND body_score <= 10),
  care_score INTEGER CHECK (care_score >= 1 AND care_score <= 10),
  hu_cares_score INTEGER GENERATED ALWAYS AS (productive_score + satisfied_score + body_score - care_score) STORED,
  UNIQUE(user_id, group_id, week_start_date)
);
```

## 🔐 **AUTH ENDPOINTS**

```typescript
POST /api/v1/auth/register  // Create account (username + PIN)
POST /api/v1/auth/login     // Login with username + PIN
POST /api/v1/auth/refresh   // Refresh JWT token
POST /api/v1/auth/logout    // Logout
```

## 📡 **CORE API ENDPOINTS**

```typescript
// Users
GET    /api/v1/users/profile
PUT    /api/v1/users/profile

// Groups  
POST   /api/v1/groups        // Create group
GET    /api/v1/groups        // Get user's groups
POST   /api/v1/groups/join   // Join with access code

// Check-ins
POST   /api/v1/checkins      // Submit check-in
GET    /api/v1/checkins      // Get user's check-ins
GET    /api/v1/checkins/group/:id // Get group check-ins
```

## 🔄 **REAL-TIME FEATURES**

```typescript
// Socket.io events to implement
socket.on('join-group', (groupId) => {})
socket.emit('friend-checked-in', {
  userId, username, groupId, huCaresScore, timestamp
})
socket.emit('group-updated', { groupId, type, data })
```

## 🛠️ **IMPLEMENTATION PHASES**

### Week 1-2: Foundation
- [ ] Express + TypeScript setup
- [ ] PostgreSQL + Prisma
- [ ] Basic middleware
- [ ] Health check endpoint

### Week 3-4: Authentication  
- [x] User registration/login (PIN-based)
- [x] JWT token system
- [x] PIN validation and hashing
- [x] Rate limiting

### Week 5-7: Core API
- [ ] User profile CRUD
- [ ] Group management
- [ ] Check-in system
- [ ] Data validation

### Week 8-9: Real-time
- [ ] Socket.io setup
- [ ] Live notifications
- [ ] Online status
- [ ] Connection management

### Week 10-11: Frontend Integration
- [ ] API client
- [ ] Auth state management
- [ ] Real-time events
- [ ] Migration from localStorage

### Week 12: Deploy
- [ ] Production setup
- [ ] Testing
- [ ] Monitoring
- [ ] Launch

## ✅ **SUCCESS CRITERIA**
- [ ] All localStorage features work with backend
- [ ] Real-time friend notifications
- [ ] Multi-device sync
- [ ] 99.9% uptime
- [ ] <200ms API response times

**Duration**: 12 weeks | **Team**: 2-3 developers | **Effort**: ~450 hours 