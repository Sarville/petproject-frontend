import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const NO_BODY_METHODS = new Set(["GET", "HEAD", "OPTIONS", "DELETE"]);

export async function proxy(request: NextRequest) {
  const { method, url } = request;
  console.log(`[${new Date().toISOString()}] ${method} ${url}`);

  // Read body for methods that carry a payload
  let body: string | null = null;
  if (!NO_BODY_METHODS.has(method)) {
    try {
      const contentType = request.headers.get("content-type") ?? "";
      if (contentType.includes("application/json") || contentType.includes("text/")) {
        body = (await request.clone().text()) || null;
      }
    } catch {
      // Never block the request on a logging error
    }
  }

  // Fire-and-forget — does not block the response
  prisma.requestLog
    .create({ data: { method, url, body } })
    .catch(() => {});

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip static assets and the request-logs API itself (prevents infinite logging loop)
    "/((?!_next/static|_next/image|favicon.ico|api/request-logs).*)",
  ],
};
