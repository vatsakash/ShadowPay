# Product Proposal: ShadowPay — Confidential Payroll & Revenue-Split Settlement on Midnight

## 1. Executive Summary
**ShadowPay** is an institutional zero-knowledge confidential payroll and revenue-split settlement protocol designed for web3 organizations, DAOs, and freelance collectives. Built on the **Midnight Network** using the **Compact v0.23 / Minokawa zk-SNARK** smart contract architecture, ShadowPay enables organizations to disburse funds on-chain where individual compensation amounts and recipient mappings remain shielded, while providing public mathematical certainty that:
1. **Total Solvency**: Total disbursements exactly equal the funded escrow budget.
2. **Contractual Minimum Guarantees**: Every contributor receives at least their contractually agreed minimum floor.
3. **Anti-Double Disbursement**: Nullifiers ensure no contributor is paid twice.
4. **Selective Disclosure**: Contributors receive cryptographic tax and audit receipts they can selectively disclose to auditors or revenue authorities.

- 🌐 **Live Demo (Preprod Web App)**: [https://shadow-pay-hk42.vercel.app](https://shadow-pay-hk42.vercel.app)
- 🐦 **Product X Profile**: [@ShadowPayHQ](https://x.com/ShadowPayHQ)
- 🎥 **Video Demo Walkthrough**: [Watch Demo on Google Drive](https://drive.google.com/file/d/1EtDqa7OfEIXpTFXmZ51Ci7fefmtJVmuZ/view?usp=sharing)
- 💻 **GitHub Repository**: [https://github.com/vatsakash/ShadowPay](https://github.com/vatsakash/ShadowPay)
- 📜 **Midnight Preprod Contract**: `0x89e233ecf339175aecbc07ba419e998edc8c3115c2bdc23b7cc120e2cc6adcf0` ([1AM Explorer](https://explorer.1am.xyz/contract/89e233ecf339175aecbc07ba419e998edc8c3115c2bdc23b7cc120e2cc6adcf0))
- ⛓️ **Deployment Transaction**: `0xabdf2928ba59f32f45b111f324814f54d328760f8de02141b2b267787aa008d9` ([1AM Explorer](https://explorer.1am.xyz/tx/abdf2928ba59f32f45b111f324814f54d328760f8de02141b2b267787aa008d9))
- 🏷️ **BIP-350 Bech32m Address**: `mn_contract_preprod1383r8m8n8yt44m9uq7ayr85e3mwgcvg4c27uywmucysw9nr2mncqnd9teu`

---

## 2. The Problem
Current payroll systems force organizations into an untenable choice:
- **Public Blockchains (Ethereum, Solana, Polygon)**:
  - All salaries, bonuses, and split ratios are broadcast publicly.
  - Competitors can easily inspect and poach top talent.
  - High-earning team members become immediate targets for phishing, SIM swapping, and physical extortion.
  - Workplace morale is damaged by public gossip over compensation disparities.
- **Off-Chain / Traditional Payroll (Gusto, Deel, Wise)**:
  - Requires centralized intermediaries and custodial trust.
  - DAO token-holders cannot cryptographically audit whether disbursements match treasury governance votes.
  - Cross-border settlement friction, multi-day bank delays, and high wire fees.

---

## 3. The ShadowPay Solution
ShadowPay leverages Midnight's dual-state computation (Public Ledger State + Client-Side Private Witness Execution):
- **On-Chain Public State**: Only records the total funded budget, cryptographic batch commitment hash, and verified proof flags.
- **Client-Side Private State**: Individual split amounts, contributor identities, and secret witness keys remain exclusively on the contributor's and admin's devices.
- **zk-SNARK Constraints**: The Compact v0.23 circuit proves budget conservation ($\sum \text{salary}_i = \text{budget}$) and contractual floor guarantees ($\text{salary}_i \ge \text{floor}_i$) before any funds can be unlocked.
- **Deterministic Nullifiers**: Prevent double-claiming without disclosing contributor identities.
- **Selective Disclosure**: Tax authorities and auditors can verify compliance without de-anonymizing co-workers.

---

## 4. MVP Scope (Level 4 Deliverable)
- **Compact Smart Contract**: `ShadowPay.compact` deployed on Midnight Preprod with 5 complete circuits (`deposit_payroll_budget`, `commit_recipient_split`, `finalize_settlement_batch`, `claim_private_payout`, `disclose_payroll_audit`).
- **1AM Extension & Simulator Integration**: Full support for Midnight DApp Connector API and in-browser deployment.
- **DAO Payroll Dashboard**: Interactive interface featuring shielded mode (blurred amounts), real-time ZK proof inspector, recipient claim portal, and selective disclosure tax receipt generator.
- **Automated Test Suite**: 10 passing unit and ZK circuit constraint tests in Vitest.
- **Production CI/CD**: GitHub Actions matrix workflow running Node.js 20.x & 22.x.

---

## 5. Target Audience & Market Opportunity
1. **Decentralized Autonomous Organizations (DAOs)**: Treasuries disbursing contributor grants, governance rewards, and core-team salaries.
2. **Web3 Companies & Venture Studios**: Preserving employee compensation confidentiality while staying on-chain.
3. **Freelance Collectives & Creator Guilds**: Splitting client project milestones according to private agreements.
4. **Bounty & Bug Bounty Programs**: Paying ethical hackers and researchers without exposing their financial footprint.

---

## 6. Roadmap
- **Level 4 (Waxing Gibbous - Current)**: Live MVP on Midnight Preprod, Compact contract, 1AM wallet connector, selective disclosure receipts, CI/CD pipeline, and public X profile.
- **Level 5 (Full Moon)**: Multi-token shielded asset support (shielded tDUST and custom ZK tokens), automated batch streaming, and timelocked recurring payroll contracts.
- **Level 6 (Supermoon / Mainnet)**: Enterprise HRIS integrations (BambooHR, Deel API adapters), multi-sig governance approval circuits, and mobile native 1AM support.
