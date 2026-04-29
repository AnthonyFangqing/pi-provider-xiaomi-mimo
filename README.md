# Pi Provider Extension: Xiaomi MiMo

A [pi](https://github.com/badlogic/pi-mono) provider extension for [Xiaomi MiMo](https://platform.xiaomimimo.com) AI models.

## Setup

### Option A: `/login` (interactive)

```bash
pi -e path/to/pi-provider-xiaomi-mimo
/login xiaomi-mimo
```
Paste your API key when prompted. It will be stored in `~/.pi/agent/auth.json`.

### Option B: Environment variable

```bash
export MIMO_API_KEY=tp-xxxxx   # Token Plan
# export MIMO_API_KEY=sk-xxxxx # pay-as-you-go
pi -e path/to/pi-provider-xiaomi-mimo
```

## Models

| Model | Context | Max Output | Vision | Reasoning | Input $/1M | Output $/1M |
|:------|:--------|:-----------|:------|:----------|:-----------|:------------|
| `mimo-v2.5-pro` | 1M | 128K | — | ✅ | $1.00 | $3.00 |
| `mimo-v2.5` | 1M | 128K | ✅ | ✅ | $0.40 | $2.00 |
| `mimo-v2-pro` | 1M | 128K | — | ✅ | $1.00 | $3.00 |
| `mimo-v2-omni` | 256K | 128K | ✅ | ✅ | $0.40 | $2.00 |
| `mimo-v2-flash` | 256K | 64K | — | ✅ | $0.10 | $0.30 |

Prices are overseas pay-as-you-go ≤256K tier. Cache read is 80% cheaper; cache write is free (limited time).

## Token Plan

The [Token Plan](https://platform.xiaomimimo.com/#/token-plan) is a subscription for AI coding:

| Tier | Price | Monthly Credits | ~Complex Tasks |
|:-----|:------|:----------------|:---------------|
| Lite | $6/mo | 60M | ~120 |
| Standard | $16/mo | 200M | ~400 |
| Pro | $50/mo | 700M | ~1,400 |
| Max | $100/mo | 1,600M | ~3,200 |

**Credit rates** (no context-tier surcharge — 1M context costs the same as 256K):

| Model | Rate |
|:------|:-----|
| V2.5 / V2-Omni / V2-Flash | 1 token = 1 credit |
| V2.5-Pro / V2-Pro | 1 token = 2 credits |
| TTS series | free (limited time) |

> **Key change**: The Token Plan no longer charges extra for the 256K–1M context window tier. Previously this cost 4× credits; now only the model multiplier applies. Pay-as-you-go still doubles pricing for >256K context.

**Off-peak discount**: 0.8× credit consumption daily 00:00–08:00 Beijing Time (4PM–12AM UTC).

**Cache tokens**: The documentation does not explicitly state whether cache-read tokens are discounted in the Token Plan. It appears all input tokens (cache or not) consume credits at the same rate. For pay-as-you-go, cache hits are 80% cheaper.

Token Plan keys (`tp-xxxxx`) and pay-as-you-go keys (`sk-xxxxx`) are independent — do not mix them.

## Configuration

| Variable | Description | Default |
|:---------|:------------|:--------|
| `MIMO_API_KEY` | API key (required) | — |
| `MIMO_BASE_URL` | Override base URL entirely | auto-detected |
| `MIMO_CLUSTER` | Token Plan cluster: `sgp`, `ams`, `cn` | `sgp` |

The base URL is auto-detected from your API key:
- `tp-*` keys → Token Plan cluster URL (pick via `MIMO_CLUSTER`)
- `sk-*` keys → `https://api.xiaomimimo.com/v1`

## License

MIT
