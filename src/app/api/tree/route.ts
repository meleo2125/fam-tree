import { prisma } from "@/lib/prisma";
import { computeTreeLayout } from "@/lib/treeLayout";
import { NextResponse } from "next/server";

export async function GET() {
  const people = await prisma.person.findMany({
    orderBy: { name: "asc" },
  });
  const relationships = await prisma.relationship.findMany();

  const nodeInput = people.map((p) => ({
    id: p.id,
    name: p.name,
    gender: p.gender,
    deceased: p.deceased,
    dob: p.dob ? p.dob.toISOString() : null,
    dobPrecision: p.dobPrecision,
    photoUrl: p.photoUrl,
    parentIds: relationships
      .filter((r) => r.type === "PARENT_CHILD" && r.personBId === p.id)
      .map((r) => r.personAId),
    spouseIds: relationships
      .filter(
        (r) =>
          r.type === "SPOUSE" &&
          (r.personAId === p.id || r.personBId === p.id)
      )
      .map((r) => (r.personAId === p.id ? r.personBId : r.personAId)),
  }));

  const { nodes, edges } = computeTreeLayout(nodeInput);
  return NextResponse.json({ nodes, edges, people });
}
