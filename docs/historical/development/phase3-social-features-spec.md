# PHASE 3: Enhanced Social Features - Technical Specification

## 🎯 **PHASE OVERVIEW**

**Objective**: Transform HuCares from basic group check-ins to a rich social wellness platform with encouragement, messaging, activity feeds, and celebrations.

**Current State**: Simple group score viewing
**Target State**: Interactive social wellness network with real-time engagement

---

## 🏗️ **TECHNICAL ARCHITECTURE**

### **New Database Tables**

```sql
-- Comments on check-ins
CREATE TABLE check_in_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_in_id UUID REFERENCES check_ins(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Content
  comment_text TEXT NOT NULL CHECK (LENGTH(comment_text) <= 500),
  emoji_reaction VARCHAR(10), -- Optional emoji-only reaction
  
  -- Status
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT comment_not_empty CHECK (
    (comment_text IS NOT NULL AND LENGTH(TRIM(comment_text)) > 0) OR
    (emoji_reaction IS NOT NULL)
  )
);

-- Reactions to check-ins
CREATE TABLE check_in_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_in_id UUID REFERENCES check_ins(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Reaction types
  reaction_type VARCHAR(20) NOT NULL, -- 'like', 'love', 'celebrate', 'support', 'strong'
  emoji VARCHAR(10) NOT NULL, -- '👍', '❤️', '🎉', '🤗', '💪'
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One reaction per user per check-in
  UNIQUE(check_in_id, user_id)
);

-- Direct messages between users
CREATE TABLE direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Participants
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Content
  message_text TEXT NOT NULL CHECK (LENGTH(message_text) <= 1000),
  message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'encouragement', 'goal_share'
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  is_deleted_by_sender BOOLEAN DEFAULT FALSE,
  is_deleted_by_recipient BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  INDEX idx_messages_conversation (sender_id, recipient_id, created_at),
  INDEX idx_messages_unread (recipient_id, is_read, created_at)
);

-- Group activity feed
CREATE TABLE group_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Activity details
  activity_type VARCHAR(50) NOT NULL, -- 'check_in', 'comment', 'reaction', 'goal_achieved', 'streak'
  activity_data JSONB NOT NULL, -- Flexible data based on activity type
  
  -- Content
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Visibility
  is_public BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_group_activities (group_id, created_at DESC),
  INDEX idx_user_activities (user_id, created_at DESC)
);

-- Group chat messages
CREATE TABLE group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Content
  message_text TEXT NOT NULL CHECK (LENGTH(message_text) <= 1000),
  message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'system', 'celebration'
  
  -- References
  reply_to_message_id UUID REFERENCES group_messages(id) ON DELETE SET NULL,
  mentioned_user_ids JSONB DEFAULT '[]', -- Array of user IDs mentioned
  
  -- Status
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_group_messages (group_id, created_at DESC),
  INDEX idx_group_messages_mentions (mentioned_user_ids)
);

-- Message read status for group chats
CREATE TABLE group_message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES group_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(message_id, user_id)
);

-- Milestone celebrations
CREATE TABLE user_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  
  -- Milestone details
  milestone_type VARCHAR(50) NOT NULL, -- 'first_checkin', 'week_streak', 'month_streak', 'high_score'
  milestone_value INTEGER, -- streak count, score value, etc.
  milestone_data JSONB DEFAULT '{}', -- Additional milestone data
  
  -- Achievement
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_celebrated BOOLEAN DEFAULT FALSE,
  celebration_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique milestones per user per group
  UNIQUE(user_id, group_id, milestone_type, milestone_value)
);

-- Encouragement templates
CREATE TABLE encouragement_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template content
  category VARCHAR(50) NOT NULL, -- 'high_score', 'improvement', 'consistency', 'support'
  template_text TEXT NOT NULL,
  emoji VARCHAR(10),
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 💬 **SOCIAL FEATURES SPECIFICATION**

### **1. Comments & Reactions System**

```typescript
interface CommentData {
  id: string
  checkInId: string
  userId: string
  username: string
  commentText?: string
  emojiReaction?: string
  createdAt: string
  updatedAt: string
  isEdited: boolean
}

interface ReactionData {
  id: string
  checkInId: string
  userId: string
  username: string
  reactionType: 'like' | 'love' | 'celebrate' | 'support' | 'strong'
  emoji: string
  createdAt: string
}

// API Endpoints
POST   /api/v1/checkins/:id/comments     // Add comment to check-in
GET    /api/v1/checkins/:id/comments     // Get comments for check-in
PUT    /api/v1/comments/:id              // Edit comment (author only)
DELETE /api/v1/comments/:id              // Delete comment (author only)

POST   /api/v1/checkins/:id/reactions    // Add/update reaction
DELETE /api/v1/checkins/:id/reactions    // Remove reaction
GET    /api/v1/checkins/:id/reactions    // Get reactions for check-in
```

### **2. Direct Messaging System**

```typescript
interface DirectMessage {
  id: string
  senderId: string
  recipientId: string
  messageText: string
  messageType: 'text' | 'encouragement' | 'goal_share'
  isRead: boolean
  readAt?: string
  createdAt: string
}

interface Conversation {
  participantId: string
  participantUsername: string
  lastMessage: DirectMessage
  unreadCount: number
  lastActivity: string
}

// API Endpoints
GET    /api/v1/messages/conversations    // Get user's conversations
GET    /api/v1/messages/conversation/:userId // Get messages with specific user
POST   /api/v1/messages                  // Send direct message
PUT    /api/v1/messages/:id/read         // Mark message as read
DELETE /api/v1/messages/:id              // Delete message
```

### **3. Activity Feed System**

```typescript
interface ActivityFeedItem {
  id: string
  groupId: string
  userId: string
  username: string
  activityType: 'check_in' | 'comment' | 'reaction' | 'goal_achieved' | 'streak'
  activityData: {
    checkInId?: string
    huCaresScore?: number
    streakCount?: number
    goalName?: string
    reactionType?: string
    commentText?: string
  }
  title: string
  description?: string
  createdAt: string
  isPublic: boolean
}

// Activity Feed Types
const ACTIVITY_TYPES = {
  CHECK_IN: {
    title: (data) => `${data.username} checked in with a score of ${data.huCaresScore}!`,
    description: (data) => `Productive: ${data.productive}, Satisfied: ${data.satisfied}, Body: ${data.body}, Care: ${data.care}`
  },
  HIGH_SCORE: {
    title: (data) => `🔥 ${data.username} achieved a high score of ${data.huCaresScore}!`,
    description: (data) => 'Way to go! Your wellness is shining today! ✨'
  },
  STREAK: {
    title: (data) => `🏆 ${data.username} is on a ${data.streakCount}-week streak!`,
    description: (data) => 'Consistency is key to wellness success!'
  },
  IMPROVEMENT: {
    title: (data) => `📈 ${data.username} improved by ${data.improvement} points this week!`,
    description: (data) => 'Progress is progress, no matter how small!'
  }
}

// API Endpoints
GET    /api/v1/groups/:id/activity       // Get group activity feed
GET    /api/v1/activity/personal         // Get personal activity across groups
POST   /api/v1/activity/create           // Create custom activity (celebrations)
```

### **4. Group Chat System**

```typescript
interface GroupMessage {
  id: string
  groupId: string
  userId: string
  username: string
  messageText: string
  messageType: 'text' | 'system' | 'celebration'
  replyToMessageId?: string
  mentionedUserIds: string[]
  isEdited: boolean
  editedAt?: string
  createdAt: string
  readBy: MessageRead[]
}

interface MessageRead {
  userId: string
  username: string
  readAt: string
}

// API Endpoints
GET    /api/v1/groups/:id/messages       // Get group messages (paginated)
POST   /api/v1/groups/:id/messages       // Send group message
PUT    /api/v1/messages/:id              // Edit message (author only)
DELETE /api/v1/messages/:id              // Delete message (author/admin)
POST   /api/v1/messages/:id/read         // Mark message as read
GET    /api/v1/groups/:id/messages/unread // Get unread message count
```

### **5. Milestone Celebration System**

```typescript
interface Milestone {
  id: string
  userId: string
  groupId: string
  milestoneType: 'first_checkin' | 'week_streak' | 'month_streak' | 'high_score' | 'perfect_week'
  milestoneValue?: number
  milestoneData: {
    streakCount?: number
    scoreValue?: number
    weekData?: any
  }
  achievedAt: string
  isCelebrated: boolean
  celebrationCount: number
}

// Milestone Detection Logic
class MilestoneDetector {
  async detectMilestones(checkIn: CheckInData): Promise<Milestone[]> {
    const milestones: Milestone[] = []
    
    // First check-in milestone
    if (await this.isFirstCheckIn(checkIn.userId, checkIn.groupId)) {
      milestones.push(this.createMilestone('first_checkin', checkIn))
    }
    
    // Streak milestones
    const streakCount = await this.getCheckInStreak(checkIn.userId, checkIn.groupId)
    if ([3, 5, 10, 20].includes(streakCount)) {
      milestones.push(this.createMilestone('week_streak', checkIn, streakCount))
    }
    
    // High score milestone
    if (checkIn.huCaresScore >= 25) {
      milestones.push(this.createMilestone('high_score', checkIn, checkIn.huCaresScore))
    }
    
    // Perfect week (all scores 8+)
    if (this.isPerfectWeek(checkIn)) {
      milestones.push(this.createMilestone('perfect_week', checkIn))
    }
    
    return milestones
  }
}

// API Endpoints
GET    /api/v1/users/:id/milestones      // Get user milestones
POST   /api/v1/milestones/:id/celebrate  // Celebrate milestone
GET    /api/v1/groups/:id/milestones     // Get recent group milestones
```

---

## 🎨 **FRONTEND COMPONENTS**

### **1. Enhanced Check-in Display**

```typescript
// CheckInCardEnhanced.tsx
interface CheckInCardEnhancedProps {
  checkIn: CheckInData
  currentUserId: string
  onComment: (checkInId: string, comment: string) => void
  onReact: (checkInId: string, reactionType: string) => void
  onMessage: (userId: string) => void
}

const CheckInCardEnhanced: React.FC<CheckInCardEnhancedProps> = ({
  checkIn,
  currentUserId,
  onComment,
  onReact,
  onMessage
}) => {
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [userReaction, setUserReaction] = useState<string | null>(null)
  
  return (
    <div className="check-in-card enhanced">
      {/* Score Display */}
      <div className="score-section">
        <h3 className="username">{checkIn.username}</h3>
        <div className="hu-cares-score celebration">
          {checkIn.huCaresScore}
        </div>
        <div className="score-breakdown">
          <span>Productive: {checkIn.productiveScore}</span>
          <span>Satisfied: {checkIn.satisfiedScore}</span>
          <span>Body: {checkIn.bodyScore}</span>
          <span>Care: {checkIn.careScore}</span>
        </div>
      </div>
      
      {/* Reactions Bar */}
      <div className="reactions-bar">
        {REACTION_TYPES.map(reaction => (
          <button
            key={reaction.type}
            className={`reaction-btn ${userReaction === reaction.type ? 'active' : ''}`}
            onClick={() => onReact(checkIn.id, reaction.type)}
          >
            {reaction.emoji}
            <span className="count">{checkIn.reactions[reaction.type] || 0}</span>
          </button>
        ))}
      </div>
      
      {/* Action Buttons */}
      <div className="action-buttons">
        <button 
          className="comment-btn"
          onClick={() => setShowComments(!showComments)}
        >
          💬 Comment ({checkIn.commentCount})
        </button>
        
        {checkIn.userId !== currentUserId && (
          <button 
            className="message-btn"
            onClick={() => onMessage(checkIn.userId)}
          >
            📨 Message
          </button>
        )}
        
        <button className="encourage-btn">
          🌟 Encourage
        </button>
      </div>
      
      {/* Comments Section */}
      {showComments && (
        <div className="comments-section">
          <div className="comments-list">
            {checkIn.comments.map(comment => (
              <div key={comment.id} className="comment">
                <strong>{comment.username}</strong>
                <span>{comment.commentText || comment.emojiReaction}</span>
                <time>{formatTime(comment.createdAt)}</time>
              </div>
            ))}
          </div>
          
          <div className="comment-input">
            <input
              type="text"
              placeholder="Add encouragement..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
            />
            <button onClick={handleSubmitComment}>Send</button>
          </div>
        </div>
      )}
    </div>
  )
}

const REACTION_TYPES = [
  { type: 'like', emoji: '👍' },
  { type: 'love', emoji: '❤️' },
  { type: 'celebrate', emoji: '🎉' },
  { type: 'support', emoji: '🤗' },
  { type: 'strong', emoji: '💪' }
]
```

### **2. Activity Feed Component**

```typescript
// ActivityFeed.tsx
interface ActivityFeedProps {
  groupId: string
  limit?: number
  showPersonalOnly?: boolean
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  groupId,
  limit = 20,
  showPersonalOnly = false
}) => {
  const [activities, setActivities] = useState<ActivityFeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  
  useEffect(() => {
    loadActivities()
  }, [groupId])
  
  const loadActivities = async () => {
    try {
      const response = await fetch(`/api/v1/groups/${groupId}/activity?limit=${limit}`)
      const data = await response.json()
      setActivities(data.activities)
      setHasMore(data.hasMore)
    } catch (error) {
      console.error('Failed to load activities:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="activity-feed">
      <h3>Recent Activity</h3>
      
      {loading ? (
        <div className="loading">Loading activities...</div>
      ) : (
        <div className="activities-list">
          {activities.map(activity => (
            <ActivityItem 
              key={activity.id} 
              activity={activity}
              onCelebrate={handleCelebrate}
            />
          ))}
          
          {hasMore && (
            <button onClick={loadMoreActivities} className="load-more">
              Load More
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ActivityItem.tsx
const ActivityItem: React.FC<{ activity: ActivityFeedItem }> = ({ activity }) => {
  const getActivityIcon = (type: string) => {
    const icons = {
      check_in: '✅',
      high_score: '🔥',
      streak: '🏆',
      improvement: '📈',
      milestone: '🌟',
      comment: '💬',
      reaction: '❤️'
    }
    return icons[type] || '✨'
  }
  
  return (
    <div className="activity-item">
      <div className="activity-icon">
        {getActivityIcon(activity.activityType)}
      </div>
      
      <div className="activity-content">
        <h4 className="activity-title">{activity.title}</h4>
        {activity.description && (
          <p className="activity-description">{activity.description}</p>
        )}
        <time className="activity-time">
          {formatRelativeTime(activity.createdAt)}
        </time>
      </div>
      
      <div className="activity-actions">
        <button className="celebrate-btn">
          🎉 Celebrate
        </button>
      </div>
    </div>
  )
}
```

### **3. Direct Messages Component**

```typescript
// DirectMessages.tsx
const DirectMessages: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  
  return (
    <div className="direct-messages">
      <div className="conversations-sidebar">
        <h3>Messages</h3>
        <div className="conversations-list">
          {conversations.map(conversation => (
            <div 
              key={conversation.participantId}
              className={`conversation-item ${activeConversation === conversation.participantId ? 'active' : ''}`}
              onClick={() => setActiveConversation(conversation.participantId)}
            >
              <div className="participant-info">
                <strong>{conversation.participantUsername}</strong>
                <p className="last-message">{conversation.lastMessage.messageText}</p>
              </div>
              
              {conversation.unreadCount > 0 && (
                <div className="unread-badge">
                  {conversation.unreadCount}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="messages-main">
        {activeConversation ? (
          <>
            <div className="messages-header">
              <h3>{getConversationName(activeConversation)}</h3>
            </div>
            
            <div className="messages-list">
              {messages.map(message => (
                <MessageBubble 
                  key={message.id} 
                  message={message}
                  isOwn={message.senderId === currentUserId}
                />
              ))}
            </div>
            
            <div className="message-input">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </>
        ) : (
          <div className="no-conversation">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  )
}
```

### **4. Group Chat Component**

```typescript
// GroupChat.tsx
interface GroupChatProps {
  groupId: string
  isOpen: boolean
  onClose: () => void
}

const GroupChat: React.FC<GroupChatProps> = ({ groupId, isOpen, onClose }) => {
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [mentioning, setMentioning] = useState<string[]>([])
  
  // Real-time message subscription
  useEffect(() => {
    if (!isOpen) return
    
    const socket = io()
    
    socket.emit('join-group-chat', groupId)
    
    socket.on('new-group-message', (message: GroupMessage) => {
      setMessages(prev => [...prev, message])
    })
    
    socket.on('message-edited', (messageId: string, newText: string) => {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, messageText: newText, isEdited: true }
          : msg
      ))
    })
    
    return () => {
      socket.emit('leave-group-chat', groupId)
      socket.disconnect()
    }
  }, [isOpen, groupId])
  
  return (
    <div className={`group-chat ${isOpen ? 'open' : ''}`}>
      <div className="chat-header">
        <h3>Group Chat</h3>
        <button onClick={onClose}>×</button>
      </div>
      
      <div className="messages-container">
        {messages.map(message => (
          <GroupMessageBubble 
            key={message.id}
            message={message}
            onReply={handleReply}
            onEdit={handleEdit}
          />
        ))}
      </div>
      
      <div className="chat-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={handleInputChange}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
      
      {mentioning.length > 0 && (
        <div className="mention-suggestions">
          {mentioning.map(username => (
            <button 
              key={username}
              onClick={() => insertMention(username)}
            >
              @{username}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## 🔄 **REAL-TIME SOCIAL EVENTS**

### **Socket.io Events for Social Features**

```typescript
// Additional Socket Events
interface SocialSocketEvents {
  // Comments & Reactions
  'new-comment': (data: {
    checkInId: string
    comment: CommentData
    groupId: string
  }) => void
  
  'new-reaction': (data: {
    checkInId: string
    reaction: ReactionData
    groupId: string
  }) => void
  
  // Direct Messages
  'new-direct-message': (message: DirectMessage) => void
  'message-read': (data: {
    messageId: string
    userId: string
    readAt: string
  }) => void
  
  // Group Chat
  'new-group-message': (message: GroupMessage) => void
  'user-typing': (data: {
    groupId: string
    userId: string
    username: string
    isTyping: boolean
  }) => void
  'message-edited': (data: {
    messageId: string
    newText: string
    editedAt: string
  }) => void
  
  // Activity Feed
  'new-activity': (activity: ActivityFeedItem) => void
  'milestone-achieved': (milestone: Milestone) => void
  
  // Online Status
  'friend-online': (data: {
    userId: string
    username: string
    groupId: string
  }) => void
  'friend-offline': (data: {
    userId: string
    username: string
    groupId: string
  }) => void
}

// Real-time handlers
class SocialRealtimeManager {
  // Broadcast new comment to group members
  async broadcastNewComment(comment: CommentData, groupId: string) {
    const groupMembers = await getGroupMembers(groupId)
    
    groupMembers.forEach(member => {
      this.io.to(member.socketId).emit('new-comment', {
        checkInId: comment.checkInId,
        comment,
        groupId
      })
    })
  }
  
  // Send direct message notification
  async sendDirectMessageNotification(message: DirectMessage) {
    const recipient = await getUserById(message.recipientId)
    
    if (recipient?.socketId) {
      this.io.to(recipient.socketId).emit('new-direct-message', message)
    }
    
    // Also send push notification if user is offline
    if (!recipient?.isOnline) {
      await this.pushNotificationService.sendDirectMessage(message)
    }
  }
  
  // Broadcast group message
  async broadcastGroupMessage(message: GroupMessage) {
    this.io.to(`group-${message.groupId}`).emit('new-group-message', message)
  }
  
  // Broadcast milestone achievement
  async broadcastMilestone(milestone: Milestone) {
    const groupMembers = await getGroupMembers(milestone.groupId)
    
    groupMembers.forEach(member => {
      this.io.to(member.socketId).emit('milestone-achieved', milestone)
    })
  }
}
```

---

## 🎯 **ENCOURAGEMENT ENGINE**

### **Smart Encouragement System**

```typescript
class EncouragementEngine {
  private templates: EncouragementTemplate[]
  
  constructor() {
    this.templates = [
      // High Score Encouragements
      {
        category: 'high_score',
        template: "🔥 Amazing score of {score}! You're absolutely crushing it today! Keep that positive energy flowing! ✨",
        triggers: { minScore: 25 }
      },
      {
        category: 'high_score',
        template: "🌟 Wow! {score} points is incredible! Your wellness journey is truly inspiring! 💪",
        triggers: { minScore: 20 }
      },
      
      // Improvement Encouragements
      {
        category: 'improvement',
        template: "📈 I love seeing your progress! {improvement} point improvement is fantastic! Every step forward counts! 🚀",
        triggers: { minImprovement: 3 }
      },
      {
        category: 'improvement',
        template: "🎯 Your dedication is paying off! {improvement} points better than last week - you're on fire! 🔥",
        triggers: { minImprovement: 5 }
      },
      
      // Consistency Encouragements
      {
        category: 'consistency',
        template: "🏆 {streak} weeks in a row! Your consistency is your superpower! Keep building that momentum! 💫",
        triggers: { minStreak: 3 }
      },
      {
        category: 'consistency',
        template: "⭐ {streak} weeks strong! You're proving that small consistent actions create big results! 🌱",
        triggers: { minStreak: 5 }
      },
      
      // Support Encouragements
      {
        category: 'support',
        template: "🤗 Even when things are tough, you still showed up. That takes real courage. Proud of you! 💝",
        triggers: { maxScore: 10 }
      },
      {
        category: 'support',
        template: "💙 Rough week? That's okay - you're still here, still trying. That's what resilience looks like! 🌈",
        triggers: { maxScore: 5 }
      }
    ]
  }
  
  generateEncouragement(checkIn: CheckInData, previousCheckIn?: CheckInData): string {
    const context = this.analyzeContext(checkIn, previousCheckIn)
    const appropriateTemplates = this.templates.filter(template => 
      this.isTemplateApplicable(template, context)
    )
    
    if (appropriateTemplates.length === 0) {
      return this.getGenericEncouragement()
    }
    
    const template = this.selectRandomTemplate(appropriateTemplates)
    return this.populateTemplate(template, context)
  }
  
  private analyzeContext(checkIn: CheckInData, previousCheckIn?: CheckInData) {
    const score = checkIn.huCaresScore
    const improvement = previousCheckIn ? score - previousCheckIn.huCaresScore : 0
    const streak = checkIn.user.checkInStreak || 1
    
    return {
      score,
      improvement,
      streak,
      isHighScore: score >= 20,
      isLowScore: score <= 10,
      isImprovement: improvement > 0,
      isConsistent: streak >= 3
    }
  }
  
  private populateTemplate(template: EncouragementTemplate, context: any): string {
    let message = template.template
    
    // Replace placeholders
    message = message.replace('{score}', context.score.toString())
    message = message.replace('{improvement}', Math.abs(context.improvement).toString())
    message = message.replace('{streak}', context.streak.toString())
    
    return message
  }
}

// API endpoint for generating encouragement
POST /api/v1/encouragement/generate
Body: {
  checkInId: string,
  recipientId: string
}
Response: {
  encouragementText: string,
  category: string,
  suggestedEmojis: string[]
}
```

---

## 📊 **ANALYTICS & INSIGHTS**

### **Social Engagement Metrics**

```typescript
interface SocialMetrics {
  // Engagement Metrics
  totalComments: number
  totalReactions: number
  averageCommentsPerCheckIn: number
  averageReactionsPerCheckIn: number
  
  // Activity Metrics
  dailyActiveUsers: number
  weeklyActiveUsers: number
  messagesSentToday: number
  messagesReceivedToday: number
  
  // Social Health Score
  socialHealthScore: number // 0-100 based on engagement
  friendshipStrength: Record<string, number> // userId -> strength score
  groupCohesion: number // How well the group supports each other
  
  // Encouragement Metrics
  encouragementsGiven: number
  encouragementsReceived: number
  encouragementResponseRate: number // How often people respond to encouragement
}

// Social Analytics API
GET /api/v1/analytics/social/personal     // Personal social metrics
GET /api/v1/analytics/social/group/:id    // Group social health
GET /api/v1/analytics/social/friendship   // Friendship strength analysis
GET /api/v1/analytics/social/engagement   // Engagement trends over time
```

---

## 🛠️ **IMPLEMENTATION ROADMAP**

### **Phase 3.1: Comments & Reactions** (Week 1-2)

**Deliverables:**
- [ ] Database schema for comments and reactions
- [ ] API endpoints for comment CRUD operations
- [ ] API endpoints for reaction management
- [ ] Frontend comment interface
- [ ] Real-time comment notifications
- [ ] Comment moderation (edit/delete)

### **Phase 3.2: Direct Messaging** (Week 3-4)

**Deliverables:**
- [ ] Direct message database schema
- [ ] Private messaging API endpoints
- [ ] Conversation management interface
- [ ] Real-time message delivery
- [ ] Message read status tracking
- [ ] Message search and filtering

### **Phase 3.3: Activity Feed** (Week 5-6)

**Deliverables:**
- [ ] Activity tracking system
- [ ] Activity feed generation logic
- [ ] Feed display component
- [ ] Activity filtering and preferences
- [ ] Real-time activity updates
- [ ] Activity notifications

### **Phase 3.4: Group Chat** (Week 7-8)

**Deliverables:**
- [ ] Group messaging database schema
- [ ] Group chat API endpoints
- [ ] Real-time group chat interface
- [ ] Message mentions and replies
- [ ] Chat moderation features
- [ ] Message history and search

### **Phase 3.5: Milestones & Celebrations** (Week 9-10)

**Deliverables:**
- [ ] Milestone detection system
- [ ] Celebration mechanics
- [ ] Achievement display interface
- [ ] Milestone notifications
- [ ] Celebration sharing features
- [ ] Achievement analytics

### **Phase 3.6: Encouragement Engine** (Week 11-12)

**Deliverables:**
- [ ] Encouragement template system
- [ ] Smart suggestion algorithm
- [ ] Encouragement delivery interface
- [ ] Template customization
- [ ] Encouragement analytics
- [ ] A/B testing framework

---

## 🧪 **TESTING STRATEGY**

### **Social Features Testing**

```typescript
// Comment System Tests
describe('Comment System', () => {
  it('should allow users to comment on check-ins', async () => {
    const checkIn = await createTestCheckIn()
    const comment = await addComment(checkIn.id, 'Great job!')
    
    expect(comment.commentText).toBe('Great job!')
    expect(comment.checkInId).toBe(checkIn.id)
  })
  
  it('should prevent empty comments', async () => {
    const checkIn = await createTestCheckIn()
    
    await expect(addComment(checkIn.id, '')).rejects.toThrow('Comment cannot be empty')
  })
  
  it('should allow comment editing by author', async () => {
    const comment = await createTestComment()
    const updated = await editComment(comment.id, 'Updated comment', comment.userId)
    
    expect(updated.commentText).toBe('Updated comment')
    expect(updated.isEdited).toBe(true)
  })
  
  it('should prevent comment editing by non-author', async () => {
    const comment = await createTestComment()
    const otherUserId = 'other-user-id'
    
    await expect(editComment(comment.id, 'Hack attempt', otherUserId))
      .rejects.toThrow('Unauthorized')
  })
})

// Real-time Social Events Tests
describe('Real-time Social Events', () => {
  it('should broadcast comments to group members', async () => {
    const { group, members } = await createTestGroup(3)
    const checkIn = await createTestCheckIn(members[0].id, group.id)
    
    const mockSocket = new MockSocket()
    const comment = await addComment(checkIn.id, 'Nice work!', members[1].id)
    
    expect(mockSocket.emittedEvents).toContainEqual({
      event: 'new-comment',
      data: expect.objectContaining({
        checkInId: checkIn.id,
        comment: expect.objectContaining({
          commentText: 'Nice work!'
        })
      })
    })
  })
})

// Encouragement Engine Tests
describe('Encouragement Engine', () => {
  it('should generate appropriate encouragement for high scores', () => {
    const checkIn = { huCaresScore: 28, user: { checkInStreak: 5 } }
    const encouragement = encouragementEngine.generateEncouragement(checkIn)
    
    expect(encouragement).toContain('🔥')
    expect(encouragement).toContain('28')
  })
  
  it('should provide supportive messages for low scores', () => {
    const checkIn = { huCaresScore: 3, user: { checkInStreak: 1 } }
    const encouragement = encouragementEngine.generateEncouragement(checkIn)
    
    expect(encouragement).toContain('🤗')
    expect(encouragement.toLowerCase()).toContain('courage')
  })
})
```

---

## 🚀 **PERFORMANCE CONSIDERATIONS**

### **Real-time Optimization**

```typescript
// Connection Pool Management
class SocketConnectionManager {
  private connections = new Map<string, Socket>()
  private userGroups = new Map<string, Set<string>>()
  
  // Efficiently manage group subscriptions
  joinGroup(userId: string, groupId: string, socket: Socket) {
    socket.join(`group-${groupId}`)
    
    if (!this.userGroups.has(userId)) {
      this.userGroups.set(userId, new Set())
    }
    this.userGroups.get(userId)!.add(groupId)
  }
  
  // Batch notifications to reduce socket events
  batchNotifications(notifications: Notification[], delay = 100) {
    setTimeout(() => {
      const grouped = this.groupNotificationsByUser(notifications)
      
      grouped.forEach((userNotifications, userId) => {
        const socket = this.connections.get(userId)
        if (socket) {
          socket.emit('batch-notifications', userNotifications)
        }
      })
    }, delay)
  }
}

// Database Query Optimization
class SocialQueryOptimizer {
  // Efficiently load check-ins with social data
  async getCheckInsWithSocialData(groupId: string, limit: number) {
    return await this.db.checkIn.findMany({
      where: { groupId },
      include: {
        user: { select: { id: true, username: true } },
        comments: {
          include: { user: { select: { id: true, username: true } } },
          orderBy: { createdAt: 'desc' },
          take: 3 // Show only recent comments, load more on demand
        },
        reactions: {
          include: { user: { select: { id: true, username: true } } }
        },
        _count: {
          select: { comments: true, reactions: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }
  
  // Cache frequently accessed social data
  @Cache(300) // 5 minute cache
  async getGroupSocialMetrics(groupId: string) {
    const metrics = await this.db.$queryRaw`
      SELECT 
        COUNT(DISTINCT c.id) as total_checkins,
        COUNT(DISTINCT cm.id) as total_comments,
        COUNT(DISTINCT r.id) as total_reactions,
        AVG(CASE WHEN c.created_at >= NOW() - INTERVAL '7 days' THEN c.hu_cares_score END) as avg_weekly_score
      FROM check_ins c
      LEFT JOIN check_in_comments cm ON c.id = cm.check_in_id
      LEFT JOIN check_in_reactions r ON c.id = r.check_in_id
      WHERE c.group_id = ${groupId}
    `
    
    return metrics[0]
  }
}
```

---

## 📈 **SUCCESS CRITERIA**

### **Engagement Metrics**

- [ ] **Comment Adoption**: 70%+ of check-ins receive comments
- [ ] **Reaction Usage**: 90%+ of check-ins receive reactions
- [ ] **Message Activity**: 50%+ of users send messages weekly
- [ ] **Response Rate**: 80%+ of encouragements get responses
- [ ] **Real-time Latency**: Social events delivered within 100ms
- [ ] **User Retention**: 20% increase in weekly active users

### **Social Health Indicators**

- [ ] **Group Cohesion**: Average friendship strength score > 7/10
- [ ] **Support Network**: Each user receives encouragement weekly
- [ ] **Positive Sentiment**: 90%+ of comments are positive/supportive
- [ ] **Milestone Celebration**: 95% of milestones get celebrated
- [ ] **Chat Participation**: 60%+ of group members use group chat

### **Technical Performance**

- [ ] **Real-time Delivery**: 99% message delivery success rate
- [ ] **Database Performance**: Social queries under 100ms
- [ ] **Storage Efficiency**: Message storage optimized
- [ ] **Mobile Performance**: Smooth experience on mobile devices
- [ ] **Offline Resilience**: Graceful offline comment/message handling

---

## 🎉 **CELEBRATION FEATURES**

### **Automated Celebration System**

```typescript
class CelebrationSystem {
  async celebrateAchievement(milestone: Milestone) {
    // Generate celebration message
    const celebrationMessage = this.generateCelebrationMessage(milestone)
    
    // Create group activity
    await this.createGroupActivity({
      groupId: milestone.groupId,
      userId: milestone.userId,
      activityType: 'milestone_celebration',
      title: celebrationMessage.title,
      description: celebrationMessage.description,
      activityData: {
        milestoneType: milestone.milestoneType,
        milestoneValue: milestone.milestoneValue
      }
    })
    
    // Notify group members
    await this.notifyGroupMembers(milestone.groupId, {
      type: 'celebration',
      title: `🎉 Celebrate ${milestone.user.username}!`,
      message: celebrationMessage.title,
      actionUrl: `/groups/${milestone.groupId}/activity`
    })
    
    // Auto-generate congratulatory reactions
    await this.autoGenerateReactions(milestone)
  }
  
  private generateCelebrationMessage(milestone: Milestone) {
    const messages = {
      first_checkin: {
        title: `🌟 ${milestone.user.username} joined the wellness journey!`,
        description: "Welcome to the group! We're excited to support each other!"
      },
      week_streak: {
        title: `🔥 ${milestone.user.username} is on a ${milestone.milestoneValue}-week streak!`,
        description: "Consistency is the key to success! Keep it up!"
      },
      high_score: {
        title: `🏆 ${milestone.user.username} achieved an amazing score of ${milestone.milestoneValue}!`,
        description: "That's some serious wellness power! Inspiring!"
      },
      perfect_week: {
        title: `✨ ${milestone.user.username} had a perfect wellness week!`,
        description: "All scores above 8 - that's incredible balance!"
      }
    }
    
    return messages[milestone.milestoneType] || {
      title: `🎉 ${milestone.user.username} achieved something awesome!`,
      description: "Keep celebrating life's moments!"
    }
  }
}
```

---

**Total Duration**: 12 weeks | **Team Size**: 2-3 developers | **Effort**: ~500-600 hours

**This completes the comprehensive Phase 3 specification. Ready to build social connections that matter! 🤝** 