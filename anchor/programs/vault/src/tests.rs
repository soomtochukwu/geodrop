#[cfg(test)]
mod tests {
    use crate::ID as PROGRAM_ID;
    use litesvm::LiteSVM;
    use anchor_lang::solana_program::system_program;
    use solana_sdk::{
        instruction::{AccountMeta, Instruction},
        pubkey::Pubkey,
        signature::Keypair,
        signer::Signer,
        transaction::Transaction,
    };

    const LAMPORTS_PER_SOL: u64 = 1_000_000_000;

    fn get_vault_pda(signer: &Pubkey) -> (Pubkey, u8) {
        Pubkey::find_program_address(&[b"vault", signer.as_ref()], &PROGRAM_ID)
    }

    fn get_drop_pda(sponsor: &Pubkey) -> (Pubkey, u8) {
        Pubkey::find_program_address(&[b"drop", sponsor.as_ref()], &PROGRAM_ID)
    }

    fn sighash(namespace: &str, name: &str) -> [u8; 8] {
        let preimage = format!("{}:{}", namespace, name);
        let mut sighash = [0u8; 8];
        sighash.copy_from_slice(&solana_sdk::hash::hash(preimage.as_bytes()).to_bytes()[..8]);
        sighash
    }

    fn create_deposit_ix(signer: &Pubkey, vault: &Pubkey, amount: u64) -> Instruction {
        let mut data = sighash("global", "deposit").to_vec();
        data.extend_from_slice(&amount.to_le_bytes());

        Instruction {
            program_id: PROGRAM_ID,
            accounts: vec![
                AccountMeta::new(*signer, true),
                AccountMeta::new(*vault, false),
                AccountMeta::new_readonly(system_program::ID, false),
            ],
            data,
        }
    }

    fn create_withdraw_ix(signer: &Pubkey, vault: &Pubkey) -> Instruction {
        Instruction {
            program_id: PROGRAM_ID,
            accounts: vec![
                AccountMeta::new(*signer, true),
                AccountMeta::new(*vault, false),
                AccountMeta::new_readonly(system_program::ID, false),
            ],
            data: sighash("global", "withdraw").to_vec(),
        }
    }

    fn create_initialize_drop_ix(
        sponsor: &Pubkey,
        drop_pda: &Pubkey,
        backend_authority: &Pubkey,
        lat: i64,
        long: i64,
        radius: u64,
        amount: u64,
    ) -> Instruction {
        let mut data = sighash("global", "initialize_drop").to_vec();
        data.extend_from_slice(&backend_authority.to_bytes());
        data.extend_from_slice(&lat.to_le_bytes());
        data.extend_from_slice(&long.to_le_bytes());
        data.extend_from_slice(&radius.to_le_bytes());
        data.extend_from_slice(&amount.to_le_bytes());

        Instruction {
            program_id: PROGRAM_ID,
            accounts: vec![
                AccountMeta::new(*sponsor, true),
                AccountMeta::new(*drop_pda, false),
                AccountMeta::new_readonly(system_program::ID, false),
            ],
            data,
        }
    }

    fn create_claim_drop_ix(
        hunter: &Pubkey,
        backend_authority: &Pubkey,
        drop_pda: &Pubkey,
        lat: i64,
        long: i64,
    ) -> Instruction {
        let mut data = sighash("global", "claim_drop").to_vec();
        data.extend_from_slice(&lat.to_le_bytes());
        data.extend_from_slice(&long.to_le_bytes());

        Instruction {
            program_id: PROGRAM_ID,
            accounts: vec![
                AccountMeta::new(*hunter, true),
                AccountMeta::new(*backend_authority, true),
                AccountMeta::new(*drop_pda, false),
                AccountMeta::new_readonly(system_program::ID, false),
            ],
            data,
        }
    }

    #[test]
    fn test_initialize_and_claim_drop() {
        let mut svm = LiteSVM::new();
        let program_bytes = include_bytes!("../../../target/deploy/vault.so");
        let _ = svm.add_program(PROGRAM_ID, program_bytes);

        let sponsor = Keypair::new();
        let hunter = Keypair::new();
        let backend_authority = Keypair::new();
        svm.airdrop(&sponsor.pubkey(), 10 * LAMPORTS_PER_SOL).unwrap();
        svm.airdrop(&hunter.pubkey(), 10 * LAMPORTS_PER_SOL).unwrap();

        let (drop_pda, _bump) = get_drop_pda(&sponsor.pubkey());

        // Initialize drop at (100, 200) with radius 10 and 1 SOL bounty
        let lat = 100i64;
        let long = 200i64;
        let radius = 10u64;
        let amount = LAMPORTS_PER_SOL;

        let init_ix = create_initialize_drop_ix(&sponsor.pubkey(), &drop_pda, &backend_authority.pubkey(), lat, long, radius, amount);
        let blockhash = svm.latest_blockhash();
        let init_tx = Transaction::new_signed_with_payer(
            &[init_ix],
            Some(&sponsor.pubkey()),
            &[&sponsor],
            blockhash,
        );
        svm.send_transaction(init_tx).unwrap();

        // Check drop account balance
        let drop_account = svm.get_account(&drop_pda).unwrap();
        assert!(drop_account.lamports >= amount);

        // Claim drop from (105, 205) - Distance squared is 5^2 + 5^2 = 50. Radius squared is 100. Should pass.
        let claim_lat = 105i64;
        let claim_long = 205i64;
        let claim_ix = create_claim_drop_ix(&hunter.pubkey(), &backend_authority.pubkey(), &drop_pda, claim_lat, claim_long);
        let blockhash = svm.latest_blockhash();
        let claim_tx = Transaction::new_signed_with_payer(
            &[claim_ix],
            Some(&hunter.pubkey()),
            &[&hunter, &backend_authority],
            blockhash,
        );
        svm.send_transaction(claim_tx).unwrap();

        // Check hunter balance increased
        let hunter_account = svm.get_account(&hunter.pubkey()).unwrap();
        assert!(hunter_account.lamports > 10 * LAMPORTS_PER_SOL);

        // Check drop account is closed
        let drop_account_after = svm.get_account(&drop_pda);
        assert!(drop_account_after.is_none() || drop_account_after.unwrap().lamports == 0);
    }

    #[test]
    fn test_claim_drop_out_of_range() {
        let mut svm = LiteSVM::new();
        let program_bytes = include_bytes!("../../../target/deploy/vault.so");
        let _ = svm.add_program(PROGRAM_ID, program_bytes);

        let sponsor = Keypair::new();
        let hunter = Keypair::new();
        let backend_authority = Keypair::new();
        svm.airdrop(&sponsor.pubkey(), 10 * LAMPORTS_PER_SOL).unwrap();
        svm.airdrop(&hunter.pubkey(), 10 * LAMPORTS_PER_SOL).unwrap();

        let (drop_pda, _bump) = get_drop_pda(&sponsor.pubkey());

        let lat = 100i64;
        let long = 200i64;
        let radius = 10u64;
        let amount = LAMPORTS_PER_SOL;

        let init_ix = create_initialize_drop_ix(&sponsor.pubkey(), &drop_pda, &backend_authority.pubkey(), lat, long, radius, amount);
        let blockhash = svm.latest_blockhash();
        let init_tx = Transaction::new_signed_with_payer(
            &[init_ix],
            Some(&sponsor.pubkey()),
            &[&sponsor],
            blockhash,
        );
        svm.send_transaction(init_tx).unwrap();

        // Claim drop from (120, 220) - Distance squared is 20^2 + 20^2 = 800. Radius squared is 100. Should fail.
        let claim_lat = 120i64;
        let claim_long = 220i64;
        let claim_ix = create_claim_drop_ix(&hunter.pubkey(), &backend_authority.pubkey(), &drop_pda, claim_lat, claim_long);
        let blockhash = svm.latest_blockhash();
        let claim_tx = Transaction::new_signed_with_payer(
            &[claim_ix],
            Some(&hunter.pubkey()),
            &[&hunter, &backend_authority],
            blockhash,
        );

        let result = svm.send_transaction(claim_tx);
        assert!(result.is_err(), "Claim from out of range should fail");
    }

    #[test]
    fn test_deposit_and_withdraw() {
        let mut svm = LiteSVM::new();

        // Load the program
        let program_bytes = include_bytes!("../../../target/deploy/vault.so");
        let _ = svm.add_program(PROGRAM_ID, program_bytes);

        // Create a user with some SOL
        let user = Keypair::new();
        svm.airdrop(&user.pubkey(), 10 * LAMPORTS_PER_SOL).unwrap();

        // Get vault PDA
        let (vault_pda, _bump) = get_vault_pda(&user.pubkey());

        // Deposit 1 SOL
        let deposit_amount = LAMPORTS_PER_SOL;
        let deposit_ix = create_deposit_ix(&user.pubkey(), &vault_pda, deposit_amount);

        let blockhash = svm.latest_blockhash();
        let deposit_tx = Transaction::new_signed_with_payer(
            &[deposit_ix],
            Some(&user.pubkey()),
            &[&user],
            blockhash,
        );

        let result = svm.send_transaction(deposit_tx);
        assert!(result.is_ok(), "Deposit should succeed");

        // Check vault balance
        let vault_account = svm.get_account(&vault_pda).unwrap();
        assert_eq!(vault_account.lamports, deposit_amount);

        // Withdraw
        let withdraw_ix = create_withdraw_ix(&user.pubkey(), &vault_pda);

        let blockhash = svm.latest_blockhash();
        let withdraw_tx = Transaction::new_signed_with_payer(
            &[withdraw_ix],
            Some(&user.pubkey()),
            &[&user],
            blockhash,
        );

        let result = svm.send_transaction(withdraw_tx);
        assert!(result.is_ok(), "Withdraw should succeed");

        // Check vault is empty (account may not exist or have 0 lamports)
        let vault_account = svm.get_account(&vault_pda);
        assert!(
            vault_account.is_none() || vault_account.unwrap().lamports == 0,
            "Vault should be empty after withdraw"
        );
    }

    #[test]
    fn test_deposit_fails_if_vault_has_funds() {
        let mut svm = LiteSVM::new();

        let program_bytes = include_bytes!("../../../target/deploy/vault.so");
        let _ = svm.add_program(PROGRAM_ID, program_bytes);

        let user = Keypair::new();
        svm.airdrop(&user.pubkey(), 10 * LAMPORTS_PER_SOL).unwrap();

        let (vault_pda, _bump) = get_vault_pda(&user.pubkey());

        // First deposit
        let deposit_ix = create_deposit_ix(&user.pubkey(), &vault_pda, LAMPORTS_PER_SOL);
        let blockhash = svm.latest_blockhash();
        let tx = Transaction::new_signed_with_payer(
            &[deposit_ix],
            Some(&user.pubkey()),
            &[&user],
            blockhash,
        );
        svm.send_transaction(tx).unwrap();

        // Second deposit should fail
        let deposit_ix2 = create_deposit_ix(&user.pubkey(), &vault_pda, LAMPORTS_PER_SOL);
        let blockhash = svm.latest_blockhash();
        let tx2 = Transaction::new_signed_with_payer(
            &[deposit_ix2],
            Some(&user.pubkey()),
            &[&user],
            blockhash,
        );

        let result = svm.send_transaction(tx2);
        assert!(result.is_err(), "Second deposit should fail");
    }

    #[test]
    fn test_withdraw_fails_if_vault_empty() {
        let mut svm = LiteSVM::new();

        let program_bytes = include_bytes!("../../../target/deploy/vault.so");
        let _ = svm.add_program(PROGRAM_ID, program_bytes);

        let user = Keypair::new();
        svm.airdrop(&user.pubkey(), 10 * LAMPORTS_PER_SOL).unwrap();

        let (vault_pda, _bump) = get_vault_pda(&user.pubkey());

        // Try to withdraw from empty vault
        let withdraw_ix = create_withdraw_ix(&user.pubkey(), &vault_pda);
        let blockhash = svm.latest_blockhash();
        let tx = Transaction::new_signed_with_payer(
            &[withdraw_ix],
            Some(&user.pubkey()),
            &[&user],
            blockhash,
        );

        let result = svm.send_transaction(tx);
        assert!(result.is_err(), "Withdraw from empty vault should fail");
    }
}
