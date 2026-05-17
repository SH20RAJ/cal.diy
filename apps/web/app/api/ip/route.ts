import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import getIP from "@calcom/lib/getIP";

import { authOptions } from "@calcom/features/auth/lib/next-auth-options";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }
  const requestorIp = getIP(req);
  return NextResponse.json({ ip: requestorIp });
}
