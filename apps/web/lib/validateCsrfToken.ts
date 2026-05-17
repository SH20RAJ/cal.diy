import { timingSafeEqual } from "crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function validateCsrfToken(csrfToken: string): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("calcom.csrf_token")?.value;

  if (!cookieToken) {
    return NextResponse.json({ success: false, message: "Invalid CSRF token" }, { status: 403 });
  }

  // Use timingSafeEqual to prevent timing attacks on token comparison
  const isValid =
    cookieToken.length === csrfToken.length &&
    timingSafeEqual(Buffer.from(cookieToken), Buffer.from(csrfToken));

  if (!isValid) {
    return NextResponse.json({ success: false, message: "Invalid CSRF token" }, { status: 403 });
  }
  cookieStore.delete("calcom.csrf_token");
  return null;
}
