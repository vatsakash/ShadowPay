import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('ShadowPay Midnight Compact Smart Contract (Direct Verification)', () => {
  const contractPath = path.resolve(__dirname, '../contracts/ShadowPay.compact');
  const managedPath = path.resolve(__dirname, '../managed/index.ts');
  const licensePath = path.resolve(__dirname, '../LICENSE');

  const contractSource = fs.readFileSync(contractPath, 'utf8');

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

  it('Verifies on-chain persistent spent_nullifiers Map for anti-double-claim protection', () => {
    // Must declare spent_nullifiers as an on-chain ledger Map
    expect(contractSource).toMatch(/export\s+ledger\s+spent_nullifiers\s*:\s*Map<Bytes<32>,\s*Boolean>;/);

    // claim_private_payout circuit must check nullifier membership before processing
    expect(contractSource).toMatch(/!spent_nullifiers\.member\s*\(\s*disclose\s*\(\s*submittedNullifier\s*\)\s*\)/);

    // claim_private_payout circuit must insert nullifier into ledger Map
    expect(contractSource).toMatch(/spent_nullifiers\.insert\s*\(\s*disclose\s*\(\s*submittedNullifier\s*\),\s*true\s*\);/);
  });

  it('Verifies on-chain commitments Map for verified allocation registry', () => {
    expect(contractSource).toMatch(/export\s+ledger\s+commitments\s*:\s*Map<Bytes<32>,\s*Boolean>;/);
    expect(contractSource).toMatch(/commitments\.insert\s*\(\s*disclose\s*\(\s*recipientCommitment\s*\),\s*true\s*\);/);
  });

  it('Verifies all 5 core Compact circuits are exported with exact signatures', () => {
    // Circuit 1: deposit_payroll_budget
    expect(contractSource).toMatch(/export\s+circuit\s+deposit_payroll_budget\s*\(/);
    // Circuit 2: commit_recipient_split (salary is a witness, NOT a public arg)
    expect(contractSource).toMatch(/export\s+circuit\s+commit_recipient_split\s*\(\s*recipientCommitment:\s*Bytes<32>,\s*minGuaranteedFloor:\s*Uint<64>\s*\)/);
    // Circuit 3: finalize_settlement_batch
    expect(contractSource).toMatch(/export\s+circuit\s+finalize_settlement_batch\s*\(\s*\)/);
    // Circuit 4: claim_private_payout
    expect(contractSource).toMatch(/export\s+circuit\s+claim_private_payout\s*\(\s*recipientCommitment:\s*Bytes<32>,\s*submittedNullifier:\s*Bytes<32>\s*\)/);
    // Circuit 5: disclose_payroll_audit
    expect(contractSource).toMatch(/export\s+circuit\s+disclose_payroll_audit\s*\(\s*auditKey:\s*Bytes<32>\s*\)/);
  });

  it('Verifies contractual minimum floor constraint is enforced inside commit_recipient_split', () => {
    expect(contractSource).toMatch(/assert\s*\(\s*salary\s*>=\s*minGuaranteedFloor/);
  });

  it('Verifies batch solvency constraint is enforced in finalize_settlement_batch', () => {
    expect(contractSource).toMatch(/assert\s*\(\s*totalAllocated\s*==\s*total_funded_budget/);
  });

  it('Verifies auditor authorization access control in disclose_payroll_audit', () => {
    expect(contractSource).toMatch(/witness\s+verify_auditor_key/);
    expect(contractSource).toMatch(/assert\s*\(\s*isAuthorized/);
  });

  it('Verifies auto-generated managed bindings strictly align with Compact contract', () => {
    const managedSource = fs.readFileSync(managedPath, 'utf8');
    expect(managedSource).toContain('export interface ShadowPayCircuits');
    expect(managedSource).toContain('export interface ShadowPayLedgerState');
    expect(managedSource).toContain('spent_nullifiers: Map<string, boolean>');
    expect(managedSource).toContain('commitments: Map<string, boolean>');
  });

  it('Verifies valid MIT LICENSE exists in repository root', () => {
    expect(fs.existsSync(licensePath)).toBe(true);
    const licenseText = fs.readFileSync(licensePath, 'utf8');
    expect(licenseText).toContain('MIT License');
    expect(licenseText).toContain('Akash Vats (ShadowPay)');
  });
});
