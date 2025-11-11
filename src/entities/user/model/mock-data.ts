import type { UserProfile } from "./types"

export const mockUserProfile: UserProfile = {
  id: "u1",
  name: "김국민",
  email: "student@kookmin.ac.kr",
  grade: 2,
  isOnLeave: false,
  interests: ["학술", "문화"],
  emailNotifications: true,
  kakaoNotifications: false,
}

export function getUserProfile(): UserProfile {
  return mockUserProfile
}
