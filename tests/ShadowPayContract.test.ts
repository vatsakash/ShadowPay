import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { ShadowPayContractExecutor } from '../src/contracts/ShadowPayContractExecutor';
import { ShadowPayWitnesses } from '../managed/index';

describe('Midnight Compact Smart Contract & Circuit Execution Suite', () => {
  const contractPath = path.resolve(__dirname, '../contracts/ShadowPay.compact');
  const managedPath = path.resolve(__dirname, '../managed/index.ts');
  const licensePath = path.resolve(__dirname, '../LICENSE');

  const contractSource = fs.readFileSync(contractPath, 'utf8');

  // -------------------------------------------------------------
  // PART 1: Source & AST Verification of contracts/ShadowPay.compact
  // -------------------------------------------------------------
  describe('Part 1: Compact DSL Source & Privacy Invariants', () => {
    it('Verifies Compact language pragma version is 0.23', () => {
      expect(contractSource).toMatch(/pragma\s+language_version\s+0\.23;/);
    });

    it('CRITICAL PRIVACY INVARIANT: Contract NEVER calls disclose(salaryAmount)', () => {
      // Assert salary is NEVER disclosed on the public ledger
      expect(contractSource).not.toMatch(/disclose\s*\(\s*salaryAmount\s*\)/);
      expect(contractSource).not.toMatch(/disclose\s*\(\s*salary\s*\)/);

      // Assert salary is treated as a private witness
      expect(contractSource).toMatch(/witness\s+get_salary_amount\s*\(\s*\)\s*:\s*Uint<64>;/);
    });

    it('Verifies persistent on-chain spent_nullifiers Map in Compact ledger', () => {
      expect(contractSource).toMatch(/export\s+ledger\s+spent_nullifiers\s*:\s*Map<Bytes<32>,\s*Boolean>;/);
      expect(contractSource).toMatch(/!spent_nullifiers\.member\s*\(\s*disclose\s*\(\s*submittedNullifier\s*\)\s*\)/);
      expect(contractSource).toMatch(/spent_nullifiers\.insert\s*\(\s*disclose\s*\(\s*submittedNullifier\s*\),\s*true\s*\);/);
    });

    it('Verifies on-chain commitments Map for verified allocation registry', () => {
      expect(contractSource).toMatch(/export\s+ledger\s+commitments\s*:\s*Map<Bytes<32>,\s*Boolean>;/);
      expect(contractSource).toMatch(/commitments\.insert\s*\(\s*disclose\s*\(\s*recipientCommitment\s*\),\s*true\s*\);/);
    });

    it('Verifies all 5 core Compact circuits are exported with exact signatures', () => {
      expect(contractSource).toMatch(/export\s+circuit\s+deposit_payroll_budget\s*\(/);
      expect(contractSource).toMatch(/export\s+circuit\s+commit_recipient_split\s*\(\s*recipientCommitment:\s*Bytes<32>,\s*minGuaranteedFloor:\s*Uint<64>\s*\)/);
      expect(contractSource).toMatch(/export\s+circuit\s+finalize_settlement_batch\s*\(\s*\)/);
      expect(contractSource).toMatch(/export\s+circuit\s+claim_private_payout\s*\(\s*recipientCommitment:\s*Bytes<32>,\s*submittedNullifier:\s*Bytes<32>\s*\)/);
      expect(contractSource).toMatch(/export\s+circuit\s+disclose_payroll_audit\s*\(\s*auditKey:\s*Bytes<32>\s*\)/);
    });

    it('Verifies managed TypeScript bindings match Compact exports and valid LICENSE exists', () => {
      const managedSource = fs.readFileSync(managedPath, 'utf8');
      expect(managedSource).toContain('export interface ShadowPayCircuits');
      expect(managedSource).toContain('export interface ShadowPayLedgerState');
      expect(managedSource).toContain('spent_nullifiers: Map<string, boolean>');
      expect(managedSource).toContain('commitments: Map<string, boolean>');

      expect(fs.existsSync(licensePath)).toBe(true);
      const licenseText = fs.readFileSync(licensePath, 'utf8');
      expect(licenseText).toContain('MIT License');
    });
  });

  // -------------------------------------------------------------
  // PART 2: Executable Contract Circuit Execution (managed/index.ts)
  // -------------------------------------------------------------
  describe('Part 2: Executable Circuit Logic & State Transitions', () => {
    let executor: ShadowPayContractExecutor;
    let mockSecret: Uint8Array;
    let mockCommitment: Uint8Array;
    let mockNullifier: Uint8Array;
    let mockBatchHash: Uint8Array;
    let mockAuditorHash: Uint8Array;
    let mockSalary: bigint;
    let mockFloor: bigint;
    let mockTotalBatchAllocation: bigint;

    beforeEach(() => {
      mockSecret = new Uint8Array(32).fill(1);
      mockCommitment = new Uint8Array(32).fill(2);
      mockNullifier = new Uint8Array(32).fill(3);
      mockBatchHash = new Uint8Array(32).fill(4);
      mockAuditorHash = new Uint8Array(32).fill(5);
      mockSalary = 15000n;
      mockFloor = 12000n;
      mockTotalBatchAllocation = 50000n;

      const witnesses: ShadowPayWitnesses = {
        get_recipient_secret: () => mockSecret,
        get_salary_amount: () => mockSalary,
        get_min_committed_amount: () => mockFloor,
        get_batch_total_allocation: () => mockTotalBatchAllocation,
        compute_payout_nullifier: (secret, batchHash) => {
          const res = new Uint8Array(32);
          for (let i = 0; i < 32; i++) res[i] = secret[i] ^ batchHash[i] ^ 6;
          return res;
        },
        verify_claim_witness: (_secret, _commitment, claimedAmount) => {
          return claimedAmount > 0n;
        },
        verify_auditor_key: (key, expectedHash) => {
          return key.every((b, i) => b === expectedHash[i]);
        },
      };

      executor = new ShadowPayContractExecutor(witnesses);
    });

    it('Circuit 1: deposit_payroll_budget initializes on-chain escrow budget & registry', async () => {
      const admin = new Uint8Array(32).fill(9);
      const budget = 50000n;

      await executor.deposit_payroll_budget(admin, budget, mockBatchHash, mockAuditorHash);

      expect(executor.ledgerState.total_funded_budget).toBe(50000n);
      expect(executor.ledgerState.is_settled).toBe(false);
      expect(executor.ledgerState.recipient_count).toBe(0);
      expect(executor.ledgerState.claims_count).toBe(0);
    });

    it('Circuit 2: commit_recipient_split accepts shielded split without salary disclosure', async () => {
      await executor.deposit_payroll_budget(new Uint8Array(32), 50000n, mockBatchHash, mockAuditorHash);

      // Call commit_recipient_split: only commitment leaf and minGuaranteedFloor are passed!
      await executor.commit_recipient_split(mockCommitment, 10000n);

      expect(executor.ledgerState.recipient_count).toBe(1);
      const hex = Array.from(mockCommitment).map(b => b.toString(16).padStart(2, '0')).join('');
      expect(executor.ledgerState.commitments.get(hex)).toBe(true);
    });

    it('Circuit 2 Constraint: Rejects split when salary is below contractual minimum floor', async () => {
      await executor.deposit_payroll_budget(new Uint8Array(32), 50000n, mockBatchHash, mockAuditorHash);

      // Witness salary is 15000n. Minimum floor required is 20000n -> MUST FAIL!
      await expect(
        executor.commit_recipient_split(mockCommitment, 20000n)
      ).rejects.toThrow('is below contractually committed minimum floor');
    });

    it('Circuit 3: finalize_settlement_batch verifies total solvency and locks batch', async () => {
      await executor.deposit_payroll_budget(new Uint8Array(32), 50000n, mockBatchHash, mockAuditorHash);
      await executor.commit_recipient_split(mockCommitment, 10000n);

      // Witness total matches budget (50000n == 50000n)
      await executor.finalize_settlement_batch();

      expect(executor.ledgerState.is_settled).toBe(true);
    });

    it('Circuit 3 Constraint: Rejects settlement when total allocated does not equal budget', async () => {
      await executor.deposit_payroll_budget(new Uint8Array(32), 60000n, mockBatchHash, mockAuditorHash); // Budget 60,000
      mockTotalBatchAllocation = 50000n; // Witness total is only 50,000 -> MISMATCH!

      await expect(
        executor.finalize_settlement_batch()
      ).rejects.toThrow('must exactly equal total funded budget');
    });

    it('Circuit 4: claim_private_payout unlocks private payout and records spent nullifier', async () => {
      await executor.deposit_payroll_budget(new Uint8Array(32), 50000n, mockBatchHash, mockAuditorHash);
      await executor.commit_recipient_split(mockCommitment, 10000n);
      await executor.finalize_settlement_batch();

      // Compute valid nullifier
      const expectedNullifier = new Uint8Array(32);
      for (let i = 0; i < 32; i++) expectedNullifier[i] = mockSecret[i] ^ mockBatchHash[i] ^ 6;

      await executor.claim_private_payout(mockCommitment, expectedNullifier);

      expect(executor.ledgerState.claims_count).toBe(1);
      const nullifierHex = Array.from(expectedNullifier).map(b => b.toString(16).padStart(2, '0')).join('');
      expect(executor.ledgerState.spent_nullifiers.get(nullifierHex)).toBe(true);
    });

    it('Circuit 4 Replay Protection: Rejects double-claim when nullifier is already spent', async () => {
      await executor.deposit_payroll_budget(new Uint8Array(32), 50000n, mockBatchHash, mockAuditorHash);
      await executor.commit_recipient_split(mockCommitment, 10000n);
      await executor.finalize_settlement_batch();

      const expectedNullifier = new Uint8Array(32);
      for (let i = 0; i < 32; i++) expectedNullifier[i] = mockSecret[i] ^ mockBatchHash[i] ^ 6;

      // First claim succeeds
      await executor.claim_private_payout(mockCommitment, expectedNullifier);

      // Second attempt with exact same nullifier MUST be rejected by spent_nullifiers Map!
      await expect(
        executor.claim_private_payout(mockCommitment, expectedNullifier)
      ).rejects.toThrow('Nullifier already spent: double claim prevented');
    });

    it('Circuit 5: disclose_payroll_audit authenticates auditor and returns verified proof', async () => {
      await executor.deposit_payroll_budget(new Uint8Array(32), 50000n, mockBatchHash, mockAuditorHash);
      await executor.commit_recipient_split(mockCommitment, 10000n);

      // Authorized key matching mockAuditorHash
      const [isConserved, budget, count] = await executor.disclose_payroll_audit(mockAuditorHash);

      expect(isConserved).toBe(true);
      expect(budget).toBe(50000n);
      expect(count).toBe(1);
    });

    it('Circuit 5 Access Control: Rejects unauthorized audit key', async () => {
      await executor.deposit_payroll_budget(new Uint8Array(32), 50000n, mockBatchHash, mockAuditorHash);

      const unauthorizedKey = new Uint8Array(32).fill(99);

      await expect(
        executor.disclose_payroll_audit(unauthorizedKey)
      ).rejects.toThrow('Unauthorized auditor: invalid audit authorization key');
    });
  });
});
