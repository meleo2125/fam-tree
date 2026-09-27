import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  const people = await prisma.person.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
            { currentPlace: { contains: q, mode: "insensitive" } },
            { nativePlace: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      relationshipsAsA: {
        where: { type: "SPOUSE" },
        include: { personB: { select: { name: true } } },
      },
      relationshipsAsB: {
        where: { type: "SPOUSE" },
        include: { personA: { select: { name: true } } },
      },
    },
    take: 30,
    orderBy: { name: "asc" },
  });

  const results = people.map((p) => {
    const spouseName =
      p.relationshipsAsA[0]?.personB?.name ||
      p.relationshipsAsB[0]?.personA?.name ||
      null;
    const { relationshipsAsA, relationshipsAsB, ...personData } = p;
    void relationshipsAsA;
    void relationshipsAsB;
    return {
      ...personData,
      spouseHint: spouseName ? `Spouse: ${spouseName}` : null,
    };
  });

  return NextResponse.json(results);
}
