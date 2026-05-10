use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

#[cfg(test)]
mod tests;

declare_id!("Eb7gjz58TZ6HVo4ruNddNzFFpR8kpzKHVkE9foGPXp4L");

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
        backend_authority: Pubkey,
        lat: i64,
        long: i64,
        radius: u64,
        amount: u64,
    ) -> Result<()> {
        let drop = &mut ctx.accounts.drop;
        drop.sponsor = ctx.accounts.sponsor.key();
        drop.backend_authority = backend_authority;
        drop.latitude = lat;
        drop.longitude = long;
        drop.radius = radius;
        drop.amount = amount;

        // Handle existing funds bridged via LiFi
        let current_lamports = ctx.accounts.drop.to_account_info().lamports();
        if current_lamports < amount {
            let diff = amount - current_lamports;
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
        let drop = &ctx.accounts.drop;

        // Check distance (Manhattan for simplicity in MVP, or squared Euclidean)
        let d_lat = (drop.latitude - lat).abs();
        let d_long = (drop.longitude - long).abs();

        // Use squared Euclidean distance to avoid sqrt
        // distance^2 = dx^2 + dy^2
        let dist_sq = (d_lat as u128).pow(2) + (d_long as u128).pow(2);
        let radius_sq = (drop.radius as u128).pow(2);

        require!(dist_sq <= radius_sq, VaultError::OutOfRange);

        // Lamports are already in the drop account.
        // Anchor's `close` will transfer them to the hunter.

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
pub struct InitializeDrop<'info> {
    #[account(mut)]
    pub sponsor: Signer<'info>,
    #[account(
        init_if_needed,
        payer = sponsor,
        space = 8 + 32 + 32 + 8 + 8 + 8 + 8, // disc + sponsor + backend_authority + i64 + i64 + u64 + u64
        seeds = [b"drop", sponsor.key().as_ref()],
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
        close = hunter,
        seeds = [b"drop", drop.sponsor.as_ref()],
        bump,
        has_one = backend_authority @ VaultError::InvalidAuthority,
    )]
    pub drop: Account<'info, Drop>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Drop {
    pub sponsor: Pubkey,
    pub backend_authority: Pubkey,
    pub latitude: i64,
    pub longitude: i64,
    pub radius: u64,
    pub amount: u64,
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
}
