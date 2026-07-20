export interface WalletData {
  balance: string;
  walletId: string;
}

export interface WalletResponse {
  status: string;
  data: WalletData;
}

export interface DepositResponse {
  status: string;
  data: { authorizationUrl: string };
}

export interface DepositForm {
  amount: string;
}

export type WalletTxType = "debit" | "credit";

export interface WalletTransaction {
  id: string;
  type: WalletTxType;
  amount: string;
  reference: string;
  description: string;
}

export interface WalletTransactionsData {
  transactions: WalletTransaction[];
  total: number;
  nextCursor: string | null;
  hasMore: boolean;
}
