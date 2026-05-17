import { SorobanRpc, xdr, Address } from '@stellar/stellar-sdk';
import pool from '../db/client';

const rpc = new SorobanRpc.Server(process.env.STELLAR_RPC_URL!);
const CONTRACT_ID = process.env.FOLDER_CONTRACT_ID!;
const CURSOR_KEY = 'indexer_cursor';

/** Decode a Soroban ScVal to a plain string, handling Symbol, Str, and Address types */
function scValToString(raw: string): string {
  const val = xdr.ScVal.fromXDR(raw, 'base64');
  switch (val.switch().name) {
    case 'scvSymbol':
      return val.sym().toString();
    case 'scvString':
      return val.str().toString();
    case 'scvAddress':
      return Address.fromScVal(val).toString();
    case 'scvI128':
    case 'scvU128':
    case 'scvI64':
    case 'scvU64':
    case 'scvU32':
    case 'scvI32':
      return val.value()!.toString();
    default:
      return val.value()?.toString() ?? '';
  }
}

async function getCursor(): Promise<string> {
  const { rows } = await pool.query(
    'SELECT value FROM indexer_state WHERE key = $1',
    [CURSOR_KEY]
  );
  return rows[0]?.value ?? '0';
}

async function saveCursor(cursor: string) {
  await pool.query(
    `INSERT INTO indexer_state (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = $2`,
    [CURSOR_KEY, cursor]
  );
}

async function handleEvent(event: SorobanRpc.Api.RawEventResponse) {
  if (event.contractId !== CONTRACT_ID) return;

  const topics = event.topic.map(scValToString);
  const [eventType, ...args] = topics;

  switch (eventType) {
    case 'folder_claimed':
    case 'folder_updated': {
      const [owner, name, cid, templateId] = args;
      await pool.query(
        `INSERT INTO folders (owner, name, cid, template_id, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (owner) DO UPDATE
           SET name = $2, cid = $3, template_id = $4, updated_at = NOW()`,
        [owner, name, cid, Number(templateId)]
      );
      break;
    }
    case 'credential_linked': {
      const [owner, platform, proofHash] = args;
      await pool.query(
        `INSERT INTO credentials (owner, platform, proof_hash)
         VALUES ($1, $2, $3)
         ON CONFLICT (owner, platform) DO UPDATE SET proof_hash = $3`,
        [owner, platform, proofHash]
      );
      break;
    }
    case 'folder_transferred': {
      const [owner, recipient] = args;
      await pool.query('UPDATE folders SET owner = $2 WHERE owner = $1', [owner, recipient]);
      break;
    }
    case 'template_registered': {
      const [templateId, metadataCid] = args;
      await pool.query(
        `INSERT INTO templates (id, metadata_cid) VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET metadata_cid = $2`,
        [Number(templateId), metadataCid]
      );
      break;
    }
    case 'template_deprecated': {
      const [templateId] = args;
      await pool.query('UPDATE templates SET deprecated = TRUE WHERE id = $1', [Number(templateId)]);
      break;
    }
  }
}

export async function startIndexer() {
  console.log('Indexer started');

  const poll = async () => {
    try {
      const cursor = await getCursor();
      const events = await rpc.getEvents({
        startLedger: Number(cursor) || undefined,
        filters: [{ type: 'contract', contractIds: [CONTRACT_ID] }],
      });

      for (const event of events.events) {
        await handleEvent(event as SorobanRpc.Api.RawEventResponse);
      }

      if (events.events.length > 0) {
        const last = events.events[events.events.length - 1];
        await saveCursor(String(last.ledger + 1));
      }
    } catch (err) {
      console.error('Indexer error:', err);
    }

    setTimeout(poll, 5000);
  };

  poll();
}
