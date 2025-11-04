import type { KyInstance } from "ky"

import { authEndpoints } from "./auth"
import { clubEndpoints } from "./club"
import { feedEndpoints } from "./feed"
import { questionEndpoints } from "./question"
import { waitingListEndpoints } from "./waiting-list"

export const createEndpoints = (client: KyInstance) => ({
  auth: authEndpoints(client),
  club: clubEndpoints(client),
  feed: feedEndpoints(client),
  question: questionEndpoints(client),
  waitingList: waitingListEndpoints(client),
})

export * from "./auth"
export * from "./club"
export * from "./feed"
export * from "./question"
export * from "./waiting-list"
