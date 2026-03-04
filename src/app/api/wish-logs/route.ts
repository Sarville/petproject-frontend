import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LogAction } from "@prisma/client";

const VALID_ACTIONS: string[] = ["CREATE", "UPDATE", "DELETE"];

// GET /api/wish-logs?page=1&limit=20&search=&action=&sortDir=desc
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
  const search = searchParams.get("search")?.trim() ?? "";
  const action = searchParams.get("action")?.trim() ?? "";
  const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";
  const skip = (page - 1) * limit;

  const where: {
    wishTitle?: { contains: string; mode: "insensitive" };
    action?: LogAction;
  } = {};

  if (search) {
    where.wishTitle = { contains: search, mode: "insensitive" };
  }
  if (action && VALID_ACTIONS.includes(action)) {
    where.action = action as LogAction;
  }

  const [data, total] = await Promise.all([
    prisma.wishLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: sortDir },
    }),
    prisma.wishLog.count({ where }),
  ]);

  return NextResponse.json({
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
