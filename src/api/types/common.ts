import { z } from "zod"

export const RequestDTOSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    timestamp: z.string().datetime(),
    data: dataSchema,
  })

export const ResponseDTOSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    status: z.number().int(),
    message: z.string(),
    timestamp: z.string().datetime(),
    data: dataSchema,
  })

export const PageableSchema = z.object({
  page: z.number().int().min(0).optional(),
  size: z.number().int().min(1).optional(),
  sort: z.array(z.string()).optional(),
})

export const SortObjectSchema = z.object({
  empty: z.boolean(),
  sorted: z.boolean(),
  unsorted: z.boolean(),
})

export const PageableObjectSchema = z.object({
  offset: z.number().int(),
  sort: SortObjectSchema,
  paged: z.boolean(),
  pageNumber: z.number().int(),
  pageSize: z.number().int(),
  unpaged: z.boolean(),
})

export const PageSchema = <T extends z.ZodTypeAny>(contentSchema: T) =>
  z.object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    size: z.number().int(),
    content: z.array(contentSchema),
    number: z.number().int(),
    sort: SortObjectSchema,
    pageable: PageableObjectSchema,
    numberOfElements: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    empty: z.boolean(),
  })

export type RequestDTO<T> = {
  timestamp: string
  data: T
}

export type ResponseDTO<T> = {
  status: number
  message: string
  timestamp: string
  data: T
}

export type Pageable = z.infer<typeof PageableSchema>
export type Page<T> = {
  totalPages: number
  totalElements: number
  size: number
  content: T[]
  number: number
  sort: z.infer<typeof SortObjectSchema>
  pageable: z.infer<typeof PageableObjectSchema>
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}
