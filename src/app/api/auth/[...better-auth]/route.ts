import { NextResponse } from "next/server";

// Simple auth handler - routes to better-auth internal routes
// The actual better-auth middleware is configured in next.config.js or via middleware

export const dynamic = "force-dynamic";

// This route acts as a passthrough for better-auth internal routes
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path") || "";

  // Pass through to the authenticated routes
  // In a full implementation, better-auth would handle these
  return NextResponse.json({
    status: "ok",
    message: `Auth route: ${path}`,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({
    status: "ok",
    received: body,
  });
}

export async function PUT(request: Request) {
  const body = await request.json();
  return NextResponse.json({
    status: "ok",
    received: body,
  });
}

export async function DELETE(request: Request) {
  return NextResponse.json({
    status: "ok",
  });
}