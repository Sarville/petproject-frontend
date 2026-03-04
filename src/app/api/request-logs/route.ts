import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const ALLOWED_METHODS = new Set(["GET", "POST", "PATCH", "PUT", "DELETE", "HEAD", "OPTIONS"]);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
  const search = searchParams.get("search")?.trim() ?? "";
  const method = searchParams.get("method")?.trim().toUpperCase() ?? "";
  const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (search) where.url = { contains: search, mode: "insensitive" };
  if (method && ALLOWED_METHODS.has(method)) where.method = method;

  const [data, total] = await Promise.all([
    prisma.requestLog.findMany({ where, skip, take: limit, orderBy: { createdAt: sortDir } }),
    prisma.requestLog.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
}
