import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateWishPayload } from "@/lib/validate";

// GET /api/wishes?page=1&limit=10&search=
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(
    1,
    parseInt(searchParams.get("page") ?? "1", 10) || 1
  );
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10) || 10)
  );
  const search = searchParams.get("search")?.trim() ?? "";
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.wish.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.wish.count({ where }),
  ]);

  return NextResponse.json({
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

// POST /api/wishes
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const result = validateWishPayload(body);

  if (!result.valid) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  const wish = await prisma.wish.create({ data: result.data! });

  await prisma.wishLog.create({
    data: {
      action: "CREATE",
      wishId: wish.id,
      wishTitle: wish.title,
      newValues: { title: wish.title, description: wish.description },
    },
  });

  return NextResponse.json(wish, { status: 201 });
}
