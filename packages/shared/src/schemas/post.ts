import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  is_anonymous: z.coerce.boolean().optional(),
});

export const updatePostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(10000).optional(),
});

export const createCommentSchema = z.object({
  body: z.string().min(1).max(5000),
  is_anonymous: z.coerce.boolean().optional(),
});

export const updateCommentSchema = z.object({
  body: z.string().min(1).max(5000),
});

export const reportSchema = z.object({
  target_type: z.enum(['post', 'comment', 'review', 'user']),
  target_id: z.string().uuid(),
  reason_code: z.enum([
    'spam',
    'harassment',
    'hate',
    'sexual',
    'privacy',
    'illegal',
    'other',
  ]),
  description: z.string().max(1000).optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
