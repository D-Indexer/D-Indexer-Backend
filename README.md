# D-Indexer-Backend

[![CI](https://github.com/D-Indexer/D-Indexer-Backend/actions/workflows/ci.yml/badge.svg)](https://github.com/D-Indexer/D-Indexer-Backend/actions/workflows/ci.yml)

⚙️ The core API and indexing engine for Folder. Handles off-chain user data, IPFS uploads, metadata caching, and hooks into the Stellar ledger for seamless template rendering.

## Overview

This service is the off-chain backbone of the Folder platform. It streams Soroban contract events from the Stellar ledger, indexes Folder records into PostgreSQL, pins portfolio files to IPFS, and exposes a REST API consumed by the Folder frontend.

The Stellar ledger is the source of truth — the database is a rebuildable cache.

## Features

- **Ledger Indexer** — streams Soroban contract events every 5 s, persists cursor, upserts on conflict
- **IPFS Integration** — pins portfolio files (images, PDFs) and returns CIDs for on-chain storage
- **REST API** — Folder lookup, template browsing, credential queries, file upload
- **Input Validation** — Zod schemas on all endpoints (Stellar address format, file type/size)
- **Error Handling** — global async error middleware, structured JSON error responses
- **Health Endpoint** — live DB connectivity check + indexer cursor, returns `503` if DB is unreachable

## Project Structure

```
src/
├── server.ts                    # Express entry point
├── types/index.ts               # Shared TypeScript types
├── validation/schemas.ts        # Zod validation schemas
├── middleware/
│   ├── asyncHandler.ts          # Wraps async routes, forwards errors
│   └── errorHandler.ts          # Global Express error handler
├── db/
│   ├── client.ts                # pg Pool singleton
│   └── migrate.ts               # SQL migrations
├── indexer/
│   └── stellar.ts               # Soroban event poller + DB writer
├── services/
│   ├── folder.ts                # Folder + credential DB queries
│   ├── template.ts              # Template DB queries
│   └── ipfs.ts                  # IPFS pin + CID resolution
├── controllers/
│   ├── folder.controller.ts
│   ├── template.controller.ts
│   └── upload.controller.ts
├── routes/
│   ├── folder.routes.ts
│   ├── template.routes.ts
│   ├── upload.routes.ts
│   └── health.routes.ts
└── __tests__/
    ├── folder.service.test.ts
    ├── indexer.test.ts
    └── upload.controller.test.ts
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/folders/:address` | Fetch Folder by Stellar address |
| `GET` | `/folders/name/:name` | Resolve Folder by claimed name |
| `GET` | `/folders/:address/credentials` | List verified credentials |
| `GET` | `/templates` | List all active templates |
| `GET` | `/templates/:id` | Fetch a single template |
| `POST` | `/upload` | Pin file to IPFS, returns `{ cid }` |
| `GET` | `/health` | DB + indexer status |

## Quick Start

```bash
cp .env.example .env      # fill in required values
npm install
npm run db:migrate
npm run dev               # http://localhost:3000
```

## Configuration

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `STELLAR_RPC_URL` | Soroban RPC endpoint |
| `STELLAR_NETWORK_PASSPHRASE` | Stellar network passphrase |
| `FOLDER_CONTRACT_ID` | Deployed Folder contract address |
| `IPFS_API_URL` | IPFS API endpoint for pinning |
| `IPFS_GATEWAY` | Public IPFS gateway for CID resolution |
| `PORT` | HTTP server port (default `3000`) |

## Indexer — Event Interface

The indexer listens for these Soroban contract events:

| Event | Action |
|-------|--------|
| `folder_claimed` | Insert Folder record |
| `folder_updated` | Update CID / template |
| `credential_linked` | Append credential |
| `folder_transferred` | Update owner address |
| `template_registered` | Insert template |
| `template_deprecated` | Mark template inactive |

## Multi-Repo Architecture

This repo is one of three in the Folder organisation:

```
folder-org/
├── Folder-Frontend      # React/Vite — portfolio UI, wallet auth, template browser
├── D-Indexer-Backend    # TypeScript/Node.js — this repo
└── Folder-Contract      # Rust/Soroban — on-chain logic
```

### How the Repos Connect

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React/Vite)                       │
│  Portfolio Editor · Template Browser · Wallet Auth (Passkeys)   │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                D-Indexer-Backend (Node.js)                      │
│  REST API · Soroban Event Indexer · IPFS Client · PostgreSQL    │
└────────────────────────┬────────────────────────────────────────┘
                         │ Stellar SDK (event stream)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Folder-Contract (Soroban / Rust)                   │
│  Folder NFT · Template Registry · Credential Linking · Auth     │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow — Claiming a Folder

```
Frontend (user submits)
  ↓ POST /upload  →  Backend pins files to IPFS  →  returns CID
  ↓ Stellar SDK   →  Contract: claim_folder(owner, name, template_id, cid)
  ↓ Contract emits folder_claimed event on ledger
  ↓ Backend indexer picks up event  →  writes to PostgreSQL
  ↓ GET /folders/:address  →  Frontend displays live profile
```

### Data Flow — Credential Verification

```
Frontend (link credential)
  ↓ POST /folders/:address/credentials
  ↓ Backend stores record, scheduler verifies via GitHub/LinkedIn API
  ↓ Contract: link_credential(owner, platform, proof_hash)
  ↓ Frontend displays verification badge
```

## Shared Types

These are the canonical data shapes across all three repos:

```typescript
interface Folder {
  owner: string;       // Stellar address (G...)
  name: string;        // unique human-readable handle
  cid: string;         // IPFS CID of portfolio content
  templateId: number;  // references Template.id
  updatedAt: Date;
}

interface Credential {
  owner: string;
  platform: string;    // "github" | "linkedin" | "on-chain"
  proofHash: string;
  linkedAt: Date;
}

interface Template {
  id: number;
  metadataCid: string; // IPFS CID of template layout JSON
  deprecated: boolean;
}
```

## Contract Functions Called by This Service

| Function | Purpose |
|----------|---------|
| `claim_folder` | Mint portfolio NFT |
| `update_folder` | Update metadata CID |
| `link_credential` | Link external credential on-chain |
| `transfer_folder` | Transfer Folder NFT to new owner |
| `register_template` | Register new template |

## Database Schema

```sql
CREATE TABLE folders (
  owner       TEXT PRIMARY KEY,
  name        TEXT UNIQUE NOT NULL,
  cid         TEXT NOT NULL,
  template_id INTEGER NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE credentials (
  id         SERIAL PRIMARY KEY,
  owner      TEXT NOT NULL REFERENCES folders(owner),
  platform   TEXT NOT NULL,
  proof_hash TEXT NOT NULL,
  linked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (owner, platform)
);

CREATE TABLE templates (
  id           SERIAL PRIMARY KEY,
  metadata_cid TEXT NOT NULL,
  deprecated   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE indexer_state (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

## Cross-Repo Change Protocol

1. **Contract change** (new event / renamed function) — update `src/indexer/stellar.ts` in this repo in the same PR
2. **API change** (new endpoint / changed response shape) — update the Frontend API client in the same PR
3. **Shared type change** — propagate to all three repos

## Local Development Order

```bash
# 1. Start PostgreSQL
docker run -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:16

# 2. Backend (this repo)
cp .env.example .env   # fill in FOLDER_CONTRACT_ID after step 3
npm install && npm run db:migrate && npm run dev

# 3. Deploy contract to testnet
cd Folder-Contract
soroban contract deploy ...
# copy CONTRACT_ID into .env above and into Folder-Frontend/.env

# 4. Frontend
cd Folder-Frontend
npm install && npm run dev
```

## Environment Variables — All Repos

### D-Indexer-Backend

```
DATABASE_URL=
STELLAR_RPC_URL=
STELLAR_NETWORK_PASSPHRASE=
FOLDER_CONTRACT_ID=
IPFS_API_URL=
IPFS_GATEWAY=
PORT=3000
```

### Folder-Frontend

```
VITE_API_URL=           # this service's base URL
VITE_FOLDER_CONTRACT_ID=
VITE_STELLAR_NETWORK=testnet
VITE_IPFS_GATEWAY=
```

### Folder-Contract

```
NETWORK=testnet
ADMIN_ADDRESS=
```

## Testing

```bash
npm test
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled output |
| `npm test` | Run Jest test suite |
| `npm run db:migrate` | Apply DB migrations |

## Related Repos

| Repo | Description |
|------|-------------|
| `Folder-Frontend` | React UI, wallet auth, template browser |
| `D-Indexer-Backend` | This repo |
| `Folder-Contract` | Soroban smart contracts (Rust) |

## License

MIT
