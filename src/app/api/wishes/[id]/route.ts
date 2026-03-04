import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidUUID, validateWishPayload } from "@/lib/validate";

type Params = { params: Promise<{ id: string }> };

// GET /api/wishes/:id
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: "Invalid UUID" }, { status: 400 });
  }

  const wish = await prisma.wish.findUnique({ where: { id } });
  if (!wish) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(wish);
}

// PATCH /api/wishes/:id
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: "Invalid UUID" }, { status: 400 });
  }

  const existing = await prisma.wish.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const merged = {
    title: body.title ?? existing.title,
    description: body.description ?? existing.description,
  };
  const result = validateWishPayload(merged);
  if (!result.valid) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  const updated = await prisma.wish.update({
    where: { id },
    data: result.data!,
  });

  await prisma.wishLog.create({
    data: {
      action: "UPDATE",
      wishId: id,
      wishTitle: updated.title,
      oldValues: { title: existing.title, description: existing.description },
      newValues: { title: updated.title, description: updated.description },
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/wishes/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: "Invalid UUID" }, { status: 400 });
  }

  const existing = await prisma.wish.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.wish.delete({ where: { id } });

  await prisma.wishLog.create({
    data: {
      action: "DELETE",
      wishId: id,
      wishTitle: existing.title,
      oldValues: { title: existing.title, description: existing.description },
    },
  });

  return new NextResponse(null, { status: 204 });
}
