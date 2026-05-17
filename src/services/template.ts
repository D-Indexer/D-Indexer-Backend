import pool from '../db/client';
import { Template } from '../types';

export async function listTemplates(): Promise<Template[]> {
  const { rows } = await pool.query(
    'SELECT * FROM templates WHERE deprecated = FALSE ORDER BY id'
  );
  return rows.map((r) => ({ ...r, metadataCid: r.metadata_cid, createdAt: r.created_at }));
}

export async function getTemplate(id: number): Promise<Template | null> {
  const { rows } = await pool.query('SELECT * FROM templates WHERE id = $1', [id]);
  if (!rows[0]) return null;
  return { ...rows[0], metadataCid: rows[0].metadata_cid, createdAt: rows[0].created_at };
}
