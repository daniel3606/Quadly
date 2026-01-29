import { z } from 'zod';

export const universitySchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.string(),
});

export type University = z.infer<typeof universitySchema>;

export const requestEmailCodeSchema = z.object({
  email: z.string().email().endsWith('@umich.edu', {
    message: 'Email must be a UMich email address',
  }),
});

export const verifyEmailCodeSchema = z.object({
  email: z.string().email().endsWith('@umich.edu'),
  code: z.string().length(6, 'Code must be 6 digits'),
});

export const loginSchema = z.object({
  email: z.string().email().endsWith('@umich.edu'),
  password: z.string().min(8),
});

export type RequestEmailCodeInput = z.infer<typeof requestEmailCodeSchema>;
export type VerifyEmailCodeInput = z.infer<typeof verifyEmailCodeSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
