// ShadowPay: Types and Data Models
// Confidential Payroll & Revenue-Split Settlement Protocol

export interface RecipientSplitRule {
  id: string;
  name: string;
  role: string;
  recipientAddress: string;
  salaryAmount: bigint;
  minCommittedFloor: bigint;
  secretKey: string;
  commitmentHash: string;
  nullifier: string;
  isClaimed: boolean;
  claimedAt?: string;
  claimTxHash?: string;
  claimNullifier?: string;
}

export interface PayrollLedgerState {
  adminPk: string;
  totalFundedBudget: bigint;
  totalAllocatedAmount: bigint;
  batchHash: string;
  recipientCount: number;
  claimsCount: number;
  isSettled: boolean;
  contractAddress: string;
  preprodBech32m: string;
  deploymentTxHash: string;
}

export interface ZKProofLog {
  id: string;
  circuitName: 'deposit_payroll_budget' | 'commit_recipient_split' | 'finalize_settlement_batch' | 'claim_private_payout' | 'disclose_payroll_audit';
  status: 'proving' | 'proven' | 'verified' | 'failed';
  publicInputs: Record<string, unknown>;
  witnessSummary: string;
  zkProofHash: string;
  timestamp: string;
  txHash: string;
  executionTimeMs: number;
}

export interface SelectiveAuditReceipt {
  receiptId: string;
  batchHash: string;
  contractAddress: string;
  recipientName: string;
  role: string;
  verifiedAmount: bigint;
  contractualMinFloor: bigint;
  minFloorSatisfied: boolean;
  totalBudgetMatches: boolean;
  zkProofVerificationHash: string;
  generatedAt: string;
  selectiveDisclosureKey: string;
  anonymizedCoRecipientsCount: number;
}

export interface ContractDeploymentInfo {
  hexAddress: string;
  bech32mAddress: string;
  network: 'preprod' | 'preview' | 'local';
  txHash: string;
  blockHeight: number;
  deployedAt: string;
  adminPk: string;
}
