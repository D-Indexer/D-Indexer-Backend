import { Request, Response } from 'express';
import * as folderService from '../services/folder';
import { asyncHandler } from '../middleware/asyncHandler';
import { stellarAddressSchema } from '../validation/schemas';

export const getByAddress = asyncHandler(async (req: Request, res: Response) => {
  const parsed = stellarAddressSchema.safeParse(req.params.address);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const folder = await folderService.getFolderByAddress(parsed.data);
  if (!folder) return res.status(404).json({ error: 'Folder not found' });
  res.json(folder);
});

export const getByName = asyncHandler(async (req: Request, res: Response) => {
  const folder = await folderService.getFolderByName(req.params.name);
  if (!folder) return res.status(404).json({ error: 'Folder not found' });
  res.json(folder);
});

export const getCredentials = asyncHandler(async (req: Request, res: Response) => {
  const parsed = stellarAddressSchema.safeParse(req.params.address);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

  const credentials = await folderService.getCredentials(parsed.data);
  res.json(credentials);
});
