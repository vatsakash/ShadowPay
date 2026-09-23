# ShadowPay — Video Demo Script & Storyboard (Level 4 MVP)

**Target Video Duration**: 2 minutes 30 seconds  
**Product**: ShadowPay — Confidential Payroll & Revenue-Split Settlement on Midnight  
**Target Audience**: Rise In Judges & Midnight Ecosystem Reviewers

---

## Scene 1: Introduction & The Core Problem (0:00 - 0:35)
- **Visual**: Screen shows the ShadowPay landing page and the tagline: *"Confidential Payroll & Revenue-Split Settlement on Midnight"*.
- **Narrator Audio**:
  > *"Hello Midnight community! Today, I’m excited to present ShadowPay, built for the Level 4 Waxing Gibbous submission of the Midnight Moonshots program.
  > In web3 today, organizations face a painful dilemma: public chains like Ethereum or Solana expose everyone’s salary and revenue splits for the whole world to see, creating jealousy, poaching, and physical targeting risks. But moving off-chain to traditional payroll breaks transparency—nobody can audit whether the treasury disbursed what was voted on.
  > ShadowPay solves this completely using Midnight’s shielded Compact smart contracts. We make payroll verifiable without making it public."*

---

## Scene 2: Admin Workflow & Escrow Funding (0:35 - 1:10)
- **Visual**: Narrator clicks into the **Admin Settlement** tab. Points to the **Escrow Funded Budget** card and executes a `50,000 tNIGHT` deposit.
- **Narrator Audio**:
  > *"Here on the Admin Settlement dashboard, the payer commits a budget—in this case 50,000 tNIGHT—into contract escrow. Notice how the contract publishes only the total budget and batch hash to the public ledger.
  > Next, the admin commits private split rules for contributors like Elena, Marcus, and Aisha.
  > Notice this crucial ZK constraint: each contributor has a contractual minimum floor guarantee. The circuit mathematically enforces that their salary is greater than or equal to their floor, and that the sum of splits cannot exceed the budget.
  > Notice also our shielded mode toggle: individual amounts stay blurred and hidden from external eyes!"*

---

## Scene 3: Finalizing Batch & Verifying ZK Proof (1:10 - 1:35)
- **Visual**: Narrator clicks **Prove & Lock Settlement**. The ZK Prover modal pops up, showing circuit execution in 284ms.
- **Narrator Audio**:
  > *"Once all allocations are made, the admin triggers `finalize_settlement_batch`.
  > A zk-SNARK proof is generated confirming that total paid out exactly matches the funded budget—down to the exact wei. The batch is now locked on Midnight Preprod, and contributors can privately claim their payout."*

---

## Scene 4: Contributor Confidential Claim (1:35 - 2:05)
- **Visual**: Narrator switches to the **Recipient Claim** tab. Selects Elena Rostova. Clicks **Claim Private Payout**.
- **Narrator Audio**:
  > *"Now let's switch to the recipient's perspective. Elena opens the claim portal, connects her 1AM wallet, and provides her private witness secret.
  > The client generates a local zero-knowledge proof proving her entitlement to her commitment leaf.
  > Crucially, our circuit derives a deterministic nullifier: `Poseidon(secret, batchHash)`. Once claimed, the nullifier is stored on-chain, preventing double claims while completely concealing her personal wallet from public observers."*

---

## Scene 5: Selective Disclosure & Explorer Verification (2:05 - 2:30)
- **Visual**: Narrator clicks **Generate Selective Disclosure Tax & Audit Receipt**, shows the sealed certificate, and switches to the **Explorer** tab displaying the verified contract address.
- **Narrator Audio**:
  > *"Finally, what about taxes and auditing? With ShadowPay's selective disclosure circuit, Elena generates a cryptographically signed tax receipt. She can prove to a tax authority that she earned 18,000 tNIGHT and her employer was solvent—without exposing a single co-worker's salary.
  > Our contract is live on Midnight Preprod at `0x8f3c...` and all 10 Vitest tests are passing in CI/CD.
  > ShadowPay delivers the future of private, verifiable payroll on Midnight. Thank you!"*
