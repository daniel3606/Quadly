import { z } from 'zod';

export const createScheduleSchema = z.object({
  name: z.string().min(1).max(100),
});

export const updateScheduleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export const createScheduleItemSchema = z.object({
  course_id: z.string().uuid().nullable(),
  title: z.string().min(1).max(200),
  day_of_week: z.number().int().min(0).max(6),
  start_minute: z.number().int().min(0).max(1439),
  end_minute: z.number().int().min(0).max(1439),
  location: z.string().max(200).nullable().optional(),
  color: z.string().max(7).nullable().optional(),
});

export const updateScheduleItemSchema = z.object({
  course_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1).max(200).optional(),
  day_of_week: z.number().int().min(0).max(6).optional(),
  start_minute: z.number().int().min(0).max(1439).optional(),
  end_minute: z.number().int().min(0).max(1439).optional(),
  location: z.string().max(200).nullable().optional(),
  color: z.string().max(7).nullable().optional(),
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
export type CreateScheduleItemInput = z.infer<typeof createScheduleItemSchema>;
export type UpdateScheduleItemInput = z.infer<typeof updateScheduleItemSchema>;
