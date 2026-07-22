import { atomWithStorage } from "jotai/utils";
import { useAtom } from "jotai/react";
import type { DepositCurrency, WithdrawCurrency } from "#/types/wallet";

// Persisted so the selected currency survives page refreshes.
export const depositCurrencyAtom = atomWithStorage<DepositCurrency>(
  "wallet_deposit_currency",
  "NGN",
);

export const withdrawCurrencyAtom = atomWithStorage<WithdrawCurrency>(
  "wallet_withdraw_currency",
  "NGN",
);

export const useDepositCurrency = () => useAtom(depositCurrencyAtom);
export const useWithdrawCurrency = () => useAtom(withdrawCurrencyAtom);
