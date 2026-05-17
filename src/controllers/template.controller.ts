import { Request, Response } from 'express';
import * as templateService from '../services/template';
import { asyncHandler } from '../middleware/asyncHandler';

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const templates = await templateService.listTemplates();
  res.json(templates);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const template = await templateService.getTemplate(Number(req.params.id));
  if (!template) return res.status(404).json({ error: 'Template not found' });
  res.json(template);
});
