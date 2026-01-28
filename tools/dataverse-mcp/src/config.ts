import { z } from 'zod';

const envSchema = z.object({
  DATAVERSE_URL: z.string().url(),
  TENANT_ID: z.string().min(1),
  CLIENT_ID: z.string().min(1),
  TOKEN_CACHE_PATH: z.string().min(1).optional(),
});

export const config = envSchema.parse(process.env);

export const dataverseApiBase = new URL('/api/data/v9.2/', config.DATAVERSE_URL).toString();
