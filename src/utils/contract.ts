// Contract interaction helpers for ShadowPay on Midnight Preprod
import { ShadowPayEngine } from '../midnight/ShadowPaySimulator';
import {
  PayrollLedgerState,
  RecipientSplitRule,
  ZKProofLog,
  SelectiveAuditReceipt,
} from '../midnight/types';
import { setNetworkId, getNetworkId } from '../midnight/midnight1am';

export class ContractHelper {
  private static get engine(): ShadowPayEngine {
    setNetworkId('preprod');
    return ShadowPayEngine.getInstance();
  }

  public static getLedgerState(): PayrollLedgerState {
    return this.engine.getLedgerState();
  }

  public static getPrivateSplits(): RecipientSplitRule[] {
    return this.engine.getPrivateSplits();
  }

  public static getProofLogs(): ZKProofLog[] {
    return this.engine.getProofLogs();
  }

  public static async depositPayrollBudget(
    adminPk: string,
    budgetAmount: bigint
  ): Promise<ZKProofLog> {
    return await this.engine.depositPayrollBudget(adminPk, budgetAmount);
  }

  public static async commitRecipientSplit(
    name: string,
    role: string,
    recipientAddress: string,
    salaryAmount: bigint,
    minCommittedFloor: bigint
  ): Promise<{ split: RecipientSplitRule; proofLog: ZKProofLog }> {
    return await this.engine.commitRecipientSplit(
      name,
      role,
      recipientAddress,
      salaryAmount,
      minCommittedFloor
    );
  }

  public static async finalizeSettlementBatch(): Promise<ZKProofLog> {
    return await this.engine.finalizeSettlementBatch();
  }

  public static async claimPrivatePayout(
    splitId: string,
    providedSecret?: string
  ): Promise<ZKProofLog> {
    return await this.engine.claimPrivatePayout(splitId, providedSecret);
  }

  public static generateAuditReceipt(
    splitId: string,
    auditKey?: string
  ): SelectiveAuditReceipt {
    return this.engine.generateSelectiveAuditReceipt(splitId, auditKey);
  }

  public static getActiveNetwork(): string {
    return getNetworkId();
  }
}
