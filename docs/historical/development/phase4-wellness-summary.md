# Phase 4: Advanced Wellness Features - Implementation Guide

## 🎯 **OBJECTIVE**
Expand beyond 4-question check-ins to comprehensive wellness tracking with customizable surveys, habits, goals, and detailed analytics.

## 🏗️ **NEW FEATURES**
- Custom check-in questions
- Daily habit tracking
- SMART goal setting
- Mood & energy tracking
- Sleep quality monitoring
- Wellness plans & programs

## 📊 **DATABASE ADDITIONS**

```sql
-- Custom check-in templates
CREATE TABLE check_in_templates (
  id UUID PRIMARY KEY,
  group_id UUID REFERENCES groups(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  questions JSONB NOT NULL, -- Array of question objects
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id)
);

-- Habit tracking
CREATE TABLE habits (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- 'exercise', 'nutrition', 'mindfulness', 'sleep'
  target_frequency VARCHAR(20), -- 'daily', 'weekly', 'custom'
  target_value INTEGER, -- days per week, minutes per day, etc.
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE habit_logs (
  id UUID PRIMARY KEY,
  habit_id UUID REFERENCES habits(id),
  user_id UUID REFERENCES users(id),
  log_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  value INTEGER, -- actual value (minutes, reps, etc.)
  notes TEXT,
  UNIQUE(habit_id, log_date)
);

-- Goal setting
CREATE TABLE wellness_goals (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  target_value DECIMAL(10,2),
  current_value DECIMAL(10,2) DEFAULT 0,
  unit VARCHAR(20), -- 'days', 'points', 'minutes', etc.
  target_date DATE,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'paused'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Daily mood & energy tracking
CREATE TABLE daily_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  log_date DATE NOT NULL,
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5),
  energy_score INTEGER CHECK (energy_score >= 1 AND energy_score <= 5),
  stress_score INTEGER CHECK (stress_score >= 1 AND stress_score <= 5),
  sleep_hours DECIMAL(3,1),
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
  notes TEXT,
  UNIQUE(user_id, log_date)
);

-- Wellness plans/programs
CREATE TABLE wellness_plans (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  duration_weeks INTEGER,
  plan_data JSONB, -- Structured plan content
  is_public BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id)
);

CREATE TABLE user_plan_progress (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  plan_id UUID REFERENCES wellness_plans(id),
  started_at TIMESTAMP DEFAULT NOW(),
  current_week INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'active',
  progress_data JSONB DEFAULT '{}'
);
```

## 📡 **NEW API ENDPOINTS**

```typescript
// Custom Check-ins
GET    /api/v1/groups/:id/templates      // Get group templates
POST   /api/v1/templates                 // Create custom template
PUT    /api/v1/templates/:id             // Update template
POST   /api/v1/checkins/custom           // Submit custom check-in

// Habit Tracking
GET    /api/v1/habits                    // Get user habits
POST   /api/v1/habits                    // Create new habit
PUT    /api/v1/habits/:id                // Update habit
POST   /api/v1/habits/:id/log            // Log habit completion
GET    /api/v1/habits/:id/streak         // Get habit streak

// Goal Management
GET    /api/v1/goals                     // Get user goals
POST   /api/v1/goals                     // Create new goal
PUT    /api/v1/goals/:id                 // Update goal
POST   /api/v1/goals/:id/progress        // Update goal progress
GET    /api/v1/goals/insights            // Get goal analytics

// Daily Logging
POST   /api/v1/daily-log                 // Submit daily log
GET    /api/v1/daily-log                 // Get daily logs
GET    /api/v1/daily-log/trends          // Get mood/energy trends

// Wellness Plans
GET    /api/v1/plans                     // Browse available plans
POST   /api/v1/plans/:id/join            // Join a wellness plan
GET    /api/v1/plans/progress            // Get user's plan progress
POST   /api/v1/plans/progress            // Update plan progress
```

## 🎨 **FRONTEND COMPONENTS**

### Custom Check-in Builder
```typescript
interface CustomQuestion {
  id: string
  type: 'scale' | 'text' | 'choice' | 'boolean'
  question: string
  options?: string[] // for choice type
  required: boolean
}

// Template Builder Component
const CheckInTemplateBuilder = () => {
  const [questions, setQuestions] = useState<CustomQuestion[]>([])
  
  const addQuestion = (type: string) => {
    // Add new question to template
  }
  
  const saveTemplate = () => {
    // Save custom template
  }
}
```

### Habit Tracker Dashboard
```typescript
const HabitTracker = () => {
  const [habits, setHabits] = useState([])
  const [todayLogs, setTodayLogs] = useState({})
  
  return (
    <div className="habit-tracker">
      <h2>Today's Habits</h2>
      {habits.map(habit => (
        <HabitCard 
          key={habit.id}
          habit={habit}
          isCompleted={todayLogs[habit.id]?.completed}
          onToggle={toggleHabit}
        />
      ))}
      
      <button onClick={() => setShowAddHabit(true)}>
        + Add New Habit
      </button>
    </div>
  )
}
```

### Goal Progress Tracker
```typescript
const GoalTracker = () => {
  const [goals, setGoals] = useState([])
  
  return (
    <div className="goal-tracker">
      {goals.map(goal => (
        <div key={goal.id} className="goal-card">
          <h3>{goal.title}</h3>
          <ProgressBar 
            current={goal.currentValue}
            target={goal.targetValue}
            unit={goal.unit}
          />
          <p>{goal.description}</p>
          <button onClick={() => updateProgress(goal.id)}>
            Update Progress
          </button>
        </div>
      ))}
    </div>
  )
}
```

## 🧠 **SMART FEATURES**

### Habit Recommendation Engine
```typescript
class HabitRecommendationEngine {
  recommendHabits(userProfile, currentHabits, checkInHistory) {
    const recommendations = []
    
    // Analyze weak areas from check-ins
    const avgScores = this.analyzeCheckInTrends(checkInHistory)
    
    if (avgScores.body < 6) {
      recommendations.push({
        category: 'exercise',
        habit: 'Daily 10-minute walk',
        reason: 'Your body scores show room for improvement'
      })
    }
    
    if (avgScores.satisfied < 7) {
      recommendations.push({
        category: 'mindfulness',
        habit: '5-minute daily gratitude practice',
        reason: 'This can boost life satisfaction'
      })
    }
    
    return recommendations
  }
}
```

### Wellness Insights Generator
```typescript
class WellnessInsights {
  generateWeeklyInsights(userData) {
    const insights = []
    
    // Habit consistency insight
    const habitStreak = this.getLongestHabitStreak(userData.habits)
    if (habitStreak >= 7) {
      insights.push({
        type: 'achievement',
        title: `🔥 ${habitStreak}-day habit streak!`,
        message: 'Consistency is building your wellness foundation!'
      })
    }
    
    // Goal progress insight
    const goalProgress = this.analyzeGoalProgress(userData.goals)
    if (goalProgress.onTrack > 0.8) {
      insights.push({
        type: 'progress',
        title: '🎯 Goal crushing mode!',
        message: `You're ahead on ${goalProgress.onTrackCount} goals!`
      })
    }
    
    // Correlation insights
    const correlations = this.findCorrelations(userData)
    insights.push(...correlations)
    
    return insights
  }
  
  findCorrelations(userData) {
    // Find patterns like "Exercise days = higher mood scores"
    // "Good sleep = better productive scores"
    return []
  }
}
```

## 🛠️ **IMPLEMENTATION PHASES**

### Week 1-3: Custom Check-ins
- [ ] Template system database
- [ ] Template builder UI
- [ ] Dynamic question rendering
- [ ] Custom scoring logic

### Week 4-6: Habit Tracking
- [ ] Habit management system
- [ ] Daily logging interface
- [ ] Streak calculations
- [ ] Habit analytics

### Week 7-9: Goal Setting
- [ ] SMART goal framework
- [ ] Progress tracking
- [ ] Goal recommendations
- [ ] Achievement celebrations

### Week 10-12: Advanced Analytics
- [ ] Correlation analysis
- [ ] Wellness insights
- [ ] Trend predictions
- [ ] Personalized recommendations

## 📊 **ANALYTICS & INSIGHTS**

### Wellness Correlation Analysis
```typescript
interface WellnessCorrelation {
  factor1: string // 'exercise_minutes'
  factor2: string // 'mood_score'
  correlation: number // -1 to 1
  strength: 'weak' | 'moderate' | 'strong'
  insights: string[]
}

// Example correlations to detect:
// - Exercise frequency vs mood scores
// - Sleep quality vs productive scores
// - Social interactions vs satisfaction
// - Habit consistency vs overall wellness
```

## ✅ **SUCCESS CRITERIA**
- [ ] 40%+ groups create custom templates
- [ ] 60%+ users track at least 1 habit daily
- [ ] 80%+ users set wellness goals
- [ ] Meaningful correlations detected
- [ ] 25% improvement in user engagement

**Duration**: 12 weeks | **Team**: 2-3 developers | **Effort**: ~500 hours 