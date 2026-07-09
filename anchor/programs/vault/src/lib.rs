use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

#[cfg(test)]
mod tests;

declare_id!("6mEc28x37u7281vSXg5CwcVtj2qKVX4dX1vwrQYG1RNv");

#[program]
pub mod vault {
    use super::*;

    pub fn deposit(ctx: Context<VaultAction>, amount: u64) -> Result<()> {
        require!(
            ctx.accounts.vault.lamports() == 0,
            VaultError::VaultAlreadyExists
        );

        let rent = Rent::get()?.minimum_balance(0);
        require!(amount > rent, VaultError::InvalidAmount);

        transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.signer.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                },
            ),
            amount,
        )?;

        Ok(())
    }

    pub fn withdraw(ctx: Context<VaultAction>) -> Result<()> {
        require!(ctx.accounts.vault.lamports() > 0, VaultError::InvalidAmount);

        let bump = ctx.bumps.vault;
        let signer_key = ctx.accounts.signer.key();
        let signer_seeds: &[&[&[u8]]] = &[&[b"vault", signer_key.as_ref(), &[bump]]];

        transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.signer.to_account_info(),
                },
                signer_seeds,
            ),
            ctx.accounts.vault.lamports(),
        )?;

        Ok(())
    }

    pub fn initialize_drop(
        ctx: Context<InitializeDrop>,
        campaign_id: [u8; 8],
        campaign_name: [u8; 32],
        backend_authority: [u8; 32],
        lat: i64,
        long: i64,
        radius: u64,
        reward_per_claim: u64,
        max_claims: u64,
    ) -> Result<()> {
        let drop = &mut ctx.accounts.drop;
        drop.sponsor = ctx.accounts.sponsor.key();
        drop.campaign_id = campaign_id;
        drop.name = campaign_name;
        drop.backend_authority = Pubkey::from(backend_authority);
        drop.latitude = lat;
        drop.longitude = long;
        drop.radius = radius;
        drop.reward_per_claim = reward_per_claim;
        drop.max_claims = max_claims;
        drop.current_claims = 0;

        let total_amount = reward_per_claim * max_claims;

        // Handle existing funds bridged via LiFi
        let current_lamports = ctx.accounts.drop.to_account_info().lamports();
        if current_lamports < total_amount {
            let diff = total_amount - current_lamports;
            transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.sponsor.to_account_info(),
                        to: ctx.accounts.drop.to_account_info(),
                    },
                ),
                diff,
            )?;
        }

        Ok(())
    }

    pub fn claim_drop(ctx: Context<ClaimDrop>, lat: i64, long: i64) -> Result<()> {
        let drop_info = ctx.accounts.drop.to_account_info();
        let hunter_info = ctx.accounts.hunter.to_account_info();

        // Scoped check to avoid borrow conflicts
        let (is_last_claim, reward_amount) = {
            let drop = &mut ctx.accounts.drop;

            // Check if bounty is still active
            require!(drop.current_claims < drop.max_claims, VaultError::CampaignFinished);

            // Check distance in decimeters (1/10 meters) to avoid floats
            // 1 micro-degree of latitude ≈ 1.11 decimeters
            let d_lat = (drop.latitude - lat).abs();
            let dy_dm = (d_lat as u128 * 111) / 100;

            // 1 micro-degree of longitude ≈ 1.11 * cos(lat) decimeters
            let d_long = (drop.longitude - long).abs();
            let lat_deg = (drop.latitude / 1_000_000).abs();
            let cos_lat = if lat_deg >= 90 {
                0
            } else {
                1000 - (lat_deg * lat_deg * 1000) / 7300
            };
            let dx_dm = (d_long as u128 * 111 * cos_lat as u128) / 100000;

            let dist_sq = dy_dm.pow(2) + dx_dm.pow(2);
            let radius_dm = drop.radius as u128 * 10;
            let radius_sq = radius_dm.pow(2);

            require!(dist_sq <= radius_sq, VaultError::OutOfRange);
            
            drop.current_claims += 1;
            let last = drop.current_claims >= drop.max_claims;
            (last, drop.reward_per_claim)
        };

        if is_last_claim {
            // Manual closure: transfer all lamports to the hunter
            let dest_lamports = hunter_info.lamports();
            let source_lamports = drop_info.lamports();
            
            **hunter_info.lamports.borrow_mut() = dest_lamports.checked_add(source_lamports).unwrap();
            **drop_info.lamports.borrow_mut() = 0;
        } else {
            // Manual partial transfer from program-owned account
            **drop_info.lamports.borrow_mut() -= reward_amount;
            **hunter_info.lamports.borrow_mut() += reward_amount;
        }

        Ok(())
    }
}

#[derive(Accounts)]
pub struct VaultAction<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"vault", signer.key().as_ref()],
        bump,
    )]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(campaign_id: [u8; 8])]
pub struct InitializeDrop<'info> {
    #[account(mut)]
    pub sponsor: Signer<'info>,
    #[account(
        init_if_needed,
        payer = sponsor,
        space = 8 + 32 + 8 + 32 + 32 + 8 + 8 + 8 + 8 + 8 + 8, // disc + sponsor + campaign_id + name + backend_auth + lat + long + rad + reward + max + current
        seeds = [b"drop", sponsor.key().as_ref(), campaign_id.as_ref()],
        bump
    )]
    pub drop: Account<'info, Drop>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimDrop<'info> {
    #[account(mut)]
    pub hunter: Signer<'info>,
    pub backend_authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"drop", drop.sponsor.as_ref(), drop.campaign_id.as_ref()],
        bump,
        has_one = backend_authority @ VaultError::InvalidAuthority,
        constraint = drop.current_claims < drop.max_claims @ VaultError::CampaignFinished,
    )]
    pub drop: Account<'info, Drop>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Drop {
    pub sponsor: Pubkey,
    pub campaign_id: [u8; 8],
    pub name: [u8; 32],
    pub backend_authority: Pubkey,
    pub latitude: i64,
    pub longitude: i64,
    pub radius: u64,
    pub reward_per_claim: u64,
    pub max_claims: u64,
    pub current_claims: u64,
}

#[error_code]
pub enum VaultError {
    #[msg("Vault already exists")]
    VaultAlreadyExists,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Hunter is out of range")]
    OutOfRange,
    #[msg("Invalid backend authority")]
    InvalidAuthority,
    #[msg("Campaign has finished")]
    CampaignFinished,
}
