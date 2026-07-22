declare module "@paystack/inline-js" {
  interface ResumeTransactionOptions {
    onSuccess?: (transaction?: Record<string, unknown>) => void;
    onLoad?: () => void;
    onCancel?: () => void;
  }

  class PaystackPop {
    resumeTransaction(accessCode: string, options?: ResumeTransactionOptions): void;
    cancelTransaction(): void;
  }

  export default PaystackPop;
}
