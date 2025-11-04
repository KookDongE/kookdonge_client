import { useAuthStore } from "@/stores/auth.store"
import ky, { type KyInstance, type Options } from "ky"
import { toast } from "sonner"

import { createEndpoints } from "./endpoints"
import type { RequestDTO, ResponseDTO } from "./types"

let isRefreshing = false
let refreshQueue: Array<() => void> = []

const processQueue = () => {
  refreshQueue.forEach((callback) => callback())
  refreshQueue = []
}

export const createApiClient = (): KyInstance => {
  return ky.create({
    prefixUrl: "/",
    hooks: {
      beforeRequest: [
        (request) => {
          const { accessToken } = useAuthStore.getState()
          if (accessToken) {
            request.headers.set("Authorization", `Bearer ${accessToken}`)
          }

          if (request.method !== "GET") {
            const body = request.body
            if (body) {
              const originalData = JSON.parse(body.toString())
              const wrappedData: RequestDTO<unknown> = {
                timestamp: new Date().toISOString(),
                data: originalData,
              }
              request.headers.set("Content-Type", "application/json")
              return new Request(request.url, {
                ...request,
                body: JSON.stringify(wrappedData),
              })
            }
          }
        },
      ],
      afterResponse: [
        async (request, options, response) => {
          const clonedResponse = response.clone()

          if (response.status === 200 || response.status === 201) {
            try {
              const json = (await clonedResponse.json()) as ResponseDTO<unknown>
              if (json.status === 200) {
                return new Response(JSON.stringify(json.data), {
                  status: response.status,
                  statusText: response.statusText,
                  headers: response.headers,
                })
              }
            } catch {
              return response
            }
          }

          try {
            const json = (await clonedResponse.json()) as ResponseDTO<unknown>
            if (json.status === 5003) {
              if (isRefreshing) {
                return new Promise((resolve) => {
                  refreshQueue.push(() => {
                    resolve(ky(request, options))
                  })
                })
              }

              isRefreshing = true

              try {
                const { refreshToken, setTokens, clearTokens } = useAuthStore.getState()

                if (!refreshToken) {
                  clearTokens()
                  toast.error("로그인이 필요합니다.")
                  throw new Error("No refresh token available")
                }

                const refreshResponse = await ky
                  .post("api/auth/reissue", {
                    prefixUrl: "/",
                    searchParams: {
                      request: JSON.stringify({
                        timestamp: new Date().toISOString(),
                        data: { refreshToken },
                      }),
                    },
                  })
                  .json<ResponseDTO<{ accessToken: string }>>()

                const newAccessToken = refreshResponse.data.accessToken
                setTokens(newAccessToken, refreshToken)

                request.headers.set("Authorization", `Bearer ${newAccessToken}`)

                isRefreshing = false
                processQueue()

                return ky(request, options)
              } catch (error) {
                isRefreshing = false
                refreshQueue = []
                useAuthStore.getState().clearTokens()
                toast.error("세션이 만료되었습니다. 다시 로그인해주세요.")
                throw error
              }
            }
          } catch (error) {
            toast.error("인증에 실패했습니다.")
            throw error
          }

          try {
            const json = (await clonedResponse.json()) as ResponseDTO<unknown>
            toast.error(json.message || "요청 처리 중 오류가 발생했습니다.")
          } catch {
            toast.error("요청 처리 중 오류가 발생했습니다.")
          }

          throw new Error(`Request failed with status ${response.status}`)
        },
      ],
    },
  })
}

export const apiClient = createApiClient()
export const api = createEndpoints(apiClient)
