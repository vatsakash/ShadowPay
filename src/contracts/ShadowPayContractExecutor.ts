// Midnight Compact Smart Contract Runtime Executor
// Implements ShadowPayCircuits & ShadowPayLedgerState from managed/index.ts
// Executes the exact zero-knowledge constraints and state transitions defined in contracts/ShadowPay.compact

import {
  ShadowPayCircuits,
  ShadowPayWitnesses,
  ShadowPayLedgerState,
} from '../../managed/index';

export class ShadowPayContractExecutor implements ShadowPayCircuits {
  public ledgerState: ShadowPayLedgerState;
  private witnesses: ShadowPayWitnesses;

  constructor(witnesses: ShadowPayWitnesses) {
    this.witnesses = witnesses;
    this.ledgerState = {
      admin_pk: new Uint8Array(32),
      total_funded_budget: 0n,
      batch_hash: new Uint8Array(32),
      authorized_auditor_hash: new Uint8Array(32),
      recipient_count: 0,
      claims_count: 0,
      is_settled: false,
      commitments: new Map<string, boolean>(),
      spent_nullifiers: new Map<string, boolean>(),
    };
  }

  private bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Circuit 1: deposit_payroll_budget
   * Corresponds to: contracts/ShadowPay.compact -> deposit_payroll_budget
   */
  public async deposit_payroll_budget(
    admin: Uint8Array,
    budget: bigint,
    batchHash: Uint8Array,
    auditorHash: Uint8Array
  ): Promise<void> {
    this.ledgerState.admin_pk = admin;
    this.ledgerState.total_funded_budget = budget;
    this.ledgerState.batch_hash = batchHash;
    this.ledgerState.authorized_auditor_hash = auditorHash;
    this.ledgerState.is_settled = false;
    this.ledgerState.recipient_count = 0;
    this.ledgerState.claims_count = 0;
    this.ledgerState.commitments.clear();
    this.ledgerState.spent_nullifiers.clear();
  }

  /**
   * Circuit 2: commit_recipient_split
   * Corresponds to: contracts/ShadowPay.compact -> commit_recipient_split
   * NOTE: salary is obtained via private witness get_salary_amount() - NEVER a public circuit argument!
   */
  public async commit_recipient_split(
    recipientCommitment: Uint8Array,
    minGuaranteedFloor: bigint
  ): Promise<void> {
    // Constraint A: Settlement batch must still be open
    if (this.ledgerState.is_settled) {
      throw new Error('Settlement batch is already finalized');
    }

    const commitmentHex = this.bytesToHex(recipientCommitment);

    // Constraint B: Commitment cannot be registered twice
    if (this.ledgerState.commitments.get(commitmentHex)) {
      throw new Error('Commitment leaf already registered');
    }

    // Constraint C: Private witnesses for salary and secret
    const salary = this.witnesses.get_salary_amount();
    const secret = this.witnesses.get_recipient_secret();

    // Constraint D: Contractual minimum floor verification
    if (salary < minGuaranteedFloor) {
      throw new Error(
        `Recipient salary (${salary}) is below contractually committed minimum floor (${minGuaranteedFloor})`
      );
    }

    // Constraint E: Verify commitment leaf integrity using private witness
    const isValidCommitment = this.witnesses.verify_claim_witness(
      secret,
      recipientCommitment,
      salary
    );
    if (!isValidCommitment) {
      throw new Error('Commitment leaf does not match private witness credentials');
    }

    // Store verified commitment leaf in on-chain ledger Map
    this.ledgerState.commitments.set(commitmentHex, true);
    this.ledgerState.recipient_count += 1;
  }

  /**
   * Circuit 3: finalize_settlement_batch
   * Corresponds to: contracts/ShadowPay.compact -> finalize_settlement_batch
   */
  public async finalize_settlement_batch(): Promise<void> {
    if (this.ledgerState.is_settled) {
      throw new Error('Settlement batch is already finalized');
    }

    // Total batch allocation is computed across all private leaves via witness
    const totalAllocated = this.witnesses.get_batch_total_allocation();
    if (totalAllocated !== this.ledgerState.total_funded_budget) {
      throw new Error(
        `Sum of private splits (${totalAllocated}) must exactly equal total funded budget (${this.ledgerState.total_funded_budget})`
      );
    }

    this.ledgerState.is_settled = true;
  }

  /**
   * Circuit 4: claim_private_payout
   * Corresponds to: contracts/ShadowPay.compact -> claim_private_payout
   * Enforces persistent on-chain spent_nullifiers Map to prevent double-claims
   */
  public async claim_private_payout(
    recipientCommitment: Uint8Array,
    submittedNullifier: Uint8Array
  ): Promise<void> {
    // Constraint A: Batch must be finalized
    if (!this.ledgerState.is_settled) {
      throw new Error('Settlement batch must be finalized before claims can be processed');
    }

    const nullifierHex = this.bytesToHex(submittedNullifier);

    // Constraint B: Persistent on-chain nullifier check (Double-claim replay protection)
    if (this.ledgerState.spent_nullifiers.get(nullifierHex)) {
      throw new Error('Nullifier already spent: double claim prevented');
    }

    // Constraint C: Verify that the commitment exists in the registry
    const commitmentHex = this.bytesToHex(recipientCommitment);
    if (!this.ledgerState.commitments.get(commitmentHex)) {
      throw new Error('Recipient commitment not found in batch');
    }

    // Constraint D: Private Witness verification
    const secret = this.witnesses.get_recipient_secret();
    const claimedAmount = this.witnesses.get_salary_amount();
    const isValidClaim = this.witnesses.verify_claim_witness(
      secret,
      recipientCommitment,
      claimedAmount
    );
    if (!isValidClaim) {
      throw new Error('Invalid zero-knowledge entitlement witness proof');
    }

    // Constraint E: Anti-double-claim nullifier derivation check
    const expectedNullifier = this.witnesses.compute_payout_nullifier(
      secret,
      this.ledgerState.batch_hash
    );
    if (this.bytesToHex(expectedNullifier) !== nullifierHex) {
      throw new Error('Nullifier mismatch: Invalid proof');
    }

    // Constraint F: Persist spent nullifier on-chain to permanently block replay
    this.ledgerState.spent_nullifiers.set(nullifierHex, true);
    this.ledgerState.claims_count += 1;
  }

  /**
   * Circuit 5: disclose_payroll_audit
   * Corresponds to: contracts/ShadowPay.compact -> disclose_payroll_audit
   * STRICT ACCESS CONTROL: Only authorized auditKey matching authorized_auditor_hash succeeds
   */
  public async disclose_payroll_audit(
    auditKey: Uint8Array
  ): Promise<[boolean, bigint, number]> {
    const isAuthorized = this.witnesses.verify_auditor_key(
      auditKey,
      this.ledgerState.authorized_auditor_hash
    );
    if (!isAuthorized) {
      throw new Error('Unauthorized auditor: invalid audit authorization key');
    }

    const totalAllocated = this.witnesses.get_batch_total_allocation();
    const isConserved = totalAllocated === this.ledgerState.total_funded_budget;

    return [isConserved, this.ledgerState.total_funded_budget, this.ledgerState.recipient_count];
  }
}
