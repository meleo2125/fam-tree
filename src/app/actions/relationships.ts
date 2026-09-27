"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createRelationship(input: {
  type: "PARENT_CHILD" | "SPOUSE";
  personAId: string;
  personBId: string;
  marriageDate?: string;
  status?: "MARRIED" | "DIVORCED" | "WIDOWED";
}) {
  if (input.personAId === input.personBId) {
    throw new Error("A person cannot be related to themself.");
  }

  // Check if relation already exists in either direction for SPOUSE
  if (input.type === "SPOUSE") {
    const existing = await prisma.relationship.findFirst({
      where: {
        type: "SPOUSE",
        OR: [
          { personAId: input.personAId, personBId: input.personBId },
          { personAId: input.personBId, personBId: input.personAId },
        ],
      },
    });
    if (existing) {
      throw new Error("These individuals are already registered as spouses.");
    }
  }

  const rel = await prisma.relationship.create({
    data: {
      type: input.type,
      personAId: input.personAId,
      personBId: input.personBId,
      marriageDate: input.marriageDate ? new Date(input.marriageDate) : undefined,
      status: input.status,
    },
  });
  revalidatePath("/");
  revalidatePath("/tree");
  return rel;
}

export async function deleteRelationship(id: string) {
  await prisma.relationship.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/tree");
}

export async function importTree(payload: {
  people: Array<{
    id: string;
    name: string;
    gender?: any;
    dob?: string | Date | null;
    dobPrecision?: string | null;
    phone?: string | null;
    email?: string | null;
    currentPlace?: string | null;
    nativePlace?: string | null;
    occupation?: string | null;
    bloodGroup?: string | null;
    deceased?: boolean;
    deathDate?: string | Date | null;
    notes?: string | null;
    photoUrl?: string | null;
    createdAt?: any;
    updatedAt?: any;
  }>;
  relationships: Array<{
    id?: string;
    type: "PARENT_CHILD" | "SPOUSE";
    personAId: string;
    personBId: string;
    marriageDate?: string | Date | null;
    status?: any;
  }>;
}) {
  const idMap = new Map<string, string>();

  for (const p of payload.people) {
    const oldId = p.id;
    const { id, createdAt, updatedAt, ...rest } = p as Record<string, unknown>;
    void id;
    void createdAt;
    void updatedAt;
    const created = await prisma.person.create({
      data: {
        ...(rest as any),
        dob: rest.dob ? new Date(rest.dob as string) : null,
        deathDate: rest.deathDate ? new Date(rest.deathDate as string) : null,
      },
    });
    idMap.set(oldId, created.id);
  }

  let relCount = 0;
  for (const r of payload.relationships) {
    const personAId = idMap.get(r.personAId);
    const personBId = idMap.get(r.personBId);
    if (!personAId || !personBId) continue;
    await prisma.relationship.create({
      data: {
        type: r.type,
        personAId,
        personBId,
        marriageDate: r.marriageDate ? new Date(r.marriageDate) : undefined,
        status: r.status,
      },
    });
    relCount++;
  }

  revalidatePath("/");
  revalidatePath("/tree");
  return {
    peopleImported: payload.people.length,
    relationshipsImported: relCount,
  };
}
