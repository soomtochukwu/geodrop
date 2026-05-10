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

    fn get_drop_pda(sponsor: &Pubkey, campaign_id: &[u8; 8]) -> (Pubkey, u8) {
        Pubkey::find_program_address(&[b"drop", sponsor.as_ref(), campaign_id.as_ref()], &PROGRAM_ID)
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
        campaign_id: [u8; 8],
        campaign_name: [u8; 32],
        backend_authority: &Pubkey,
        lat: i64,
        long: i64,
        radius: u64,
        reward_per_claim: u64,
        max_claims: u64,
    ) -> Instruction {
        let mut data = sighash("global", "initialize_drop").to_vec();
        data.extend_from_slice(&campaign_id);
        data.extend_from_slice(&campaign_name);
        data.extend_from_slice(&backend_authority.to_bytes());
        data.extend_from_slice(&lat.to_le_bytes());
        data.extend_from_slice(&long.to_le_bytes());
        data.extend_from_slice(&radius.to_le_bytes());
        data.extend_from_slice(&reward_per_claim.to_le_bytes());
        data.extend_from_slice(&max_claims.to_le_bytes());

        Instruction {
            program_id: PROGRAM_ID,
            accounts: vec![
                AccountMeta::new(*sponsor, true),
                AccountMeta::new(*drop_pda, false),
                AccountMeta::new_readonly(anchor_lang::solana_program::system_program::ID, false),
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
    fn test_multi_claim_flow() {
        let mut svm = LiteSVM::new();
        let program_bytes = include_bytes!("../../../target/deploy/vault.so");
        let _ = svm.add_program(PROGRAM_ID, program_bytes);

        let sponsor = Keypair::new();
        let hunter1 = Keypair::new();
        let hunter2 = Keypair::new();
        let backend_authority = Keypair::new();
        svm.airdrop(&sponsor.pubkey(), 10 * LAMPORTS_PER_SOL).unwrap();
        svm.airdrop(&hunter1.pubkey(), 10 * LAMPORTS_PER_SOL).unwrap();
        svm.airdrop(&hunter2.pubkey(), 10 * LAMPORTS_PER_SOL).unwrap();

        let campaign_id = [1u8; 8];
        let mut name = [0u8; 32];
        name[0..13].copy_from_slice(b"Test Campaign");
        
        let (drop_pda, _bump) = get_drop_pda(&sponsor.pubkey(), &campaign_id);

        let lat = 100i64;
        let long = 200i64;
        let radius = 10u64;
        let reward = LAMPORTS_PER_SOL;
        let max_claims = 2u64;

        let init_ix = create_initialize_drop_ix(
            &sponsor.pubkey(), 
            &drop_pda, 
            campaign_id, 
            name,
            &backend_authority.pubkey(), 
            lat, long, radius, reward, max_claims
        );
        
        let blockhash = svm.latest_blockhash();
        let init_tx = Transaction::new_signed_with_payer(
            &[init_ix],
            Some(&sponsor.pubkey()),
            &[&sponsor],
            blockhash,
        );
        svm.send_transaction(init_tx).unwrap();

        // Claim 1
        let claim_ix1 = create_claim_drop_ix(&hunter1.pubkey(), &backend_authority.pubkey(), &drop_pda, lat, long);
        let claim_tx1 = Transaction::new_signed_with_payer(
            &[claim_ix1],
            Some(&hunter1.pubkey()),
            &[&hunter1, &backend_authority],
            svm.latest_blockhash(),
        );
        svm.send_transaction(claim_tx1).unwrap();

        // Verify hunter1 got reward
        assert!(svm.get_account(&hunter1.pubkey()).unwrap().lamports > 10 * LAMPORTS_PER_SOL);
        // Verify drop account still exists
        assert!(svm.get_account(&drop_pda).is_some());

        // Claim 2 (Last)
        let claim_ix2 = create_claim_drop_ix(&hunter2.pubkey(), &backend_authority.pubkey(), &drop_pda, lat, long);
        let claim_tx2 = Transaction::new_signed_with_payer(
            &[claim_ix2],
            Some(&hunter2.pubkey()),
            &[&hunter2, &backend_authority],
            svm.latest_blockhash(),
        );
        svm.send_transaction(claim_tx2).unwrap();

        // Verify hunter2 got reward
        assert!(svm.get_account(&hunter2.pubkey()).unwrap().lamports > 10 * LAMPORTS_PER_SOL);
        // Verify drop account is closed
        assert!(svm.get_account(&drop_pda).is_none());
    }

    #[test]
    fn test_multiple_campaigns_same_sponsor() {
        let mut svm = LiteSVM::new();
        let program_bytes = include_bytes!("../../../target/deploy/vault.so");
        let _ = svm.add_program(PROGRAM_ID, program_bytes);

        let sponsor = Keypair::new();
        let backend_authority = Keypair::new();
        svm.airdrop(&sponsor.pubkey(), 10 * LAMPORTS_PER_SOL).unwrap();

        let id1 = [1u8; 8];
        let id2 = [2u8; 8];
        let name = [0u8; 32];
        let (pda1, _) = get_drop_pda(&sponsor.pubkey(), &id1);
        let (pda2, _) = get_drop_pda(&sponsor.pubkey(), &id2);

        assert_ne!(pda1, pda2);

        // Init campaign 1
        let init_ix1 = create_initialize_drop_ix(&sponsor.pubkey(), &pda1, id1, name, &backend_authority.pubkey(), 0, 0, 10, LAMPORTS_PER_SOL, 1);
        svm.send_transaction(Transaction::new_signed_with_payer(&[init_ix1], Some(&sponsor.pubkey()), &[&sponsor], svm.latest_blockhash())).unwrap();

        // Init campaign 2
        let init_ix2 = create_initialize_drop_ix(&sponsor.pubkey(), &pda2, id2, name, &backend_authority.pubkey(), 1, 1, 20, LAMPORTS_PER_SOL, 1);
        svm.send_transaction(Transaction::new_signed_with_payer(&[init_ix2], Some(&sponsor.pubkey()), &[&sponsor], svm.latest_blockhash())).unwrap();

        assert!(svm.get_account(&pda1).is_some());
        assert!(svm.get_account(&pda2).is_some());
    }

    #[test]
    fn test_deposit_and_withdraw() {
        let mut svm = LiteSVM::new();
        let program_bytes = include_bytes!("../../../target/deploy/vault.so");
        let _ = svm.add_program(PROGRAM_ID, program_bytes);

        let user = Keypair::new();
        svm.airdrop(&user.pubkey(), 10 * LAMPORTS_PER_SOL).unwrap();
        let (vault_pda, _bump) = get_vault_pda(&user.pubkey());

        let deposit_amount = LAMPORTS_PER_SOL;
        let deposit_ix = create_deposit_ix(&user.pubkey(), &vault_pda, deposit_amount);
        svm.send_transaction(Transaction::new_signed_with_payer(&[deposit_ix], Some(&user.pubkey()), &[&user], svm.latest_blockhash())).unwrap();

        assert_eq!(svm.get_account(&vault_pda).unwrap().lamports, deposit_amount);

        let withdraw_ix = create_withdraw_ix(&user.pubkey(), &vault_pda);
        svm.send_transaction(Transaction::new_signed_with_payer(&[withdraw_ix], Some(&user.pubkey()), &[&user], svm.latest_blockhash())).unwrap();

        assert!(svm.get_account(&vault_pda).is_none());
    }
}
