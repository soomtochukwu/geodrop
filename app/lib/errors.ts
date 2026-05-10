import {
  isSolanaError,
  SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM,
} from "@solana/kit";
import {
  getVaultErrorMessage,
  VAULT_ERROR__VAULT_ALREADY_EXISTS,
  VAULT_ERROR__INVALID_AMOUNT,
  type VaultError,
} from "@geodrop/client";

const VAULT_ERROR_CODES: Record<number, VaultError> = {
  [VAULT_ERROR__VAULT_ALREADY_EXISTS]: VAULT_ERROR__VAULT_ALREADY_EXISTS,
  [VAULT_ERROR__INVALID_AMOUNT]: VAULT_ERROR__INVALID_AMOUNT,
};

export function parseTransactionError(err: unknown): string {
  // Wallet rejection (comes from wallet-standard, not a SolanaError)
  if (err instanceof Error && err.message.includes("User rejected")) {
    return "Transaction was rejected by the wallet.";
  }

  // Anchor custom program errors — use the Codama-generated error messages
  if (isSolanaError(err, SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM)) {
    // Note: In some versions of @solana/kit, the address is in err.context
    // We check for the code which is unique to our vault errors
    const code = (err as any).context?.code;
    const vaultError = VAULT_ERROR_CODES[code];
    if (vaultError != null) {
      return getVaultErrorMessage(vaultError);
    }
  }

  return err instanceof Error ? err.message : String(err);
}
