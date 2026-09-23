# ShadowPay — User & Administrator Usage Guide

Welcome to **ShadowPay**, the zero-knowledge confidential payroll and revenue-split settlement protocol built on the Midnight Network.

---

## Prerequisites

1. **1AM Browser Wallet**: Install the extension from [1am.xyz](https://1am.xyz) and configure the active network to **Midnight Preprod**.
2. **Funded Preprod Account**: Ensure your 1AM wallet has a test balance in `tNIGHT` via the Midnight Preprod Faucet.
3. **Web Browser**: Chrome, Brave, Edge, or Firefox with extension support.

---

## 1. Employer / DAO Administrator Workflow

### Step 1: Deposit Funding Budget into Escrow
1. Navigate to the **Admin Settlement** tab.
2. In the **1. Fund Escrow Budget** panel, enter the total payroll/disbursement amount in `tNIGHT` (e.g. `50000`).
3. Click **Deposit & Open New Batch**.
4. The contract initializes a new batch commitment hash and records the total budget on the public ledger.

### Step 2: Commit Shielded Contributor Splits
1. In the **2. Commit Private Split Rule** section:
   - Enter the contributor's pseudonym or name (e.g., `Elena Rostova`).
   - Enter their role (e.g., `Lead ZK Cryptographer`).
   - Enter their Midnight Preprod wallet address (`mn_addr_preprod1q...`).
   - Enter their **Confidential Salary Amount** (e.g., `18000 tNIGHT`).
   - Enter their **Contractual Minimum Floor Guarantee** (e.g., `15000 tNIGHT`).
2. Click **Commit Shielded Split to Batch**.
3. The local client generates:
   - A cryptographic secret key `0xsec_...`
   - A commitment leaf hash `0x...`
   - A deterministic nullifier `0x...`
4. The ZK circuit checks that:
   - `salaryAmount >= minGuaranteedFloor`
   - `cumulativeTotal + salaryAmount <= totalFundedBudget`
5. Repeat for all contributors until the cumulative split exactly equals the funded budget.

### Step 3: Finalize & Prove Settlement
1. Once the sum of splits equals 100% of the funded budget, the **Prove & Lock Settlement** button turns active.
2. Click **Prove & Lock Settlement**.
3. A zk-SNARK proof is generated confirming exact budget conservation without revealing individual compensation figures.
4. The batch is marked as **Finalized & Proven** on Midnight Preprod, unlocking claims for recipients.

---

## 2. Contributor / Recipient Workflow

### Step 1: Connect 1AM Wallet
1. Open the **Recipient Claim** tab.
2. Connect your 1AM browser wallet to identify your Preprod account.

### Step 2: Select Your Contributor Leaf
1. Select your name or profile from the left registry panel.
2. Review your cryptographic entitlement details:
   - Verified Contractual Minimum Floor: `≥ 15,000 tNIGHT`
   - Anti-double-claim nullifier hash
   - On-chain commitment hash

### Step 3: Unlock Confidential Payout
1. Click **Claim Private Payout**.
2. Your client generates a local zero-knowledge witness proof matching the commitment.
3. The transaction is submitted to Midnight Preprod:
   - The contract verifies the witness proof in zero-knowledge.
   - The nullifier is recorded in the spent set to prevent duplicate claims.
   - Payout is credited to your wallet without revealing your identity or amount on public explorers.

---

## 3. Selective Disclosure & Tax Receipts

### Generating a Selective Compliance Certificate
1. After claiming, click **Generate Selective Disclosure Tax & Audit Receipt** (or visit the **Audit Receipts** tab).
2. Enter the authorized auditor key (e.g., `IRS_COMPLIANCE_KEY_2026_Q3`).
3. ShadowPay produces a cryptographically sealed receipt displaying:
   - Your verified compensation amount
   - Verification that your contractual floor was satisfied
   - Proof that total DAO disbursements matched the funded budget
   - Anonymization stamp certifying that co-workers' salaries remain completely concealed.
4. Click **Export Receipt** to copy the verifiable JSON payload or print the certificate for tax authorities.

---

## 4. Troubleshooting & FAQ

- **Q: Why does my split commit fail?**
  - **A**: Ensure your salary amount is greater than or equal to the minimum floor (`salary >= minFloor`) and that the cumulative sum does not exceed the escrow funded budget.
- **Q: Can an employee claim twice?**
  - **A**: No. The contract derives a deterministic nullifier `Poseidon(secret, batchHash)`. Once claimed, the nullifier is stored on-chain; any duplicate claim is rejected by the circuit.
- **Q: Can other team members see my salary?**
  - **A**: No. The on-chain ledger only records the total budget and commitment hashes. Only you (possessing your secret witness) can view and claim your split.
