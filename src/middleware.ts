import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const start = Date.now();
  const requestId = crypto.randomUUID();

  const response = NextResponse.next();

  // Request ID
  response.headers.set("X-Request-ID", requestId);

  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // CORS for API routes in production
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || "";

    if (origin && allowedOrigin && origin === allowedOrigin) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
      );
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
      response.headers.set("Access-Control-Max-Age", "86400");
    }

    // Handle preflight
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }

    // Structured request logging (Edge runtime — use console.log with JSON)
    const duration = Date.now() - start;
    console.log(
      JSON.stringify({
        severity: "INFO",
        message: `${request.method} ${request.nextUrl.pathname}`,
        requestId: requestId.slice(0, 8),
        method: request.method,
        path: request.nextUrl.pathname,
        durationMs: duration,
        timestamp: new Date().toISOString(),
      })
    );
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
