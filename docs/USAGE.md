# How to Use ShadowPay

Welcome to **ShadowPay**, the zero-knowledge confidential payroll and revenue-split settlement protocol built on the Midnight Network.

---

## What You Need

1. **1AM Browser Wallet**: Install the extension from [1am.xyz](https://1am.xyz) and configure the active network to **Midnight Preprod**.
2. **Funded Preprod Account**: Ensure your 1AM wallet has a test balance in `tNIGHT` via the Midnight Preprod Faucet and minor DUST balance for transaction fees.
3. **Web Browser**: Chrome, Brave, Edge, or Firefox with extension support.
4. **Live App URL**: Navigate to [https://shadow-pay-hk42.vercel.app](https://shadow-pay-hk42.vercel.app).

---

## Step-by-Step Guide

### Step 1: Deploy or Connect Contract on Preprod (`/deploy`)
1. Open [`/deploy`](https://shadow-pay-hk42.vercel.app/deploy) or click **Deploy** in the top navigation bar.
2. The application automatically initializes `setNetworkId('preprod')`.
3. Connect your 1AM wallet extension.
4. Click **Deploy ShadowPay Contract to Preprod** to deploy via 1AM ProofStation.
5. If 1AM prompts *"Dust Sponsorship Failed"*, click **[ Pay with My Dust ]** to authorize the network transaction from your DUST balance.
6. Once deployed, verify your **Explorer Hex Address** (`0x89e233ec...`) directly on [1AM Explorer](https://explorer.1am.xyz/contract/89e233ecf339175aecbc07ba419e998edc8c3115c2bdc23b7cc120e2cc6adcf0).

### Step 2: Employer / DAO Admin Deposits Escrow Budget
1. Navigate to the **Admin Settlement** tab.
2. In the **1. Fund Escrow Budget** panel, enter the total payroll disbursement budget in `tNIGHT` (e.g. `50000`).
3. Click **Deposit & Open New Batch (via 1AM)**.
4. The smart contract records the public budget on the Midnight ledger and opens a new settlement cycle.

### Step 3: Commit Confidential Recipient Splits
1. Under **2. Commit Private Split Rule**:
   - Enter contributor details (Name/Pseudonym, Role, Wallet Address).
   - Enter **Confidential Salary Amount** (e.g., `18000 tNIGHT`).
   - Enter **Contractual Minimum Floor Guarantee** (e.g., `15000 tNIGHT`).
2. Click **Commit Shielded Split to Batch**.
3. The local client generates a secret witness and commits a cryptographic leaf without exposing the salary amount.
4. Repeat until the sum of private splits equals 100% of the funded budget.

### Step 4: Finalize & Generate Zero-Knowledge Solvency Proof
1. Once allocations match the funded escrow budget, click **Prove & Lock Settlement**.
2. A zk-SNARK proof is computed proving that $\sum \text{salary}_i == \text{budget}$ and all contractual floors were met.
3. The batch is marked as **Finalized & Proven** on-chain, unlocking private withdrawals.

### Step 5: Contributor Claims Shielded Compensation
1. Navigate to the **Recipient Claim** tab.
2. Connect your recipient 1AM wallet.
3. Select your contributor leaf and click **Claim Private Payout**.
4. The contract verifies your secret witness proof in zero-knowledge and unlocks funds.
5. A deterministic nullifier is recorded on-chain, ensuring you can never double-claim while keeping your identity and salary private.

### Step 6: Generate Selective Disclosure Tax & Audit Receipts
1. Visit the **Audit Receipts** tab.
2. Enter the authorized auditor or compliance key (e.g., `IRS_COMPLIANCE_KEY_2026_Q3`).
3. Generate a cryptographically signed tax certificate verifying your genuine compensation and DAO solvency without exposing co-workers' salaries.

---

## What Gets Proved (and What Stays Private)

### What Gets PROVED in Zero-Knowledge:
- **Total Solvency**: Mathematical proof that $\sum \text{salary}_i = \text{total\_funded\_budget}$ with zero fund leakage.
- **Contractual Floor**: Mathematical proof that $\text{salary}_i \ge \text{floor}_i$ for every recipient without revealing individual amounts.
- **Entitlement Witness**: Proof that the claimant knows the secret witness corresponding to an active commitment leaf.
- **Anti-Double Claim**: Emission of a unique deterministic nullifier preventing duplicate disbursements.

### What Stays PRIVATE (Never Revealed On-Chain):
- **Individual Salary Amounts**: Hidden entirely from public ledgers, competitors, and co-workers.
- **Contractual Minimum Floors**: Confidential agreement between the contributor and the organization.
- **Private Witness Secrets**: Stored exclusively on contributor client devices.
- **Recipient Identities & Wallets**: Payout claims are shielded using zero-knowledge witness verification.

---

## Troubleshooting

- **Q: Why does my split commit fail?**
  - **A**: Ensure your salary amount is greater than or equal to the minimum floor (`salary >= minFloor`) and that the cumulative sum does not exceed the escrow funded budget.

- **Q: What should I do if 1AM says "Dust Sponsorship Failed"?**
  - **A**: Click **[ Pay with My Dust ]** on the 1AM popup. Because your 1AM wallet holds DUST, it will pay the minor transaction fee and broadcast the transaction directly.

- **Q: Can an employee claim twice?**
  - **A**: No. The contract derives a deterministic nullifier `Poseidon(secret, batchHash)`. Once claimed, the nullifier is stored in the on-chain spent set; any duplicate claim is rejected by the circuit.

- **Q: Can other team members see my compensation?**
  - **A**: No. The public ledger only records the total budget and cryptographic commitment hashes. Only you (possessing your secret witness) can inspect and claim your compensation.

- **Q: How do I verify my contract on Midnight Explorer?**
  - **A**: Open [explorer.1am.xyz](https://explorer.1am.xyz) or [preprod.midnightexplorer.com](https://preprod.midnightexplorer.com) and search for the 64-character Hex contract address `0x89e233ecf339175aecbc07ba419e998edc8c3115c2bdc23b7cc120e2cc6adcf0`.
