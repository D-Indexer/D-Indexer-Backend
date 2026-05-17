import pool from '../db/client';
import { Folder, Credential } from '../types';

export async function getFolderByAddress(owner: string): Promise<Folder | null> {
  const { rows } = await pool.query('SELECT * FROM folders WHERE owner = $1', [owner]);
  if (!rows[0]) return null;
  return { ...rows[0], templateId: rows[0].template_id, updatedAt: rows[0].updated_at };
}

export async function getFolderByName(name: string): Promise<Folder | null> {
  const { rows } = await pool.query('SELECT * FROM folders WHERE name = $1', [name]);
  if (!rows[0]) return null;
  return { ...rows[0], templateId: rows[0].template_id, updatedAt: rows[0].updated_at };
}

export async function getCredentials(owner: string): Promise<Credential[]> {
  const { rows } = await pool.query(
    'SELECT * FROM credentials WHERE owner = $1 ORDER BY linked_at DESC',
    [owner]
  );
  return rows.map((r) => ({ ...r, proofHash: r.proof_hash, linkedAt: r.linked_at }));
}
