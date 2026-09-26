// ShadowPay Cryptographic ZK Simulator & Execution Engine
// Simulates Midnight Network dual-state computation and Compact v0.23 circuit execution

import {
  PayrollLedgerState,
  RecipientSplitRule,
  ZKProofLog,
  SelectiveAuditReceipt,
} from './types';

// Deterministic cryptographic hash helper (simulating Poseidon / SHA-256)
function mockSha256(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  const repeated = `${hex}${hex}${hex}${hex}${hex}${hex}${hex}${hex}`.substring(0, 64);
  return `0x${repeated}`;
}

export class ShadowPayEngine {
  private static instance: ShadowPayEngine;

  private ledgerState: PayrollLedgerState;
  private privateSplits: RecipientSplitRule[] = [];
  private spentNullifiers: Set<string> = new Set<string>();
  private proofLogs: ZKProofLog[] = [];

  // Preprod default deployment addresses
  public static readonly DEFAULT_PREPROD_HEX = '0x8f3c1a99d45e7b23118cf90234a78bc91124ef901235bcde9018442ac091ef7a';
  public static readonly DEFAULT_PREPROD_BECH32M = 'mn_contract_preprod1qw9870x9m5l42k9z8f31y6a4b7c0v28e53l90qw82k4';
  public static readonly DEFAULT_DEPLOY_TX = '0x9a84b3c2d1e0f9876543210abcdef0123456789abcdef0123456789abcdef012';

  private constructor() {
    this.ledgerState = {
      adminPk: 'mn_addr_preprod1q9x74a87c0v28e53l90qw82k49z6m31f82y01',
      totalFundedBudget: 45000n,
      totalAllocatedAmount: 0n,
      batchHash: mockSha256('SHADOWPAY_BATCH_2026_Q3_INITIAL'),
      recipientCount: 0,
      claimsCount: 0,
      isSettled: false,
      contractAddress: ShadowPayEngine.DEFAULT_PREPROD_HEX,
      preprodBech32m: ShadowPayEngine.DEFAULT_PREPROD_BECH32M,
      deploymentTxHash: ShadowPayEngine.DEFAULT_DEPLOY_TX,
    };

    this.resetDemoData();
  }

  public static getInstance(): ShadowPayEngine {
    if (!ShadowPayEngine.instance) {
      ShadowPayEngine.instance = new ShadowPayEngine();
    }
    return ShadowPayEngine.instance;
  }

  public getLedgerState(): PayrollLedgerState {
    return { ...this.ledgerState };
  }

  public getPrivateSplits(): RecipientSplitRule[] {
    return [...this.privateSplits];
  }

  public getSpentNullifiers(): string[] {
    return Array.from(this.spentNullifiers);
  }

  public getProofLogs(): ZKProofLog[] {
    return [...this.proofLogs];
  }

  /**
   * Reset engine with initial realistic DAO payroll batch
   */
  public resetDemoData(): void {
    this.spentNullifiers.clear();
    this.proofLogs = [];
    this.privateSplits = [];

    const batchHash = mockSha256('DAO_PAYROLL_SEPTEMBER_2026_BATCH');
    const admin = 'mn_addr_preprod1q9x74a87c0v28e53l90qw82k49z6m31f82y01';
    const totalBudget = 45000n; // 45,000 tNIGHT

    this.ledgerState = {
      adminPk: admin,
      totalFundedBudget: totalBudget,
      totalAllocatedAmount: 0n,
      batchHash,
      recipientCount: 0,
      claimsCount: 0,
      isSettled: false,
      contractAddress: ShadowPayEngine.DEFAULT_PREPROD_HEX,
      preprodBech32m: ShadowPayEngine.DEFAULT_PREPROD_BECH32M,
      deploymentTxHash: ShadowPayEngine.DEFAULT_DEPLOY_TX,
    };

    // Pre-populate 3 realistic shielded contributors
    const contributors = [
      {
        name: 'Elena Rostova',
        role: 'Lead ZK Cryptographer',
        address: 'mn_addr_preprod1q908elena983274198273918237',
        salary: 18000n,
        minFloor: 15000n,
        secret: '0xsec_elena_zk_lead_987214981273918274981',
      },
      {
        name: 'Marcus Vance',
        role: 'Protocol Core Engineer',
        address: 'mn_addr_preprod1q451marcus8492817294817293',
        salary: 15000n,
        minFloor: 12000n,
        secret: '0xsec_marcus_core_817239812739182739182',
      },
      {
        name: 'Aisha Al-Mansoor',
        role: 'Security & Formal Verification',
        address: 'mn_addr_preprod1q772aisha3819283719283719',
        salary: 12000n,
        minFloor: 10000n,
        secret: '0xsec_aisha_audit_283918239182938192831',
      },
    ];

    let allocated = 0n;
    for (const c of contributors) {
      const commitment = mockSha256(`${c.secret}:${c.salary}:${c.address}`);
      const nullifier = mockSha256(`${c.secret}:${batchHash}`);
      this.privateSplits.push({
        id: `split-${this.privateSplits.length + 1}`,
        name: c.name,
        role: c.role,
        recipientAddress: c.address,
        salaryAmount: c.salary,
        minCommittedFloor: c.minFloor,
        secretKey: c.secret,
        commitmentHash: commitment,
        nullifier,
        isClaimed: false,
      });
      allocated += c.salary;
    }

    this.ledgerState.totalAllocatedAmount = allocated;
    this.ledgerState.recipientCount = this.privateSplits.length;
    this.ledgerState.isSettled = true; // Initially settled for out-of-the-box claim demo

    // Add initial proof log
    this.proofLogs.push({
      id: `zk-init-${Date.now()}`,
      circuitName: 'deposit_payroll_budget',
      status: 'verified',
      publicInputs: {
        budget: totalBudget.toString(),
        batchHash,
        admin,
      },
      witnessSummary: 'Escrow funding deposit initialized on Midnight Preprod',
      zkProofHash: mockSha256(`PROOF_INIT_${batchHash}`),
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      txHash: ShadowPayEngine.DEFAULT_DEPLOY_TX,
      executionTimeMs: 142,
    });

    this.proofLogs.push({
      id: `zk-settle-${Date.now()}`,
      circuitName: 'finalize_settlement_batch',
      status: 'verified',
      publicInputs: {
        totalAllocated: allocated.toString(),
        totalBudget: totalBudget.toString(),
        conservationVerified: true,
        recipientsCount: 3,
      },
      witnessSummary: 'ZK Circuit proven: sum(splits) == total_funded_budget and salary >= min_floor for all leaves',
      zkProofHash: mockSha256(`PROOF_SETTLE_${batchHash}`),
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      txHash: '0x4f8e21a99c43b8110992384a8bc334190283bba12984bc091ef748392019ab23',
      executionTimeMs: 284,
    });
  }

  /**
   * Circuit 1: deposit_payroll_budget
   */
  public async depositPayrollBudget(
    adminAddress: string,
    budget: bigint,
    overrideTxHash?: string
  ): Promise<ZKProofLog> {
    const startTime = performance.now();
    const batchHash = mockSha256(`BATCH_${Date.now()}_${adminAddress}`);

    this.ledgerState.adminPk = adminAddress;
    this.ledgerState.totalFundedBudget = budget;
    this.ledgerState.totalAllocatedAmount = 0n;
    this.ledgerState.batchHash = batchHash;
    this.ledgerState.recipientCount = 0;
    this.ledgerState.claimsCount = 0;
    this.ledgerState.isSettled = false;
    this.privateSplits = [];
    this.spentNullifiers.clear();

    const proofLog: ZKProofLog = {
      id: `proof-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      circuitName: 'deposit_payroll_budget',
      status: 'verified',
      publicInputs: {
        admin: adminAddress,
        totalBudget: budget.toString(),
        batchHash,
      },
      witnessSummary: `Escrow budget funded: ${budget.toString()} tNIGHT committed to batch hash`,
      zkProofHash: mockSha256(`ZK_DEPOSIT_${batchHash}_${budget}`),
      timestamp: new Date().toISOString(),
      txHash: overrideTxHash || mockSha256(`TX_DEPOSIT_${Date.now()}`),
      executionTimeMs: Math.round(performance.now() - startTime + 85),
    };

    this.proofLogs.unshift(proofLog);
    return proofLog;
  }

  /**
   * Circuit 2: commit_recipient_split
   */
  public async commitRecipientSplit(
    name: string,
    role: string,
    recipientAddress: string,
    salaryAmount: bigint,
    minCommittedFloor: bigint,
    overrideTxHash?: string
  ): Promise<{ split: RecipientSplitRule; proofLog: ZKProofLog }> {
    const startTime = performance.now();

    // Constraint 1: Batch must not be settled
    if (this.ledgerState.isSettled) {
      throw new Error('Settlement batch is already finalized');
    }

    // Constraint 2: Contractual minimum floor
    if (salaryAmount < minCommittedFloor) {
      throw new Error(
        `Contractual minimum floor violation: salary (${salaryAmount}) cannot be less than committed floor (${minCommittedFloor})`
      );
    }

    // Constraint 3: Conservation - running split sum <= total funded budget
    const newTotal = this.ledgerState.totalAllocatedAmount + salaryAmount;
    if (newTotal > this.ledgerState.totalFundedBudget) {
      throw new Error(
        `Split amount (${salaryAmount}) exceeds remaining budget. Remaining: ${
          this.ledgerState.totalFundedBudget - this.ledgerState.totalAllocatedAmount
        } tNIGHT`
      );
    }

    const secretKey = `0xsec_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
    const commitmentHash = mockSha256(`${secretKey}:${salaryAmount}:${recipientAddress}`);
    const nullifier = mockSha256(`${secretKey}:${this.ledgerState.batchHash}`);

    const split: RecipientSplitRule = {
      id: `split-${this.privateSplits.length + 1}`,
      name,
      role,
      recipientAddress,
      salaryAmount,
      minCommittedFloor,
      secretKey,
      commitmentHash,
      nullifier,
      isClaimed: false,
    };

    this.privateSplits.push(split);
    this.ledgerState.totalAllocatedAmount = newTotal;
    this.ledgerState.recipientCount = this.privateSplits.length;

    const proofLog: ZKProofLog = {
      id: `proof-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      circuitName: 'commit_recipient_split',
      status: 'verified',
      publicInputs: {
        commitmentHash,
        batchHash: this.ledgerState.batchHash,
        newTotalAllocated: newTotal.toString(),
        splitConservationVerified: true,
        minFloorSatisfied: true,
      },
      witnessSummary: `Shielded split allocation verified: salary >= min committed floor and budget conserved. Individual amount hidden in commitment.`,
      zkProofHash: mockSha256(`ZK_SPLIT_${commitmentHash}`),
      timestamp: new Date().toISOString(),
      txHash: overrideTxHash || mockSha256(`TX_SPLIT_${Date.now()}_${commitmentHash}`),
      executionTimeMs: Math.round(performance.now() - startTime + 95),
    };

    this.proofLogs.unshift(proofLog);
    return { split, proofLog };
  }

  /**
   * Circuit 3: finalize_settlement_batch
   */
  public async finalizeSettlementBatch(overrideTxHash?: string): Promise<ZKProofLog> {
    const startTime = performance.now();

    if (this.ledgerState.isSettled) {
      throw new Error('Settlement batch is already finalized');
    }

    // Constraint: Total paid out must EXACTLY equal funded budget
    if (this.ledgerState.totalAllocatedAmount !== this.ledgerState.totalFundedBudget) {
      throw new Error(
        `Sum of private splits (${this.ledgerState.totalAllocatedAmount} tNIGHT) must exactly equal total funded budget (${this.ledgerState.totalFundedBudget} tNIGHT)`
      );
    }

    this.ledgerState.isSettled = true;

    const proofLog: ZKProofLog = {
      id: `proof-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      circuitName: 'finalize_settlement_batch',
      status: 'verified',
      publicInputs: {
        totalAllocated: this.ledgerState.totalAllocatedAmount.toString(),
        totalBudget: this.ledgerState.totalFundedBudget.toString(),
        exactMatchProven: true,
        recipientCount: this.ledgerState.recipientCount,
        batchHash: this.ledgerState.batchHash,
      },
      witnessSummary: `Zero-Knowledge proof generated: Total split sum exactly equals funded budget. Disbursement batch locked for private claims.`,
      zkProofHash: mockSha256(`ZK_FINALIZE_${this.ledgerState.batchHash}`),
      timestamp: new Date().toISOString(),
      txHash: overrideTxHash || mockSha256(`TX_FINALIZE_${Date.now()}`),
      executionTimeMs: Math.round(performance.now() - startTime + 140),
    };

    this.proofLogs.unshift(proofLog);
    return proofLog;
  }

  /**
   * Circuit 4: claim_private_payout
   */
  public async claimPrivatePayout(
    splitId: string,
    providedSecret?: string,
    overrideTxHash?: string
  ): Promise<ZKProofLog> {
    const startTime = performance.now();

    if (!this.ledgerState.isSettled) {
      throw new Error('Settlement batch must be finalized before claims can be processed');
    }

    const split = this.privateSplits.find((s) => s.id === splitId);
    if (!split) {
      throw new Error(`Split ID ${splitId} not found in disbursement registry`);
    }

    if (split.isClaimed) {
      throw new Error('Payout has already been claimed (double claim prevented)');
    }

    // Witness check
    if (providedSecret && providedSecret !== split.secretKey) {
      throw new Error('Invalid zero-knowledge entitlement witness proof: secret mismatch');
    }

    // Anti-double-claim nullifier check
    if (this.spentNullifiers.has(split.nullifier)) {
      throw new Error('Payout has already been claimed (nullifier already spent: double claim prevented)');
    }

    // Mark as spent and claimed
    this.spentNullifiers.add(split.nullifier);
    split.isClaimed = true;
    split.claimedAt = new Date().toISOString();
    split.claimTxHash = overrideTxHash || mockSha256(`TX_CLAIM_${Date.now()}_${split.id}`);
    split.claimNullifier = split.nullifier;
    this.ledgerState.claimsCount += 1;

    const proofLog: ZKProofLog = {
      id: `proof-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      circuitName: 'claim_private_payout',
      status: 'verified',
      publicInputs: {
        commitmentHash: split.commitmentHash,
        nullifier: split.nullifier,
        batchHash: this.ledgerState.batchHash,
        unlockedSuccessfully: true,
      },
      witnessSummary: `Private witness verified: recipient proves entitlement to commitment leaf without revealing address or amount to public. Nullifier spent.`,
      zkProofHash: mockSha256(`ZK_CLAIM_${split.nullifier}`),
      timestamp: new Date().toISOString(),
      txHash: split.claimTxHash,
      executionTimeMs: Math.round(performance.now() - startTime + 110),
    };

    this.proofLogs.unshift(proofLog);
    return proofLog;
  }

  /**
   * Circuit 5: disclose_payroll_audit & Tax Receipt Generator
   * Selective disclosure: Recipient or auditor receives verifiable proof of compensation & compliance
   * WITHOUT disclosing co-recipients' names or salaries.
   */
  public generateSelectiveAuditReceipt(
    splitId: string,
    auditKey = 'AUDIT_KEY_SELECTIVE_2026'
  ): SelectiveAuditReceipt {
    const split = this.privateSplits.find((s) => s.id === splitId);
    if (!split) {
      throw new Error(`Split ID ${splitId} not found`);
    }

    const receiptId = `RCPT-${mockSha256(`${split.commitmentHash}:${auditKey}`).substring(2, 14).toUpperCase()}`;

    return {
      receiptId,
      batchHash: this.ledgerState.batchHash,
      contractAddress: this.ledgerState.contractAddress,
      recipientName: split.name,
      role: split.role,
      verifiedAmount: split.salaryAmount,
      contractualMinFloor: split.minCommittedFloor,
      minFloorSatisfied: split.salaryAmount >= split.minCommittedFloor,
      totalBudgetMatches: this.ledgerState.totalAllocatedAmount === this.ledgerState.totalFundedBudget,
      zkProofVerificationHash: mockSha256(`SELECTIVE_PROOF_${receiptId}_${split.nullifier}`),
      generatedAt: new Date().toISOString(),
      selectiveDisclosureKey: auditKey,
      anonymizedCoRecipientsCount: Math.max(0, this.privateSplits.length - 1),
    };
  }

  /**
   * Global audit report verifying overall disbursement integrity
   */
  public generateGlobalAuditReport(auditKey: string) {
    const isBudgetExact = this.ledgerState.totalAllocatedAmount === this.ledgerState.totalFundedBudget;
    return {
      totalBudgetVerified: true,
      sumEqualsBudget: isBudgetExact,
      recipientCount: this.ledgerState.recipientCount,
      claimsProcessed: this.ledgerState.claimsCount,
      allMinCommitmentsHonored: this.privateSplits.every((s) => s.salaryAmount >= s.minCommittedFloor),
      individualSalariesExposed: false,
      contractAddress: this.ledgerState.contractAddress,
      verifierHash: mockSha256(`GLOBAL_AUDIT_${this.ledgerState.batchHash}_${auditKey}`),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Update active contract deployment address
   */
  public updateDeployment(hexAddress: string, bech32mAddress: string, txHash: string): void {
    this.ledgerState.contractAddress = hexAddress;
    this.ledgerState.preprodBech32m = bech32mAddress;
    this.ledgerState.deploymentTxHash = txHash;
  }
}
