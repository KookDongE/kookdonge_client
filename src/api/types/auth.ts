import { z } from "zod"

export const LoginReqSchema = z.object({
  googleGrantCode: z.string(),
})

export const LoginResSchema = z.object({
  externalUserId: z.string(),
  email: z.string(),
  studentId: z.string(),
  phoneNumber: z.string(),
  department: z.string(),
  accessToken: z.string(),
  refreshToken: z.string(),
})

export const RegisterUserReqSchema = z.object({
  googleGrantCode: z.string(),
  department: z.string(),
  studentId: z.string(),
  phoneNumber: z.string(),
})

export const RegisterUserResSchema = z.object({
  externalUserId: z.string(),
  email: z.string(),
  studentId: z.string(),
  phoneNumber: z.string(),
  department: z.string(),
  accessToken: z.string(),
  refreshToken: z.string(),
})

export const ReissueAccessTokenReqSchema = z.object({
  refreshToken: z.string(),
})

export const ReissueAccessTokenResSchema = z.object({
  accessToken: z.string(),
})

export const UserProfileResSchema = z.object({
  externalUserId: z.string(),
  email: z.string(),
  studentId: z.string(),
  phoneNumber: z.string(),
  department: z.string(),
  clubId: z.number().int().optional(),
})

export type LoginReq = z.infer<typeof LoginReqSchema>
export type LoginRes = z.infer<typeof LoginResSchema>
export type RegisterUserReq = z.infer<typeof RegisterUserReqSchema>
export type RegisterUserRes = z.infer<typeof RegisterUserResSchema>
export type ReissueAccessTokenReq = z.infer<typeof ReissueAccessTokenReqSchema>
export type ReissueAccessTokenRes = z.infer<typeof ReissueAccessTokenResSchema>
export type UserProfileRes = z.infer<typeof UserProfileResSchema>
