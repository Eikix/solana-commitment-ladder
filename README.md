# solana-commitment-ladder

Tiny frontend-only “Solana Commitment Ladder” that visualizes:

- processed / confirmed / finalized slot heads (real time)
- gaps between processed↔confirmed and processed↔finalized
- epoch info (epoch / slotIndex / slotsInEpoch)

## No secrets

- No secrets required.
- Default network is **Devnet**:
  - HTTP: `https://api.devnet.solana.com`
  - WS: `wss://api.devnet.solana.com`
- Custom RPC URLs are configurable in the UI and stored in `localStorage` (non-secret config).

## Run locally

```bash
npm install
npm run dev
```

Open the app and (optionally) change the HTTP + WS URLs in the top panel.

## Data strategy (cheap RPC)

- processed: WebSocket `slotSubscribe` (with polling fallback)
- confirmed/finalized: `getSlot` polling (~850ms, with backoff on errors)
- epoch: `getEpochInfo` polling (~25s)
- history: ring buffer (~600 samples) rendered as a 3-lane step chart (SVG)

## Repo guardrails

This repo uses `pre-commit` with pre-commit + pre-push hooks. After cloning:

```bash
pre-commit install --hook-type pre-commit --hook-type pre-push
```

CI runs on GitHub Actions for pushes + PRs (`npm ci`, `npm run build`, plus lint/typecheck/test when present).
