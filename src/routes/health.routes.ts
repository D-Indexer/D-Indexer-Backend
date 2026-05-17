import { Router } from 'express';
import pool from '../db/client';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    // DB check
    let dbOk = false;
    try {
      await pool.query('SELECT 1');
      dbOk = true;
    } catch {
      dbOk = false;
    }

    // Indexer lag: compare stored cursor ledger against current time
    let indexerCursor: string | null = null;
    try {
      const { rows } = await pool.query(
        "SELECT value FROM indexer_state WHERE key = 'indexer_cursor'"
      );
      indexerCursor = rows[0]?.value ?? null;
    } catch {
      // db already failed
    }

    const status = dbOk ? 'ok' : 'degraded';
    res.status(dbOk ? 200 : 503).json({
      status,
      db: dbOk ? 'ok' : 'unreachable',
      indexer: { cursor: indexerCursor },
    });
  })
);

export default router;
