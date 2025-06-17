import { NextResponse } from "next/server";

/**
 * This endpoint provides a way to check if the application can run without Clerk
 * It's a temporary solution while debugging Clerk authentication issues
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Clerk bypass is active",
    timestamp: new Date().toISOString(),
  });
}
