import { NextRequest, NextResponse } from "next/server";

// Liveness probe
export async function GET(req: NextRequest) {
    return NextResponse.json({ "status": "live" }, { status: 200 });
}

// Readiness probe
export async function POST(req: NextRequest) {
    // Add any necessary checks to determine readiness
    const isReady = true; // Replace with actual readiness check logic

    if (isReady) {
        return NextResponse.json({ "status": "ready" }, { status: 200 });
    } else {
        return NextResponse.json({ "status": "not ready" }, { status: 503 });
    }
}