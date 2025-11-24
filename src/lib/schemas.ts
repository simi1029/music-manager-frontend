import { z } from "zod"

export const RatingCreate = z.object({
  trackId: z.string().min(1),
  score: z.number().int().min(0).max(10),
  review: z.string().max(5000).optional(),
})
export type RatingCreate = z.infer<typeof RatingCreate>

export const ReleasesQuery = z.object({
  artist: z.string().optional(),
  year: z.coerce.number().int().optional(),
  sort: z.enum(["artist", "year", "rating"]).optional(),
})
