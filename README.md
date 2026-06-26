# n8n-nodes-scorechain

This is an n8n community node for the [Scorechain](https://scorechain.com) Risk Scoring API.

It lets you analyse crypto addresses and transactions directly from your n8n workflows — no manual HTTP configuration needed.

## Features

- Risk scoring analysis for addresses, transactions, and wallets
- Supports 20+ blockchains (Bitcoin, Ethereum, Solana, Tron, and more)
- Optional filters: coin/token, depth, date range, grouping
- Returns the full Scorechain JSON response as node output

## Supported Operations

| Operation | Endpoint |
|---|---|
| Risk Scoring — Single Chain | `POST /scoringAnalysis` |

## Credentials

You need a Scorechain API key. Generate one at [app.scorechain.com/profile/api-keys](https://app.scorechain.com/profile/api-keys).

In n8n, create a new **Scorechain API** credential and paste your key.

## Supported Blockchains

ALGORAND, ARBITRUMONE, AVALANCHE, BASE, BITCOIN, BITCOINCASH, BLAST, BSC, CARDANO, DASH, DOGECOIN, ETHEREUM, INK, LITECOIN, MANTLE, OPTIMISM, POLYGON, RIPPLE, SOLANA, STELLAR, TEZOS, TON, TRON

## Use with AI Agents (optional)

This node can be used as a **tool** by n8n AI Agent nodes, letting an LLM decide
when to run a risk-scoring analysis and fill in the parameters itself.

This is **disabled by default**. Because it is a community node, the instance
operator must explicitly opt in by setting the environment variable:

```
N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true
```

Until that variable is set, the node behaves as a normal node and is not exposed
to AI Agents.

> ⚠️ This is a compliance/AML tool. When exposed to an agent, both the inputs
> (addresses, transaction hashes) and the scoring results pass through the
> connected LLM provider, and scoring calls count against your API quota.
> Enable it only when you understand those implications.

## License

MIT
