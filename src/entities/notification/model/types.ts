export interface Notification {
  id: string
  type: "waitlist" | "answer" | "system"
  title: string
  message: string
  clubId?: string
  clubName?: string
  createdAt: string
  isRead: boolean
}
