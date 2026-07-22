export interface WalletData {
  balance: string;
  walletId: string;
}

// type: "debit" = money IN (deposit), "credit" = money OUT (withdrawal)
export type WalletTxType = "debit" | "credit";
export type WalletTxStatus = "pending" | "success" | "failed";
export type DepositCurrency = "NGN" | "USD";
export type WithdrawCurrency = "NGN" | "USD";

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: WalletTxType;
  amount: string;
  reference: string;
  description: string;
  status: WalletTxStatus;
  currency: string;
  // USD fields (only when provider === "stripe")
  originalAmount?: string | null;
  originalCurrency?: string | null;
  fxRate?: string | null;
  provider?: "paystack" | "stripe" | null;
  createdAt: string;
}

export interface WalletTransactionsData {
  transactions: WalletTransaction[];
  total: number;
  nextCursor: string | null;
  hasMore: boolean;
}

// NGN deposit (Paystack)
export interface NgnDepositResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

// USD deposit (Stripe Checkout)
export interface UsdDepositResponse {
  sessionId: string;
  url: string;
  reference: string;
  amountNgN: string;
  usdAmount: string;
  fxRate: string;
  rawRate: number;
  markupPercent: number;
}

export type DepositResponse = NgnDepositResponse | UsdDepositResponse;

export interface DepositForm {
  amount: string;
  currency: DepositCurrency;
}

// NGN withdrawal (Paystack)
export interface NgnWithdrawResponse {
  amount: string;
  reference: string;
  bankName: string;
  accountName: string;
  status: WalletTxStatus;
  currency: "NGN";
}

// USD withdrawal (Stripe Connect)
export interface UsdWithdrawResponse {
  amount: string;
  usdAmount: string;
  fxRate: string;
  reference: string;
  accountName: string;
  status: string;
  currency: "USD";
}

export type WithdrawResponse = NgnWithdrawResponse | UsdWithdrawResponse;

export interface WithdrawForm {
  amount: string;
  currency: WithdrawCurrency;
}
