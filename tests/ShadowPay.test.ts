import { describe, it, expect, beforeEach } from 'vitest';
import { ShadowPayEngine } from '../src/midnight/ShadowPaySimulator';
import { BrowserDeployer } from '../src/midnight/browserDeployer';

describe('ShadowPay Compact Smart Contract & ZK Privacy Test Suite', () => {
  let engine: ShadowPayEngine;

  beforeEach(() => {
    engine = ShadowPayEngine.getInstance();
    engine.resetDemoData();
  });

  it('Test 1: deposit_payroll_budget initializes public escrow budget and batch hash', async () => {
    const admin = 'mn_addr_preprod1q9x74a87c0v28e53l90qw82k49z6m31f82y01';
    const budget = 50000n; // 50,000 tNIGHT

    const proofLog = await engine.depositPayrollBudget(admin, budget);
    const ledger = engine.getLedgerState();

    expect(ledger.adminPk).toBe(admin);
    expect(ledger.totalFundedBudget).toBe(budget);
    expect(ledger.totalAllocatedAmount).toBe(0n);
    expect(ledger.recipientCount).toBe(0);
    expect(ledger.isSettled).toBe(false);
    expect(proofLog.circuitName).toBe('deposit_payroll_budget');
    expect(proofLog.status).toBe('verified');
    expect(proofLog.zkProofHash).toContain('0x');
  });

  it('Test 2: commit_recipient_split enforces budget conservation and shields salary', async () => {
    const admin = 'mn_addr_preprod1q9x74a87c0v28e53l90qw82k49z6m31f82y01';
    await engine.depositPayrollBudget(admin, 20000n);

    // Commit 1st recipient
    const { split: split1, proofLog: proof1 } = await engine.commitRecipientSplit(
      'Elena Rostova',
      'Lead Cryptographer',
      'mn_addr_preprod1qelena',
      12000n,
      10000n
    );

    expect(split1.salaryAmount).toBe(12000n);
    expect(split1.commitmentHash).toContain('0x');
    expect(split1.nullifier).toContain('0x');
    expect(proof1.publicInputs.splitConservationVerified).toBe(true);

    // Commit 2nd recipient
    await engine.commitRecipientSplit(
      'Marcus Vance',
      'Core Dev',
      'mn_addr_preprod1qmarcus',
      8000n,
      6000n
    );

    const ledger = engine.getLedgerState();
    expect(ledger.totalAllocatedAmount).toBe(20000n);
    expect(ledger.recipientCount).toBe(2);
  });

  it('Test 3: commit_recipient_split enforces contractual minimum guarantee floor', async () => {
    const admin = 'mn_addr_preprod1q9x74a87c0v28e53l90qw82k49z6m31f82y01';
    await engine.depositPayrollBudget(admin, 30000n);

    // Attempting to pay less than agreed minimum floor MUST fail ZK circuit constraint
    await expect(
      engine.commitRecipientSplit(
        'Junior Dev',
        'Junior Engineer',
        'mn_addr_preprod1qjunior',
        3000n, // Offered salary: 3,000
        5000n  // Committed minimum floor: 5,000 -> VIOLATION
      )
    ).rejects.toThrow('Contractual minimum floor violation');
  });

  it('Test 4: commit_recipient_split rejects over-budget split allocation', async () => {
    const admin = 'mn_addr_preprod1q9x74a87c0v28e53l90qw82k49z6m31f82y01';
    await engine.depositPayrollBudget(admin, 10000n);

    await engine.commitRecipientSplit('Dev A', 'Engineer', 'mn_addr_devA', 7000n, 5000n);

    // Remaining budget is 3000. Attempting to allocate 4000 must fail
    await expect(
      engine.commitRecipientSplit('Dev B', 'Designer', 'mn_addr_devB', 4000n, 2000n)
    ).rejects.toThrow('exceeds remaining budget');
  });

  it('Test 5: finalize_settlement_batch proves total_allocated == total_funded_budget', async () => {
    const admin = 'mn_addr_preprod1q9x74a87c0v28e53l90qw82k49z6m31f82y01';
    await engine.depositPayrollBudget(admin, 15000n);

    await engine.commitRecipientSplit('Dev 1', 'Lead', 'mn_addr_1', 10000n, 8000n);
    await engine.commitRecipientSplit('Dev 2', 'Designer', 'mn_addr_2', 5000n, 4000n);

    const finalizeProof = await engine.finalizeSettlementBatch();

    expect(finalizeProof.circuitName).toBe('finalize_settlement_batch');
    expect(finalizeProof.status).toBe('verified');
    expect(finalizeProof.publicInputs.exactMatchProven).toBe(true);
    expect(engine.getLedgerState().isSettled).toBe(true);
  });

  it('Test 6: finalize_settlement_batch rejects settlement if allocation does not match budget', async () => {
    const admin = 'mn_addr_preprod1q9x74a87c0v28e53l90qw82k49z6m31f82y01';
    await engine.depositPayrollBudget(admin, 20000n);

    // Only allocated 12000 out of 20000
    await engine.commitRecipientSplit('Dev 1', 'Lead', 'mn_addr_1', 12000n, 10000n);

    await expect(engine.finalizeSettlementBatch()).rejects.toThrow(
      'must exactly equal total funded budget'
    );
  });

  it('Test 7: claim_private_payout unlocks compensation and prevents double claims via nullifiers', async () => {
    // Demo data starts pre-settled with 3 contributors
    const splits = engine.getPrivateSplits();
    const targetSplit = splits[0];

    // Initial state: not claimed
    expect(targetSplit.isClaimed).toBe(false);

    // Contributor presents private secret witness to claim payout
    const claimProof = await engine.claimPrivatePayout(targetSplit.id, targetSplit.secretKey);
    expect(claimProof.circuitName).toBe('claim_private_payout');
    expect(claimProof.status).toBe('verified');
    expect(targetSplit.isClaimed).toBe(true);
    expect(engine.getSpentNullifiers()).toContain(targetSplit.nullifier);
    expect(engine.getLedgerState().claimsCount).toBe(1);

    // Attempting to claim a second time MUST be rejected by anti-double-claim nullifier constraint
    await expect(
      engine.claimPrivatePayout(targetSplit.id, targetSplit.secretKey)
    ).rejects.toThrow('already been claimed');
  });

  it('Test 8: claim_private_payout rejects invalid secret witness proof', async () => {
    const splits = engine.getPrivateSplits();
    const targetSplit = splits[1];

    // Impersonator supplies fraudulent secret key
    const forgedSecret = '0xforged_malicious_key_99999999999999999';
    await expect(
      engine.claimPrivatePayout(targetSplit.id, forgedSecret)
    ).rejects.toThrow('Invalid zero-knowledge entitlement witness proof');
  });

  it('Test 9: disclose_payroll_audit generates selective disclosure receipt without leaking co-recipient amounts', () => {
    const splits = engine.getPrivateSplits();
    const elenaSplit = splits[0];

    const auditReceipt = engine.generateSelectiveAuditReceipt(elenaSplit.id, 'TAX_AUDIT_2026');

    expect(auditReceipt.recipientName).toBe('Elena Rostova');
    expect(auditReceipt.verifiedAmount).toBe(18000n);
    expect(auditReceipt.minFloorSatisfied).toBe(true);
    expect(auditReceipt.totalBudgetMatches).toBe(true);
    expect(auditReceipt.zkProofVerificationHash).toContain('0x');
    expect(auditReceipt.anonymizedCoRecipientsCount).toBe(2);

    const globalAudit = engine.generateGlobalAuditReport('GLOBAL_COMPLIANCE_KEY');
    expect(globalAudit.sumEqualsBudget).toBe(true);
    expect(globalAudit.allMinCommitmentsHonored).toBe(true);
    expect(globalAudit.individualSalariesExposed).toBe(false);
  });

  it('Test 10: browser deployer generates valid Midnight Preprod hex and bech32m addresses', async () => {
    const admin = 'mn_addr_preprod1q9x74a87c0v28e53l90qw82k49z6m31f82y01';
    const deployInfo = await BrowserDeployer.deployToPreprod(admin);

    expect(deployInfo.network).toBe('preprod');
    expect(deployInfo.hexAddress).toMatch(/^0x[a-f0-9]{64}$/);
    expect(deployInfo.bech32mAddress).toMatch(/^mn_contract_preprod1[a-z0-9]{38,64}$/);
    expect(deployInfo.txHash).toMatch(/^0x[a-f0-9]{64}$/);
  });
});
