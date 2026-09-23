# ShadowPay — Architecture & Cryptographic Specification

ShadowPay is an institutional-grade, zero-knowledge confidential payroll and revenue-split settlement protocol designed natively for the **Midnight Network** using the **Compact v0.23** smart contract language and **Minokawa zk-SNARK** proving system.

---

## 1. The Core Dilemma: Transparency vs. Trust

Web3 organizations, DAOs, and collectives face a painful compromise:
- **Public Blockchains (Ethereum, Solana, Polygon)**: Every salary, bonus, and split is published publicly. Competitors poach talent, teammates experience salary friction, and high-earning contributors become prime targets for phishing and social engineering.
- **Off-Chain / Web2 Payroll (Gusto, Deel, Wise)**: Relies on centralized intermediaries, opaque spreadsheets, and custodial trust. DAO members cannot verify whether disbursements matched approved treasury governance proposals.

**ShadowPay's Solution**: Confidential on-chain settlement where individual compensation remains 100% shielded, yet mathematically verifiable in zero knowledge:
1. Anyone can verify that **total disbursed equals funded budget**.
2. Anyone can verify that **every contributor received at least their contractual floor**.
3. Anyone can verify that **no contributor was paid twice**.

---

## 2. Dual-State Architecture

Midnight separates execution into two computational tiers:

```
+-------------------------------------------------------------------+
|                        MIDNIGHT PREPROD                           |
|                                                                   |
|   PUBLIC LEDGER STATE                                             |
|   - admin_pk: Bytes<32>                                           |
|   - total_funded_budget: Uint<64>                                 |
|   - total_allocated_amount: Uint<64>                              |
|   - batch_hash: Bytes<32>                                         |
|   - recipient_count: Counter                                      |
|   - claims_count: Counter                                         |
|   - is_settled: Boolean                                           |
|   - spent_nullifiers: Set<Bytes<32>>                              |
+-------------------------------------------------------------------+
                                ^
                                | (Public Inputs + zk-SNARK Proof)
                                |
+-------------------------------------------------------------------+
|                   CLIENT-SIDE PRIVATE STATE                       |
|                   (Contributor & Admin Devices)                   |
|                                                                   |
|   PRIVATE WITNESSES                                               |
|   - get_recipient_secret(): Bytes<32>                             |
|   - get_salary_amount(): Uint<64>                                 |
|   - get_min_committed_amount(): Uint<64>                          |
|   - compute_payout_nullifier(): Bytes<32>                         |
+-------------------------------------------------------------------+
```

---

## 3. Cryptographic Circuits

### Circuit 1: `deposit_payroll_budget`
- **Purpose**: Locks escrow funds and establishes public commitment.
- **Inputs**: `admin: Bytes<32>`, `budget: Uint<64>`, `batchHash: Bytes<32>`.
- **Public Ledger Impact**:
  - `admin_pk = admin`
  - `total_funded_budget = budget`
  - `batch_hash = batchHash`
  - `is_settled = false`

### Circuit 2: `commit_recipient_split`
- **Purpose**: Commits a private salary split while verifying contractual minimum floor and budget boundaries.
- **ZK Constraints**:
  $$\text{salaryAmount} \ge \text{minGuaranteedFloor}$$
  $$\text{total\_allocated\_amount} + \text{salaryAmount} \le \text{total\_funded\_budget}$$
- **Privacy Guarantee**: `salaryAmount` is sealed inside `commitmentHash = Poseidon(secret, salary, address)`. Neither the salary nor the recipient address is published on-chain.

### Circuit 3: `finalize_settlement_batch`
- **Purpose**: Generates a public zk-SNARK proof that cumulative disbursements match the funded escrow budget to the exact wei.
- **ZK Constraint**:
  $$\text{total\_allocated\_amount} == \text{total\_funded\_budget}$$
- **State Transition**: Sets `is_settled = true`. Unlocks claim processing for contributors.

### Circuit 4: `claim_private_payout`
- **Purpose**: Allows a contributor to withdraw their compensation anonymously.
- **Witness Verification**:
  $$\text{verify\_claim\_witness}(\text{secret}, \text{commitmentHash}, \text{claimedAmount}) == \text{true}$$
- **Anti-Double-Claim Nullifier**:
  $$\text{nullifier} = \text{Poseidon}(\text{secret}, \text{batch\_hash})$$
  $$\text{assert}(\text{nullifier} \notin \text{spent\_nullifiers})$$
  $$\text{spent\_nullifiers}.\text{insert}(\text{nullifier})$$

### Circuit 5: `disclose_payroll_audit`
- **Purpose**: Selective disclosure certificate generator.
- **Mechanics**: Recipient or auditor with `auditKey` generates a receipt proving:
  - Personal compensation amount
  - Contractual floor compliance
  - Full batch solvency
  - Zero information leakage regarding other contributors.

---

## 4. Wallet & Proving Engine Integration

- **DApp Connector**: Implements `@midnight-ntwrk/dapp-connector-api` interfacing with the 1AM Browser Wallet.
- **1AM ProofStation**: Offloads computationally intensive zk-SNARK proof generation to zero-gas proving infrastructure, ensuring fast transaction execution in the browser.
- **Explorer Verification**: Preprod contracts are indexed using 0x-prefixed 64-character hex addresses on [preprod.midnightexplorer.com](https://preprod.midnightexplorer.com).
