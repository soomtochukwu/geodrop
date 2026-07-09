import type { Account } from "@solana/kit";
import type { Drop } from "@geodrop/client";

/** Haversine distance in meters — same formula as the mobile app. */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371e3; // Earth radius in meters
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) *
      Math.cos(lat2 * rad) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** On-chain coordinates are stored as i64 micro-degrees. */
export function microDegreesToDegrees(value: bigint | number) {
  return Number(value) / 1_000_000;
}

export function formatLamportsToSol(amount: bigint | number | string) {
  const lamportsValue = BigInt(amount);
  const sol = lamportsValue / 1_000_000_000n;
  const fractional = (lamportsValue % 1_000_000_000n)
    .toString()
    .padStart(9, "0")
    .replace(/0+$/, "");

  return fractional ? `${sol}.${fractional}` : sol.toString();
}

/** Drop names are fixed 32-byte, null-padded buffers. */
export function decodeDropName(drop: Account<Drop>) {
  return (
    new TextDecoder().decode(drop.data.name as Uint8Array).replace(/\0/g, "") ||
    "Unnamed Bounty"
  );
}
