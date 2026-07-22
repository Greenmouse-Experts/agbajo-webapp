export type PayoutCurrency = "NGN" | "USD";
export type PayoutAccountType = "nuban" | "stripe_connect";
export type StripeAccountStatus = "pending" | "active";

export interface PayoutAccount {
  id: string;
  accountName: string;
  bankName: string | null;
  bankCode: string | null;
  currency: PayoutCurrency;
  type: PayoutAccountType;
  recipientCode: string | null;
  isDefault: boolean;
  stripeAccountId: string | null;
  stripeAccountStatus: StripeAccountStatus | null;
  createdAt: string;
  updatedAt: string;
  // Only present immediately after creating a USD account
  onboardingUrl?: string;
}

export interface PayoutAccountsData {
  payoutAccounts: PayoutAccount[];
  total: number;
  nextCursor: string | null;
  hasMore: boolean;
}

export interface Bank {
  id: number;
  name: string;
  code: string;
  active: boolean;
  [key: string]: unknown;
}

export interface ResolveAccountResponse {
  account_number: string;
  account_name: string;
}

export interface CreateNgnAccountForm {
  accountNumber: string;
  bankCode: string;
  accountName?: string;
  currency?: "NGN";
  isDefault?: boolean;
}

export interface CreateUsdAccountForm {
  currency: "USD";
  accountName: string;
  country: string;
  returnUrl: string;
  refreshUrl: string;
  isDefault?: boolean;
}

export interface SyncResponse {
  id: string;
  stripeAccountStatus: StripeAccountStatus;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirements: Record<string, unknown>;
}

export interface OnboardingLinkResponse {
  onboardingUrl: string;
}
