import express from 'express';
import { Request } from 'express';

// JSON parser that also keeps the raw body for signature verification (e.g., PayOS webhooks)
export const jsonWithRaw = express.json({
  limit: '10mb',
  verify: (req: Request & { rawBody?: Buffer }, _res, buf) => {
    req.rawBody = Buffer.from(buf);
  },
});

