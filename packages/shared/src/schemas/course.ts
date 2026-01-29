import { z } from 'zod';

export const createCourseSchema = z.object({
  subject: z.string().min(1).max(10),
  catalog_number: z.string().min(1).max(10),
  title: z.string().min(1).max(200),
  credits_min: z.number().int().min(1).max(10),
  credits_max: z.number().int().min(1).max(10),
  term_tags: z.array(z.string()).optional(),
});

export const createReviewSchema = z.object({
  rating_overall: z.number().int().min(1).max(5),
  difficulty: z.number().int().min(1).max(5),
  workload: z.number().int().min(1).max(5),
  exams: z.number().int().min(0).max(3),
  attendance_required: z.boolean(),
  text_body: z.string().min(10).max(5000),
});

export const updateReviewSchema = z.object({
  rating_overall: z.number().int().min(1).max(5).optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  workload: z.number().int().min(1).max(5).optional(),
  exams: z.number().int().min(0).max(3).optional(),
  attendance_required: z.boolean().optional(),
  text_body: z.string().min(10).max(5000).optional(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
