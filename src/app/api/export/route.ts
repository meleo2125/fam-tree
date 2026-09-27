import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const people = await prisma.person.findMany({
    orderBy: { createdAt: "asc" },
  });
  const relationships = await prisma.relationship.findMany({
    orderBy: { createdAt: "asc" },
  });

  const body = JSON.stringify({ people, relationships }, null, 2);
  const filename = `family-tree-export-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
