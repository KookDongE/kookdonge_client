export type Grade = 1 | 2 | 3 | 4

export interface UserProfile {
  id: string
  name: string
  email: string
  grade: Grade
  isOnLeave: boolean
  interests: string[]
  emailNotifications: boolean
  kakaoNotifications: boolean
}
