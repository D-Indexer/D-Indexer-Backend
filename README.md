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

See [`ai.md`](./ai.md) for the full cross-repo architecture, shared types, and change protocol.

## License

MIT
