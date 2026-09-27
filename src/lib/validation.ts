import { z } from "zod";

export const personSchema = z.object({
  name: z.string().min(1, "Name is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().nullable(),
  dob: z.string().optional().nullable(),
  dobPrecision: z.enum(["full", "year", "unknown"]).optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  currentPlace: z.string().optional().nullable(),
  nativePlace: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  bloodGroup: z.string().optional().nullable(),
  deceased: z.boolean().default(false),
  deathDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type PersonInput = z.infer<typeof personSchema>;
