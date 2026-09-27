"use server";

import { prisma } from "@/lib/prisma";
import { personSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";

export async function createPerson(data: unknown) {
  const parsed = personSchema.parse(data);
  const person = await prisma.person.create({
    data: {
      name: parsed.name,
      gender: parsed.gender || null,
      dob: parsed.dob ? new Date(parsed.dob) : null,
      dobPrecision: parsed.dobPrecision || "full",
      phone: parsed.phone || null,
      email: parsed.email || null,
      currentPlace: parsed.currentPlace || null,
      nativePlace: parsed.nativePlace || null,
      occupation: parsed.occupation || null,
      bloodGroup: parsed.bloodGroup || null,
      deceased: parsed.deceased ?? false,
      deathDate: parsed.deathDate ? new Date(parsed.deathDate) : null,
      notes: parsed.notes || null,
    },
  });
  revalidatePath("/");
  revalidatePath("/tree");
  return person;
}

export async function updatePerson(id: string, data: unknown) {
  const parsed = personSchema.parse(data);
  const person = await prisma.person.update({
    where: { id },
    data: {
      name: parsed.name,
      gender: parsed.gender || null,
      dob: parsed.dob ? new Date(parsed.dob) : null,
      dobPrecision: parsed.dobPrecision || "full",
      phone: parsed.phone || null,
      email: parsed.email || null,
      currentPlace: parsed.currentPlace || null,
      nativePlace: parsed.nativePlace || null,
      occupation: parsed.occupation || null,
      bloodGroup: parsed.bloodGroup || null,
      deceased: parsed.deceased ?? false,
      deathDate: parsed.deathDate ? new Date(parsed.deathDate) : null,
      notes: parsed.notes || null,
    },
  });
  revalidatePath("/");
  revalidatePath("/tree");
  return person;
}

export async function deletePerson(id: string) {
  await prisma.relationship.deleteMany({
    where: { OR: [{ personAId: id }, { personBId: id }] },
  });
  await prisma.person.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/tree");
}

export async function uploadPersonPhoto(personId: string, formData: FormData) {
  const { put, del } = await import("@vercel/blob");
  const file = formData.get("photo") as File | null;
  if (!file) throw new Error("No file provided");
  const existing = await prisma.person.findUnique({
    where: { id: personId },
    select: { photoUrl: true },
  });
  const blob = await put(`people/${personId}-${Date.now()}-${file.name}`, file, {
    access: "public",
  });
  if (existing?.photoUrl) {
    try {
      await del(existing.photoUrl);
    } catch {
      // old blob already gone — ignore
    }
  }
  await prisma.person.update({
    where: { id: personId },
    data: { photoUrl: blob.url },
  });
  revalidatePath("/");
  revalidatePath("/tree");
  return blob.url;
}

export async function getPersonDetail(id: string) {
  const person = await prisma.person.findUnique({
    where: { id },
  });
  if (!person) return null;

  // Parents: PARENT_CHILD where personBId = person.id
  const parentRels = await prisma.relationship.findMany({
    where: { type: "PARENT_CHILD", personBId: id },
    include: { personA: true },
  });
  const parents = parentRels.map((r) => ({ ...r.personA, relationshipId: r.id }));

  // Children: PARENT_CHILD where personAId = person.id
  const childRels = await prisma.relationship.findMany({
    where: { type: "PARENT_CHILD", personAId: id },
    include: { personB: true },
  });
  const children = childRels.map((r) => ({ ...r.personB, relationshipId: r.id }));

  // Spouses: SPOUSE where personAId = person.id or personBId = person.id
  const spouseRels = await prisma.relationship.findMany({
    where: {
      type: "SPOUSE",
      OR: [{ personAId: id }, { personBId: id }],
    },
    include: { personA: true, personB: true },
  });
  const spouses = spouseRels.map((r) => {
    const spouse = r.personAId === id ? r.personB : r.personA;
    return {
      ...spouse,
      marriageDate: r.marriageDate,
      status: r.status,
      relationshipId: r.id,
    };
  });

  return {
    person,
    parents,
    children,
    spouses,
  };
}
