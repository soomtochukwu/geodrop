import { NextResponse } from "next/server";

// Fallback Mock Responses for waitlist and beta program
const mockWaitlist = [
  { id: 1, email: "alex.crypto@gmail.com", date: "2026-07-12T13:45:00Z", source: "Direct" },
  { id: 2, email: "sarah_web3@yahoo.com", date: "2026-07-12T14:10:00Z", source: "Twitter/X" },
  { id: 3, email: "hunter_prime@protonmail.com", date: "2026-07-12T15:30:00Z", source: "Dev3pack" },
  { id: 4, email: "solana_builder@outlook.com", date: "2026-07-13T09:15:00Z", source: "Direct" },
  { id: 5, email: "giga_brain@gmail.com", date: "2026-07-13T11:24:00Z", source: "Beta Program" },
];

const mockBeta = [
  {
    id: 1,
    email: "beta_pioneer@gmail.com",
    wallet: "GzHn9...vWqL",
    device: "Android APK",
    location: "Lagos, Nigeria",
    experience: "Intermediate",
    date: "2026-07-12T16:05:00Z",
  },
  {
    id: 2,
    email: "sol_seeker@gmail.com",
    wallet: "8yWk1...pZoX",
    device: "iOS (TestFlight)",
    location: "Cape Town, South Africa",
    experience: "Advanced",
    date: "2026-07-12T18:22:00Z",
  },
  {
    id: 3,
    email: "merch_tracker@proton.me",
    wallet: "A7sR2...mLtK",
    device: "Both Devices",
    location: "Nairobi, Kenya",
    experience: "Beginner",
    date: "2026-07-13T10:02:00Z",
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "waitlist";
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  // Check if Sheets API credentials are set
  if (sheetId && clientEmail && privateKey) {
    try {
      // In a real-world scenario, you would authenticate and fetch here.
      // E.g., using a lightweight JWT implementation to get OAuth token
      // and fetching the spreadsheet values via Google REST API.
      // For now, we will return the mock data or attempt the fetch.
      
      // Let's implement a dummy REST check for demonstration
      // If credentials are present but failed, log it and fall back to mock data
    } catch (err) {
      console.error("Failed to query Google Sheets API:", err);
    }
  }

  // Return the appropriate mock data based on type
  if (type === "beta") {
    return NextResponse.json({
      success: true,
      data: mockBeta,
      source: "mock_local_db",
      configured: !!(sheetId && clientEmail && privateKey),
    });
  }

  return NextResponse.json({
    success: true,
    data: mockWaitlist,
    source: "mock_local_db",
    configured: !!(sheetId && clientEmail && privateKey),
  });
}
