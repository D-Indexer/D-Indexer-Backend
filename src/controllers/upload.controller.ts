import { Request, Response } from 'express';
import { pinFile } from '../services/ipfs';
import { asyncHandler } from '../middleware/asyncHandler';
import { uploadFileSchema } from '../validation/schemas';

export const upload = asyncHandler(async (req: Request, res: Response) => {
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) return res.status(400).json({ error: 'No file provided' });

  const result = uploadFileSchema.safeParse({ mimetype: file.mimetype, size: file.size });
  if (!result.success) return res.status(400).json({ error: result.error.errors[0].message });

  const cid = await pinFile(file.buffer, file.originalname);
  res.json({ cid });
});
