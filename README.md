# HuCares - Private Social Network for Life Celebration

**A weekly wellness check-in app for close friends to celebrate life together**

---

## 🌟 **App Overview**

HuCares is a private, intimate social network designed for small groups of friends to regularly check in with each other through structured wellness surveys. The app transforms personal well-being data into a shared celebration of life, fostering connection and mutual support through weekly or bi-weekly "HuCares scores."

### Core Philosophy
- **Celebration over competition**: Focus on celebrating life moments, not competing
- **Privacy-first**: Small, trusted groups only
- **Simplicity**: Minimal friction for maximum engagement
- **Consistency**: Regular check-ins build lasting habits and connections

---

## 🎯 **Core Features**

### 1. **Weekly Check-In Survey**
Users complete a 4-question wellness survey:

- **Q1: Productive** (Scale 1-10) - "How productive did you feel this week?"
- **Q2: Satisfied** (Scale 1-10) - "How satisfied were you with your week?"
- **Q3: Feeling Good in Body** (Scale 1-10) - "How good did you feel physically?"
- **Q4: Hu Cares Level** (Scale 1-10) - "How much did you care about things outside yourself?"

### 2. **HuCares Score Calculation**
**Formula: Q1 + Q2 + Q3 - Q4**

*Rationale: High personal wellness (productive, satisfied, feeling good) balanced by caring about others creates the ideal "HuCares" state*

### 3. **Group Score Visualization**
- Individual scores displayed alongside group scores
- Historical trends and patterns
- Weekly/bi-weekly celebration moments

### 4. **Social Connection**
- See friends' scores immediately after submission
- Group average and trends
- Private, secure friend groups only

---

## 🏗️ **Technical Architecture**

### Frontend Stack
- **React 18+** with TypeScript
- **Vite** for build tooling and development
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Query/TanStack Query** for data fetching
- **Zustand** for state management
- **React Hook Form** for form handling
- **Chart.js/Recharts** for data visualization

### Backend Stack
- **Node.js** with Express.js
- **TypeScript** throughout
- **PostgreSQL** for primary database
- **Prisma** ORM for database operations
- **JWT** for authentication
- **bcrypt** for password hashing
- **Express Rate Limiting** for security

### Infrastructure
- **Frontend**: Vercel/Netlify deployment
- **Backend**: Railway/Render deployment
- **Database**: PostgreSQL (Supabase/Railway)
- **Domain**: Custom domain with SSL
- **CDN**: Built-in with hosting platform

---

## 📊 **Data Models**

### User Model
```typescript
interface User {
  id: string
  username: string (unique, 3-20 chars)
  passwordHash: string (4-digit PIN, bcrypt hashed)
  createdAt: DateTime
  updatedAt: DateTime
  lastLoginAt: DateTime
  isActive: boolean
}
```

### Group Model
```typescript
interface Group {
  id: string
  name: string
  description?: string
  accessCode: string (unique, 6-8 chars)
  createdBy: string (User.id)
  createdAt: DateTime
  updatedAt: DateTime
  isActive: boolean
  maxMembers: number (default: 20)
}
```

### GroupMembership Model
```typescript
interface GroupMembership {
  id: string
  userId: string
  groupId: string
  joinedAt: DateTime
  role: 'member' | 'admin'
  isActive: boolean
}
```

### CheckIn Model
```typescript
interface CheckIn {
  id: string
  userId: string
  groupId: string
  weekStartDate: Date (Monday of check-in week)
  productiveScore: number (1-10)
  satisfiedScore: number (1-10)
  bodyScore: number (1-10)
  careScore: number (1-10)
  huCaresScore: number (calculated: Q1+Q2+Q3-Q4)
  submittedAt: DateTime
  createdAt: DateTime
}
```

### WeeklyGroupSummary Model
```typescript
interface WeeklyGroupSummary {
  id: string
  groupId: string
  weekStartDate: Date
  averageHuCaresScore: number
  totalCheckIns: number
  participationRate: number
  highestScore: number
  lowestScore: number
  createdAt: DateTime
}
```

---

## 🔐 **Security & Privacy**

### Authentication
- Simple username + 4-digit PIN authentication
- JWT tokens with reasonable expiration (7 days)
- PIN requirements: exactly 4 digits (0-9)
- Rate limiting on login attempts

### Privacy Controls
- **Groups are invitation-only** via access codes
- **No public profiles or discovery**
- **Data retention**: 2 years maximum
- **Account deletion**: Complete data removal
- **Group leaving**: Historical data preserved but anonymized

### Data Security
- All 4-digit PINs hashed with bcrypt (12 rounds)
- HTTPS enforced across all endpoints
- Input validation and sanitization
- SQL injection prevention via Prisma ORM
- XSS protection with proper output encoding

---

## 🎨 **User Experience Design**

### Design Principles
- **Mobile-first responsive design**
- **Accessibility compliant** (WCAG 2.1 AA)
- **Fast loading** (<2s initial load)
- **Intuitive navigation**
- **Celebration-focused UI**

### Color Palette
- Primary: Warm, celebratory colors (coral, gold)
- Secondary: Calming blues and greens
- Neutral: Clean grays and whites
- Accent: Bright, joyful highlights

### Typography
- Clean, readable sans-serif
- Hierarchy that guides attention
- Adequate contrast ratios

---

## 🚀 **User Flows**

### 1. **New User Onboarding**
1. User visits hucares.com
2. Enters site password (global access control)
3. Creates account (username + 4-digit PIN)
4. Joins group via access code OR creates new group
5. Completes first check-in
6. Views initial group results

### 2. **Weekly Check-In Flow**
1. User receives notification (if enabled)
2. Opens app and sees check-in prompt
3. Completes 4-question survey
4. Views calculated HuCares score
5. Sees friends' scores and group average
6. Optional: Adds personal note/reflection

### 3. **Group Management Flow**
1. Group admin creates group
2. Shares access code with friends
3. Friends join using access code
4. Group starts weekly check-ins
5. Historical data accumulates and displays

### 4. **Historical Data Review**
1. User navigates to "History" section
2. Views personal trends over time
3. Compares with group trends
4. Filters by date ranges
5. Exports data (optional)

---

## 📱 **Feature Roadmap**

### Phase 1: MVP (Launch)
- [ ] User authentication system
- [ ] Group creation and joining
- [ ] 4-question check-in survey
- [ ] Basic score calculation and display
- [ ] Simple friend score viewing
- [ ] Mobile-responsive design

### Phase 2: Enhanced Experience
- [ ] Historical data visualization (charts)
- [ ] Weekly/bi-weekly check-in scheduling
- [ ] Personal reflection notes
- [ ] Group average trends
- [ ] Basic notifications

### Phase 3: Social Features
- [ ] Celebration badges/achievements
- [ ] Group chat/messaging
- [ ] Custom group themes
- [ ] Photo sharing with check-ins
- [ ] Goal setting and tracking

### Phase 4: Advanced Analytics
- [ ] Detailed trend analysis
- [ ] Correlation insights
- [ ] Export functionality
- [ ] Admin dashboard
- [ ] Group health metrics

### Phase 5: Wellness Integration
- [ ] Integration with fitness apps
- [ ] Mood tracking enhancements
- [ ] Habit tracking
- [ ] Wellness challenges
- [ ] External API integrations

---

## 🏛️ **Database Schema**

### Tables Structure
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- 4-digit PIN, bcrypt hashed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  access_code VARCHAR(10) UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  max_members INTEGER DEFAULT 20
);

-- Group memberships table
CREATE TABLE group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  group_id UUID REFERENCES groups(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  role VARCHAR(20) DEFAULT 'member',
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, group_id)
);

-- Check-ins table
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  group_id UUID REFERENCES groups(id),
  week_start_date DATE NOT NULL,
  productive_score INTEGER CHECK (productive_score >= 1 AND productive_score <= 10),
  satisfied_score INTEGER CHECK (satisfied_score >= 1 AND satisfied_score <= 10),
  body_score INTEGER CHECK (body_score >= 1 AND body_score <= 10),
  care_score INTEGER CHECK (care_score >= 1 AND care_score <= 10),
  hu_cares_score INTEGER GENERATED ALWAYS AS (productive_score + satisfied_score + body_score - care_score) STORED,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, group_id, week_start_date)
);

-- Weekly group summaries table
CREATE TABLE weekly_group_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id),
  week_start_date DATE NOT NULL,
  average_hu_cares_score DECIMAL(4,2),
  total_check_ins INTEGER,
  participation_rate DECIMAL(4,2),
  highest_score INTEGER,
  lowest_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, week_start_date)
);
```

### Indexes
```sql
-- Performance indexes
CREATE INDEX idx_check_ins_user_group ON check_ins(user_id, group_id);
CREATE INDEX idx_check_ins_week ON check_ins(week_start_date);
CREATE INDEX idx_group_memberships_user ON group_memberships(user_id);
CREATE INDEX idx_group_memberships_group ON group_memberships(group_id);
```

---

## 🔌 **API Design**

### Authentication Endpoints
```typescript
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
PUT  /api/auth/change-pin
```

### User Endpoints
```typescript
GET  /api/users/profile
PUT  /api/users/profile
DELETE /api/users/account
```

### Group Endpoints
```typescript
POST /api/groups                 // Create group
GET  /api/groups                 // Get user's groups
GET  /api/groups/:id             // Get specific group
PUT  /api/groups/:id             // Update group (admin only)
POST /api/groups/join            // Join group with access code
DELETE /api/groups/:id/leave     // Leave group
```

### Check-in Endpoints
```typescript
POST /api/checkins               // Submit check-in
GET  /api/checkins               // Get user's check-ins
GET  /api/checkins/group/:id     // Get group check-ins
GET  /api/checkins/current       // Get current week's check-ins
GET  /api/checkins/history       // Get historical data
```

### Analytics Endpoints
```typescript
GET  /api/analytics/personal     // Personal trends
GET  /api/analytics/group/:id    // Group analytics
GET  /api/analytics/comparison   // Personal vs group comparison
```

---

## 🚀 **Deployment Strategy**

### Environment Setup
- **Development**: Local development with hot reload
- **Staging**: Pre-production testing environment
- **Production**: Live application

### CI/CD Pipeline
```yaml
# GitHub Actions workflow
name: Deploy HuCares App
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
```

### Domain & SSL
- **Domain**: hucares.com (to be secured)
- **SSL**: Automatic via hosting platform
- **CDN**: Global content delivery

---

## 🧪 **Testing Strategy**

### Frontend Testing
- **Unit Tests**: React Testing Library + Jest
- **Component Tests**: Storybook for component documentation
- **E2E Tests**: Playwright for user flows
- **Accessibility**: axe-core for a11y testing

### Backend Testing
- **Unit Tests**: Jest for business logic
- **Integration Tests**: Supertest for API endpoints
- **Database Tests**: Test database for data operations
- **Load Testing**: Artillery for performance testing

### Test Coverage Goals
- **Frontend**: 80%+ coverage
- **Backend**: 90%+ coverage
- **Critical paths**: 100% coverage

---

## 📋 **Development Checklist**

### Phase 1: Foundation
- [ ] Set up React + TypeScript project with Vite
- [ ] Configure Tailwind CSS and design system
- [ ] Set up Express.js backend with TypeScript
- [ ] Configure PostgreSQL database and Prisma ORM
- [ ] Implement basic authentication system
- [ ] Create user registration and login flows
- [ ] Set up basic routing and navigation

### Phase 2: Core Features
- [ ] Implement group creation and joining
- [ ] Build 4-question check-in survey component
- [ ] Create score calculation logic
- [ ] Implement check-in submission and storage
- [ ] Build score display and comparison views
- [ ] Add basic historical data viewing

### Phase 3: Polish & Deploy
- [ ] Implement responsive design across all screens
- [ ] Add error handling and loading states
- [ ] Set up monitoring and analytics
- [ ] Configure production deployment
- [ ] Secure custom domain
- [ ] Implement backup and recovery procedures

---

## 🔧 **Configuration Management**

### Environment Variables
```bash
# Frontend (.env)
VITE_API_BASE_URL=http://localhost:3001/api
VITE_APP_NAME=HuCares
VITE_SITE_PASSWORD=your_site_password

# Backend (.env)
DATABASE_URL=postgresql://username:password@localhost:5432/hucares
JWT_SECRET=your_jwt_secret_key
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### Configuration Files
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Styling configuration
- `vite.config.ts` - Build configuration
- `prisma/schema.prisma` - Database schema

---

## 📚 **Documentation Structure**

This master README will be broken down into specialized documentation:

1. **Technical Documentation**
   - `docs/api.md` - Complete API documentation
   - `docs/database.md` - Database schema and operations
   - `docs/deployment.md` - Deployment procedures

2. **Development Documentation**
   - `docs/setup.md` - Local development setup
   - `docs/contributing.md` - Contribution guidelines
   - `docs/testing.md` - Testing procedures

3. **User Documentation**
   - `docs/user-guide.md` - End user instructions
   - `docs/admin-guide.md` - Group admin instructions
   - `docs/troubleshooting.md` - Common issues and solutions

4. **Architecture Documentation**
   - `docs/architecture.md` - System architecture overview
   - `docs/security.md` - Security considerations
   - `docs/scalability.md` - Future scaling plans

---

## 🤝 **Contributing**

### Development Workflow
1. Follow the **Checklist-Driven Development** approach
2. One feature per pull request
3. Comprehensive testing for all changes
4. Documentation updates with code changes

### Code Standards
- Follow existing **Development Best Practices**
- TypeScript strict mode enabled
- ESLint and Prettier for code formatting
- Conventional commits for git messages

---

## 📄 **License**

Private project - All rights reserved.

---

## 🌟 **Vision Statement**

HuCares exists to strengthen friendships through regular, meaningful check-ins that celebrate life's ups and downs. By transforming personal wellness into shared experiences, we create deeper connections and mutual support networks that enhance everyone's well-being.

**The ultimate goal**: A simple, joyful way for friends to stay connected and celebrate life together, one check-in at a time.

---

*Last updated: December 2024*
*Version: 1.0.0-alpha* 