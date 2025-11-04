import type { KyInstance } from "ky"

import type { ClubInWaitingListDto } from "../types"

export const waitingListEndpoints = (client: KyInstance) => ({
  getWaitingLists: async (): Promise<ClubInWaitingListDto[]> => {
    return client.get("api/waiting-lists").json<ClubInWaitingListDto[]>()
  },

  subscribeWaitList: async (clubId: number): Promise<void> => {
    await client.post(`api/clubs/${clubId}/waiting`)
  },

  unsubscribeWaitList: async (clubId: number): Promise<void> => {
    await client.delete(`api/clubs/${clubId}/waiting`)
  },
})
