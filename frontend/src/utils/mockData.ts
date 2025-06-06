import { GroupData, FriendData, CheckInData, generateId, generateAccessCode } from './localStorage'

// Sample groups for users to join
export const MOCK_GROUPS: GroupData[] = [
  {
    id: 'group-family',
    name: 'Family Circle',
    description: 'Weekly check-ins with the people who matter most',
    accessCode: 'FAM123',
    memberIds: ['user-mom', 'user-dad', 'user-sibling1', 'user-sibling2'],
    createdAt: '2024-01-01T00:00:00.000Z',
    isActive: true
  },
  {
    id: 'group-friends',
    name: 'College Friends',
    description: 'Staying connected through life\'s ups and downs',
    accessCode: 'FRIEND',
    memberIds: ['user-alex', 'user-sam', 'user-jordan', 'user-casey', 'user-taylor'],
    createdAt: '2024-01-15T00:00:00.000Z',
    isActive: true
  },
  {
    id: 'group-work',
    name: 'Work Wellness',
    description: 'Supporting each other in our professional journeys',
    accessCode: 'WORK22',
    memberIds: ['user-manager', 'user-colleague1', 'user-colleague2'],
    createdAt: '2024-02-01T00:00:00.000Z',
    isActive: true
  },
  {
    id: 'group-fitness',
    name: 'Fitness Accountability',
    description: 'Celebrating our wellness journey together',
    accessCode: 'FIT456',
    memberIds: ['user-trainer', 'user-gym1', 'user-gym2', 'user-gym3'],
    createdAt: '2024-02-15T00:00:00.000Z',
    isActive: true
  }
]

// Mock friends for each group
export const MOCK_FRIENDS: FriendData[] = [
  // Family Circle
  {
    id: 'user-mom',
    username: 'loving_mom',
    groupId: 'group-family',
    lastCheckInScore: 22,
    lastCheckInDate: '2024-06-03T00:00:00.000Z'
  },
  {
    id: 'user-dad',
    username: 'dad_jokes_4ever',
    groupId: 'group-family',
    lastCheckInScore: 18,
    lastCheckInDate: '2024-06-03T00:00:00.000Z'
  },
  {
    id: 'user-sibling1',
    username: 'cool_sister',
    groupId: 'group-family',
    lastCheckInScore: 25,
    lastCheckInDate: '2024-06-03T00:00:00.000Z'
  },
  {
    id: 'user-sibling2',
    username: 'little_bro',
    groupId: 'group-family',
    lastCheckInScore: 16,
    lastCheckInDate: '2024-06-02T00:00:00.000Z'
  },

  // College Friends
  {
    id: 'user-alex',
    username: 'alex_adventures',
    groupId: 'group-friends',
    lastCheckInScore: 20,
    lastCheckInDate: '2024-06-03T00:00:00.000Z'
  },
  {
    id: 'user-sam',
    username: 'sam_the_dreamer',
    groupId: 'group-friends',
    lastCheckInScore: 24,
    lastCheckInDate: '2024-06-03T00:00:00.000Z'
  },
  {
    id: 'user-jordan',
    username: 'jordan_vibes',
    groupId: 'group-friends',
    lastCheckInScore: 19,
    lastCheckInDate: '2024-06-03T00:00:00.000Z'
  },
  {
    id: 'user-casey',
    username: 'casey_creates',
    groupId: 'group-friends',
    lastCheckInScore: 27,
    lastCheckInDate: '2024-06-03T00:00:00.000Z'
  },
  {
    id: 'user-taylor',
    username: 'taylor_travels',
    groupId: 'group-friends',
    lastCheckInScore: 15,
    lastCheckInDate: '2024-06-01T00:00:00.000Z'
  },

  // Work Wellness
  {
    id: 'user-manager',
    username: 'supportive_lead',
    groupId: 'group-work',
    lastCheckInScore: 21,
    lastCheckInDate: '2024-06-03T00:00:00.000Z'
  },
  {
    id: 'user-colleague1',
    username: 'team_player',
    groupId: 'group-work',
    lastCheckInScore: 23,
    lastCheckInDate: '2024-06-03T00:00:00.000Z'
  },
  {
    id: 'user-colleague2',
    username: 'coffee_buddy',
    groupId: 'group-work',
    lastCheckInScore: 17,
    lastCheckInDate: '2024-06-02T00:00:00.000Z'
  },

  // Fitness Accountability
  {
    id: 'user-trainer',
    username: 'fit_coach',
    groupId: 'group-fitness',
    lastCheckInScore: 28,
    lastCheckInDate: '2024-06-03T00:00:00.000Z'
  },
  {
    id: 'user-gym1',
    username: 'morning_warrior',
    groupId: 'group-fitness',
    lastCheckInScore: 26,
    lastCheckInDate: '2024-06-03T00:00:00.000Z'
  },
  {
    id: 'user-gym2',
    username: 'yoga_zen',
    groupId: 'group-fitness',
    lastCheckInScore: 22,
    lastCheckInDate: '2024-06-03T00:00:00.000Z'
  },
  {
    id: 'user-gym3',
    username: 'cardio_queen',
    groupId: 'group-fitness',
    lastCheckInScore: 24,
    lastCheckInDate: '2024-06-02T00:00:00.000Z'
  }
]

// Generate mock check-in data for friends
export const generateMockCheckIns = (weekStartDate: string): CheckInData[] => {
  const checkIns: CheckInData[] = []
  
  MOCK_FRIENDS.forEach(friend => {
    if (friend.lastCheckInScore && friend.lastCheckInDate) {
      // Generate realistic scores that add up to their last check-in score
      const targetScore = friend.lastCheckInScore
      
      // Distribute the score across the 4 questions
      // Productive + Satisfied + Body - Care = HuCares Score
      // So: Productive + Satisfied + Body = HuCares Score + Care
      
      const care = Math.floor(Math.random() * 4) + 3 // 3-6
      const totalPositive = targetScore + care
      
      const productive = Math.min(10, Math.max(1, Math.floor(totalPositive * 0.35) + Math.floor(Math.random() * 3) - 1))
      const satisfied = Math.min(10, Math.max(1, Math.floor(totalPositive * 0.35) + Math.floor(Math.random() * 3) - 1))
      const body = Math.min(10, Math.max(1, totalPositive - productive - satisfied))
      
      checkIns.push({
        id: generateId(),
        userId: friend.id,
        groupId: friend.groupId,
        weekStartDate,
        productive,
        satisfied,
        body,
        care,
        huCaresScore: productive + satisfied + body - care,
        submittedAt: new Date(friend.lastCheckInDate).toISOString()
      })
    }
  })
  
  return checkIns
}

// Get group leaderboard data
export const getGroupLeaderboard = (groupId: string, weekStartDate: string) => {
  const groupFriends = MOCK_FRIENDS.filter(f => f.groupId === groupId)
  const mockCheckIns = generateMockCheckIns(weekStartDate)
  
  return groupFriends.map(friend => {
    const checkIn = mockCheckIns.find(c => c.userId === friend.id)
    return {
      username: friend.username,
      score: checkIn?.huCaresScore || 0,
      hasCheckedIn: !!checkIn,
      checkInDate: checkIn?.submittedAt
    }
  }).sort((a, b) => b.score - a.score)
}

// Get group statistics
export const getGroupStats = (groupId: string, weekStartDate: string) => {
  const leaderboard = getGroupLeaderboard(groupId, weekStartDate)
  const checkedInCount = leaderboard.filter(m => m.hasCheckedIn).length
  const totalMembers = leaderboard.length
  const averageScore = leaderboard.reduce((sum, m) => sum + m.score, 0) / Math.max(1, checkedInCount)
  
  return {
    totalMembers,
    checkedInCount,
    participationRate: (checkedInCount / totalMembers) * 100,
    averageScore: Math.round(averageScore * 10) / 10,
    highestScore: Math.max(...leaderboard.map(m => m.score)),
    lowestScore: Math.min(...leaderboard.filter(m => m.hasCheckedIn).map(m => m.score))
  }
}

// Initialize mock data if not exists
export const initializeMockData = () => {
  // Check if we already have groups
  const existingGroups = JSON.parse(localStorage.getItem('hucares_groups') || '[]')
  
  if (existingGroups.length === 0) {
    // Save mock groups
    localStorage.setItem('hucares_groups', JSON.stringify(MOCK_GROUPS))
    
    // Save mock friends
    localStorage.setItem('hucares_friends', JSON.stringify(MOCK_FRIENDS))
    
    console.log('Mock data initialized! 🎉')
    return true
  }
  
  return false
}

// Helper to add user to a mock group
export const joinMockGroup = (accessCode: string, userId: string): GroupData | null => {
  const group = MOCK_GROUPS.find(g => g.accessCode === accessCode)
  
  if (group && !group.memberIds.includes(userId)) {
    // Create a new group instance with the user added
    const updatedGroup = {
      ...group,
      memberIds: [...group.memberIds, userId]
    }
    
    return updatedGroup
  }
  
  return group || null
} 