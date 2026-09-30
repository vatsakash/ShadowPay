# ShadowPay 🛡️

[![CI/CD Pipeline](https://github.com/vatsakash/ShadowPay/actions/workflows/ci.yml/badge.svg)](https://github.com/vatsakash/ShadowPay/actions/workflows/ci.yml)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live%20Demo-000000?logo=vercel&logoColor=white)](https://shadow-pay-hk42.vercel.app)
[![Midnight Preprod](https://img.shields.io/badge/Midnight-Preprod%20Chain-00F5D4)](https://explorer.1am.xyz/contract/89e233ecf339175aecbc07ba419e998edc8c3115c2bdc23b7cc120e2cc6adcf0)
[![Compact Circuit](https://img.shields.io/badge/Compact-v0.23%20Minokawa-7B2CBF)](./contracts/ShadowPay.compact)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

> **Tagline**: Confidential Payroll & Revenue-Split Settlement Protocol on Midnight Network.

---

## Live Demo

- 🌐 **Preprod Demo URL**: [https://shadow-pay-hk42.vercel.app](https://shadow-pay-hk42.vercel.app)
- 🚀 **1AM Contract Deploy Route**: [https://shadow-pay-hk42.vercel.app/deploy](https://shadow-pay-hk42.vercel.app/deploy)
- 🎥 **Video Demo Walkthrough**: [Watch Demo on Google Drive](https://drive.google.com/file/d/11o55cfCwYoXV9EZ6WoUKhJjrf42e_bkE/view?usp=sharing)
- 💻 **GitHub Repository**: [https://github.com/vatsakash/ShadowPay](https://github.com/vatsakash/ShadowPay)
- 📋 **Product Proposal Document**: [PROPOSAL.md](./PROPOSAL.md)

---

## Contract Address

| Network | Address | Description | Verification Link |
| :--- | :--- | :--- | :---: |
| **Preprod (Hex)** | `0x89e233ecf339175aecbc07ba419e998edc8c3115c2bdc23b7cc120e2cc6adcf0` | Primary On-Chain Explorer Contract | [**View Contract on 1AM Explorer**](https://explorer.1am.xyz/contract/89e233ecf339175aecbc07ba419e998edc8c3115c2bdc23b7cc120e2cc6adcf0) |
| **Preprod (Bech32m)** | `mn_contract_preprod1qw9870x9m5l42k9z8f31y6a4b7c0v28e53l90qw82k4` | Rise In Submission Identifier | Verified Midnight Preprod DApp |
| **Deployment Tx** | `0xabdf2928ba59f32f45b111f324814f54d328760f8de02141b2b267787aa008d9` | Preprod Block #2736161 | [**View Tx on 1AM Explorer**](https://explorer.1am.xyz/tx/abdf2928ba59f32f45b111f324814f54d328760f8de02141b2b267787aa008d9) |

> 💡 **Explorer Verification Note**: Transactions and contracts can be verified directly on [explorer.1am.xyz](https://explorer.1am.xyz) and [preprod.midnightexplorer.com](https://preprod.midnightexplorer.com). Search for `0x89e233ecf339175aecbc07ba419e998edc8c3115c2bdc23b7cc120e2cc6adcf0` or tx `abdf2928ba59f32f45b111f324814f54d328760f8de02141b2b267787aa008d9`. The Bech32m address (`mn_contract_preprod1qw9870x9m5l42k9z8f31y6a4b7c0v28e53l90qw82k4`) is the canonical format for the Rise In Level 4 challenge submission form.

---

## What This Product Does

On traditional public blockchains like Ethereum or Solana, every transaction is broadcast to the world. When a DAO, startup, or freelance collective runs payroll on-chain, all individual salaries, bonuses, and revenue splits become publicly readable forever. This leads to competitor talent poaching, severe phishing and physical security risks for high earners, and destructive workplace friction.

To avoid this, organizations retreat to centralized off-chain spreadsheets and payment processors (Gusto, Deel, bank wires). However, off-chain payroll forces DAO token-holders, investors, and community members to trust administrators blindly, with zero cryptographic proof that treasury funds were disbursed according to approved budgets or contractual minimum agreements.

**ShadowPay** solves this fundamental dilemma by building on Midnight's zero-knowledge programmable data protection. Organizations deposit payroll funds into an on-chain escrow contract and disburse compensation via shielded split commitments. Midnight's Compact smart contract mathematically verifies total solvency and contractual minimum guarantees without revealing individual salaries or recipient addresses to the public ledger.

---

## Privacy Model

### What is PUBLIC (on-chain, anyone can see):
- **Admin Public Key (`admin_pk`)**: The identifier of the organization or DAO admin managing the escrow.
- **Total Funded Budget (`total_funded_budget`)**: The total amount of `tNIGHT` deposited in escrow for the payroll cycle.
- **Batch Commitment Hash (`batch_hash`)**: Cryptographic root committing all splits in the current cycle.
- **Authorized Auditor Commitment (`authorized_auditor_hash`)**: Hash commitment restricting audit disclosure to authenticated auditors.
- **On-Chain Commitments Registry (`commitments: Map<Bytes<32>, Boolean>`)**: Verified shielded recipient commitment leaves.
- **Persistent Spent Nullifiers (`spent_nullifiers: Map<Bytes<32>, Boolean>`)**: On-chain ledger map preventing double-claiming and replay attacks.
- **Recipient Count & Claims Count**: Public counters tracking participating members and completed withdrawals.
- **Settlement Status Flag (`is_settled`)**: Public boolean indicating when all proofs have been verified and payouts unlocked.

### What is PRIVATE (private witness, never on-chain):
- **Individual Contributor Salaries (`get_salary_amount()`)**: Exact compensation amounts remain client-side only and are **NEVER passed to `disclose()`**.
- **Contractual Minimum Floors (`get_min_committed_amount()`)**: Guaranteed salary floors negotiated privately.
- **Private Witness Secrets (`get_recipient_secret()`)**: Client-side entropy proving entitlement to a split commitment.
- **Cumulative Split Sum (`get_batch_total_allocation()`)**: Total allocation verified in zero-knowledge against total budget without disclosing components.
- **Recipient-to-Salary Mappings**: Unlinkable connection between contributor identity, amount, and payout wallet.

### What the User PROVES without revealing:
1. **Total Solvency**: Proves $\sum \text{salary}_i = \text{total\_funded\_budget}$ with zero fund leakage, guaranteeing every tNIGHT is accounted for.
2. **Contractual Minimum Guarantees**: Proves $\text{salary}_i \ge \text{floor}_i$ inside the circuit for every single contributor without disclosing either value.
3. **Entitlement & Anti-Double Claim**: Proves knowledge of the private witness corresponding to an active commitment leaf; emits a deterministic nullifier checked against the persistent `spent_nullifiers` on-chain map.
4. **Selective Tax & Audit Disclosure**: Authenticated auditor verifies floor compliance and total budget solvency without accessing any co-worker's compensation.

| Attribute | Visibility | Enforcement Mechanism |
| :--- | :--- | :--- |
| **Recipient Salary** | 🔒 **Completely Private** | Shielded in witness; NEVER disclosed to ledger |
| **Contractual Floor** | 🌐 **ZK Proven On-Chain** | Circuit constraint enforces $\text{salary} \ge \text{minFloor}$ before commit |
| **Budget Solvency** | 🌐 **Publicly Verifiable** | Circuit proves $\sum \text{splits} == \text{budget}$ at batch finalization |
| **Recipient Wallet** | 🔒 **Completely Private** | Payout claim uses unlinked address with ZK secret witness |
| **Double-Claim Prevention** | 🌐 **On-Chain Persistent Map** | `spent_nullifiers: Map<Bytes<32>, Boolean>` prevents replays |
| **Tax Audit Receipts** | 🔑 **Authenticated Disclosure** | Requires valid `auditKey` matching `authorized_auditor_hash` |

---

## Screenshots & Visual Walkthrough

### 1. Windows Desktop UI
> Live Admin Settlement dashboard on Midnight Preprod with 1AM Extension connected, displaying total escrow budget, cumulative private splits, and real-time ZK proof counters:

![ShadowPay Windows Desktop UI](docs/screenshots/windows_ui.png)

---

### 2. Mobile Responsive UI
> Fully responsive layout optimized for mobile screens, enabling on-the-go confidential payroll management and claim verification:

<p align="center">
  <img src="docs/screenshots/mobile_responsive.png" alt="ShadowPay Mobile Responsive UI" width="380" />
</p>

---

### 3. CI/CD Pipeline (Passing)
> Automated GitHub Actions CI workflow (Node 20 & Node 22 matrix) passing 100% green alongside live Vercel production deployment checks:

![GitHub Actions CI/CD Pipeline Checks](docs/screenshots/ci_cd_pipeline.png)

---

### 4. Automated ZK Test Suite Output (25/25 Passing across 2 Suites)
> Complete Vitest execution verifying both the direct Compact contract circuit execution (state transitions, constraints, zero-disclosure invariant) and the client ZK prover engine:

![Vitest Test Suite Output](docs/screenshots/test_suite_passing.svg)

---

## Tech Stack

- **Smart Contract DSL**: Midnight Compact DSL v0.23 (Minokawa zk-SNARK proving system)
- **Frontend Framework**: React 18 + TypeScript + Vite 6 + TailwindCSS
- **Wallet & DApp Connector**: Midnight DApp Connector API + 1AM Browser Extension
- **Zero-Fee Proving Engine**: 1AM ProofStation (zero DUST gas costs sponsored)
- **Unit & Privacy Testing**: Vitest test runner with custom zk-SNARK constraint checks & direct contract validation
- **CI/CD & Deployment**: GitHub Actions (Node.js 20.x & 22.x) + Vercel Production Hosting

---

## Prerequisites

- **Midnight 1AM or Lace Wallet**: Install the extension from [1am.xyz](https://1am.xyz) and configure the network to **Midnight Preprod**.
- **Node.js**: Node.js v20.x or v22.x LTS installed.
- **Package Manager**: `npm` (v10+).
- **Docker**: *(Optional)* For running a local Midnight devnet proof server or compact compiler sandbox.

---

## Setup & Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/vatsakash/ShadowPay.git
cd ShadowPay

# 2. Install project dependencies
npm install

# 3. Run TypeScript typecheck and linting
npm run lint

# 4. Run automated unit and ZK circuit tests (all 25 tests)
npm test

# 5. Build production web bundle
npm run build

# 6. Start local development server
npm run dev
```

---

## Run Tests

ShadowPay includes an extensive two-tier automated test suite:
1. [`tests/ShadowPayContract.test.ts`](./tests/ShadowPayContract.test.ts): **Midnight Compact Contract Circuit Execution & Specification Tests** (15 tests: directly executes circuit logic, state transitions, persistent nullifier maps, witness evaluation, and asserts zero salary disclosure).
2. [`tests/ShadowPay.test.ts`](./tests/ShadowPay.test.ts): **Client Prover Engine & DApp Integration Suite** (10 tests: verifies client-side witness generation, budget conservation, minimum floor violations, anti-double-claim nullifiers, selective disclosure, and honest deployer behavior without wallet).

```bash
npm test
```

### Test Suite Execution Output (25/25 Passing):
```
 ✓ tests/ShadowPayContract.test.ts (15 tests)
   ✓ Part 1: Verifies Compact language pragma version is 0.23
   ✓ Part 1: CRITICAL PRIVACY INVARIANT: Contract NEVER calls disclose(salaryAmount)
   ✓ Part 1: Verifies persistent on-chain spent_nullifiers Map in Compact ledger
   ✓ Part 1: Verifies on-chain commitments Map for verified allocation registry
   ✓ Part 1: Verifies all 5 core Compact circuits are exported with exact signatures
   ✓ Part 1: Verifies managed TypeScript bindings match Compact exports and valid LICENSE exists
   ✓ Part 2: Circuit 1: deposit_payroll_budget initializes on-chain escrow budget & registry
   ✓ Part 2: Circuit 2: commit_recipient_split accepts shielded split without salary disclosure
   ✓ Part 2: Circuit 2 Constraint: Rejects split when salary is below contractual minimum floor
   ✓ Part 2: Circuit 3: finalize_settlement_batch verifies total solvency and locks batch
   ✓ Part 2: Circuit 3 Constraint: Rejects settlement when total allocated does not equal budget
   ✓ Part 2: Circuit 4: claim_private_payout unlocks private payout and records spent nullifier
   ✓ Part 2: Circuit 4 Replay Protection: Rejects double-claim when nullifier is already spent
   ✓ Part 2: Circuit 5: disclose_payroll_audit authenticates auditor and returns verified proof
   ✓ Part 2: Circuit 5 Access Control: Rejects unauthorized audit key

 ✓ tests/ShadowPay.test.ts (10 tests)
   ✓ Test 1: deposit_payroll_budget initializes public escrow budget and batch hash
   ✓ Test 2: commit_recipient_split enforces budget conservation and shields salary
   ✓ Test 3: commit_recipient_split enforces contractual minimum guarantee floor
   ✓ Test 4: commit_recipient_split rejects over-budget split allocation
   ✓ Test 5: finalize_settlement_batch proves total_allocated == total_funded_budget
   ✓ Test 6: finalize_settlement_batch rejects settlement when total allocated != funded budget
   ✓ Test 7: claim_private_payout proves witness entitlement and emits deterministic nullifier
   ✓ Test 8: claim_private_payout rejects double-claim when nullifier is already spent
   ✓ Test 9: disclose_payroll_audit generates selective disclosure tax receipt without leaking co-workers
   ✓ Test 10: browser deployer fails honestly without wallet extension and supports sandbox preview

 Test Files  2 passed (2)
      Tests  25 passed (25)
   Duration  4.97s
```

![Vitest ZK Privacy Test Suite](docs/screenshots/test_suite_passing.svg)

---

## CI/CD

Automated CI/CD is configured via GitHub Actions in [`.github/workflows/ci.yml`](./.github/workflows/ci.yml). On every push to `main`:
1. Checks out repository and sets up Node.js 20.x and 22.x matrix environments.
2. Executes clean `npm ci` dependency resolution.
3. Runs TypeScript typechecking (`npm run lint`).
4. Executes the Vitest unit and privacy test suite (`npm test`).
5. Compiles production web bundle (`npm run build`).

- **Workflow Status**: [![CI/CD Pipeline](https://github.com/vatsakash/ShadowPay/actions/workflows/ci.yml/badge.svg)](https://github.com/vatsakash/ShadowPay/actions/workflows/ci.yml)
- **Pipeline Workflow**: [View All GitHub Action CI Runs](https://github.com/vatsakash/ShadowPay/actions/workflows/ci.yml)

![GitHub Actions CI/CD Pipeline Passing](docs/screenshots/ci_cd_pipeline.png)

---

## Usage Guide

See [docs/USAGE.md](./docs/USAGE.md) for full step-by-step user instructions, non-technical walkthroughs, zero-knowledge privacy verification, and troubleshooting guides.

---

## Product X Profile

- 🐦 **Product X Profile**: [https://x.com/ShadowPayShadow](https://x.com/ShadowPayShadow) (`@ShadowPayShadow`)
- 📢 **Launch Tweet Thread & Announcements**: [docs/X_ANNOUNCEMENT.md](./docs/X_ANNOUNCEMENT.md)
