# Family Tree App — Build Specification (v1)

A private web app to map an Indian family tree: add people, link relationships (marriage, parent-child), search by name/phone/place, and browse the tree visually. Next.js on Vercel, installable on Android via "Add to Home Screen." This document is a complete spec, not a set of options — every architectural decision below is final.

---

## Instructions for the building agent

- **Every decision in this document is final.** Do not choose between alternatives, do not introduce libraries not listed here, do not restructure the file layout in section 2. Implement exactly what's specified.
- **Ask before starting only if something here is genuinely missing or contradicts itself.** Otherwise, do not ask — just build, following the build order in section 10 top to bottom.
- **Build the whole thing in one continuous pass**, in the order given in section 10. Don't pause for approval between sections.
- Deliverable is the working project code in the repo/workspace you're given — no packaging step required.

---

## 1. Deployment & access

- Vercel's Hobby (free) plan makes the production URL **publicly accessible by default**.
- This app holds real names, phone numbers, and DOBs, so it ships with auth from the first deploy — see section 4 (Auth) below. Do not deploy without it.

---

## 2. Stack & exact dependencies

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript |
| Database | Neon Postgres (free tier) |
| ORM | Prisma |
| Auth | Custom single-password cookie gate (section 4) — **no NextAuth/Auth.js, no user accounts** |
| Backend | Server Actions for mutations; Route Handlers only for search, tree-graph fetch, and export download (section 6) |
| Photo storage | Vercel Blob (`@vercel/blob`) |
| Tree rendering | `reactflow` — handles zoom/pan/drag/click; layout coordinates are computed by our own function (section 7), react-flow does not auto-layout |
| Styling | Tailwind CSS |
| Validation | `zod` |
| Icons | `lucide-react` |
| Fonts | `Poppins` (headings), `Inter` (body) via `next/font/google` |
| PWA | `next-pwa` |
| Hosting | Vercel |

`package.json` dependencies to install:
```
next react react-dom @prisma/client reactflow zod lucide-react next-pwa @vercel/blob
```
Dev dependencies:
```
typescript @types/react @types/node prisma tailwindcss postcss autoprefixer
```

---

## 3. Full project file structure

Create exactly this structure:

```
family-tree-app/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── page.tsx                  # Search page "/"
│   │   ├── tree/
│   │   │   └── page.tsx              # "/tree"
│   │   ├── settings/
│   │   │   └── page.tsx              # export/import UI
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── api/
│   │   │   ├── people/
│   │   │   │   └── route.ts          # GET search
│   │   │   ├── tree/
│   │   │   │   └── route.ts          # GET graph for react-flow
│   │   │   └── export/
│   │   │       └── route.ts          # GET JSON download
│   │   └── actions/
│   │       ├── auth.ts               # login/logout server actions
│   │       ├── people.ts             # person CRUD + photo upload server actions
│   │       └── relationships.ts      # relationship CRUD server actions
│   ├── components/
│   │   ├── SearchBar.tsx
│   │   ├── PersonCard.tsx
│   │   ├── PersonDetailPanel.tsx
│   │   ├── PersonForm.tsx
│   │   ├── PhotoUpload.tsx
│   │   ├── RelationshipPicker.tsx
│   │   ├── TreeView.tsx
│   │   ├── TreeNode.tsx
│   │   └── LoginForm.tsx
│   ├── lib/
│   │   ├── prisma.ts                 # Prisma client singleton
│   │   ├── auth.ts                   # session token create/verify (Web Crypto)
│   │   ├── treeLayout.ts             # generation-layout algorithm
│   │   └── validation.ts             # zod schemas
│   ├── types/
│   │   └── index.ts
│   └── middleware.ts
├── public/
│   ├── manifest.json
│   ├── icon-192.png
│   ├── icon-512.png
│   └── favicon.ico
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## 4. Auth — exact implementation

No NextAuth, no user table, no OAuth. One shared family password, checked against an env var, backed by a signed cookie. Uses Web Crypto (`crypto.subtle`), which works in both the Edge middleware runtime and Node — no extra crypto library needed.

**Env vars** (`.env.example`):
```
DATABASE_URL="postgresql://..."
AUTH_PASSWORD="Fam@2125"
AUTH_SECRET="generate-a-long-random-string-here"
BLOB_READ_WRITE_TOKEN="auto-filled-by-vercel-when-blob-store-is-connected"
```

**`src/lib/auth.ts`**:
```ts
const encoder = new TextEncoder();

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function expectedSessionValue(): Promise<string> {
  const data = encoder.encode(`${process.env.AUTH_PASSWORD}:${process.env.AUTH_SECRET}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bufToHex(digest);
}

export async function isValidPassword(input: string): Promise<boolean> {
  return input === process.env.AUTH_PASSWORD;
}

export async function isValidSessionCookie(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const expected = await expectedSessionValue();
  return value === expected;
}
```

**`src/app/actions/auth.ts`** (Server Action, sets the cookie on successful login):
```ts
"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isValidPassword, expectedSessionValue } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!(await isValidPassword(password))) {
    redirect("/login?error=1");
  }
  const value = await expectedSessionValue();
  cookies().set("family_tree_session", value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  redirect("/");
}

export async function logoutAction() {
  cookies().delete("family_tree_session");
  redirect("/login");
}
```

**`src/middleware.ts`**:
```ts
import { NextRequest, NextResponse } from "next/server";
import { isValidSessionCookie } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/login") || pathname.startsWith("/manifest.json") || pathname.startsWith("/icon")) {
    return NextResponse.next();
  }
  const cookie = request.cookies.get("family_tree_session")?.value;
  if (!(await isValidSessionCookie(cookie))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

`src/app/login/page.tsx` renders `<LoginForm />`, a plain form posting to `loginAction` with a single password input. That's the entire auth system.

---

## 5. Data model — exact Prisma schema

**`prisma/schema.prisma`**:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum RelationshipType {
  PARENT_CHILD
  SPOUSE
}

enum MarriageStatus {
  MARRIED
  DIVORCED
  WIDOWED
}

model Person {
  id           String    @id @default(cuid())
  name         String
  gender       Gender?
  dob          DateTime?
  dobPrecision String?   // "full" | "year" | "unknown"
  phone        String?
  email        String?
  currentPlace String?
  nativePlace  String?
  occupation   String?
  bloodGroup   String?
  deceased     Boolean   @default(false)
  deathDate    DateTime?
  notes        String?
  photoUrl     String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  relationshipsAsA Relationship[] @relation("PersonA")
  relationshipsAsB Relationship[] @relation("PersonB")
}

model Relationship {
  id           String           @id @default(cuid())
  type         RelationshipType
  personAId    String
  personA      Person           @relation("PersonA", fields: [personAId], references: [id], onDelete: Cascade)
  personBId    String
  personB      Person           @relation("PersonB", fields: [personBId], references: [id], onDelete: Cascade)
  marriageDate DateTime?
  status       MarriageStatus?
  createdAt    DateTime         @default(now())

  @@unique([type, personAId, personBId])
}
```

Meaning: for `PARENT_CHILD`, `personA` = parent, `personB` = child. For `SPOUSE`, `personA`/`personB` order doesn't matter — always query both directions. A person's children = all `Relationship` rows of type `PARENT_CHILD` where `personAId = person.id`; a person's parents = rows where `personBId = person.id`.

**`src/lib/prisma.ts`**:
```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

---

## 6. Backend — Server Actions & Route Handlers

### Server Actions

**`src/app/actions/people.ts`**:
```ts
"use server";
import { prisma } from "@/lib/prisma";
import { personSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";

export async function createPerson(data: unknown) {
  const parsed = personSchema.parse(data);
  const person = await prisma.person.create({ data: parsed });
  revalidatePath("/");
  revalidatePath("/tree");
  return person;
}

export async function updatePerson(id: string, data: unknown) {
  const parsed = personSchema.parse(data);
  const person = await prisma.person.update({ where: { id }, data: parsed });
  revalidatePath("/");
  revalidatePath("/tree");
  return person;
}

export async function deletePerson(id: string) {
  await prisma.relationship.deleteMany({ where: { OR: [{ personAId: id }, { personBId: id }] } });
  await prisma.person.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/tree");
}

export async function uploadPersonPhoto(personId: string, formData: FormData) {
  const { put, del } = await import("@vercel/blob");
  const file = formData.get("photo") as File | null;
  if (!file) throw new Error("No file provided");
  const existing = await prisma.person.findUnique({ where: { id: personId }, select: { photoUrl: true } });
  const blob = await put(`people/${personId}-${Date.now()}-${file.name}`, file, { access: "public" });
  if (existing?.photoUrl) {
    try {
      await del(existing.photoUrl);
    } catch {
      // old blob already gone — ignore
    }
  }
  await prisma.person.update({ where: { id: personId }, data: { photoUrl: blob.url } });
  revalidatePath("/");
  revalidatePath("/tree");
  return blob.url;
}
```

**`src/app/actions/relationships.ts`**:
```ts
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
  if (input.personAId === input.personBId) throw new Error("A person cannot be related to themself.");
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
  people: any[];
  relationships: any[];
}) {
  const idMap = new Map<string, string>();
  for (const p of payload.people) {
    const { id: oldId, ...rest } = p;
    const created = await prisma.person.create({ data: rest });
    idMap.set(oldId, created.id);
  }
  for (const r of payload.relationships) {
    const personAId = idMap.get(r.personAId);
    const personBId = idMap.get(r.personBId);
    if (!personAId || !personBId) continue;
    await prisma.relationship.create({
      data: { type: r.type, personAId, personBId, marriageDate: r.marriageDate ? new Date(r.marriageDate) : undefined, status: r.status },
    });
  }
  revalidatePath("/");
  revalidatePath("/tree");
  return { peopleImported: payload.people.length, relationshipsImported: payload.relationships.length };
}
```

### Route Handlers

**`src/app/api/people/route.ts`** — search, debounced client-side at 300ms:
```ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const people = await prisma.person.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { currentPlace: { contains: q, mode: "insensitive" } },
        { nativePlace: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 30,
    orderBy: { name: "asc" },
  });
  return NextResponse.json(people);
}
```

**`src/app/api/tree/route.ts`** — full graph for react-flow (see section 7 for `computeTreeLayout`):
```ts
import { prisma } from "@/lib/prisma";
import { computeTreeLayout } from "@/lib/treeLayout";
import { NextResponse } from "next/server";

export async function GET() {
  const people = await prisma.person.findMany();
  const relationships = await prisma.relationship.findMany();

  const nodeInput = people.map((p) => ({
    id: p.id,
    name: p.name,
    gender: p.gender,
    deceased: p.deceased,
    parentIds: relationships.filter((r) => r.type === "PARENT_CHILD" && r.personBId === p.id).map((r) => r.personAId),
    spouseIds: relationships.filter((r) => r.type === "SPOUSE" && (r.personAId === p.id || r.personBId === p.id)).map((r) => (r.personAId === p.id ? r.personBId : r.personAId)),
  }));

  const { nodes, edges } = computeTreeLayout(nodeInput);
  return NextResponse.json({ nodes, edges });
}
```

**`src/app/api/export/route.ts`**:
```ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const people = await prisma.person.findMany();
  const relationships = await prisma.relationship.findMany();
  const body = JSON.stringify({ people, relationships }, null, 2);
  const filename = `family-tree-export-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
```

Person detail (single person + their relationships) is fetched directly inside the relevant Server Component with `prisma.person.findUnique({ where: { id }, include: {...} })` — no route needed.

---

## 7. Tree layout algorithm — exact code

react-flow renders nodes/edges wherever you place them; it does not compute genealogy layout. This function does that, then its output is passed straight into react-flow.

**`src/lib/treeLayout.ts`**:
```ts
type PersonNode = {
  id: string;
  name: string;
  gender: string | null;
  deceased: boolean;
  parentIds: string[];
  spouseIds: string[];
};

export function computeTreeLayout(people: PersonNode[]) {
  const byId = new Map(people.map((p) => [p.id, p]));
  const level = new Map<string, number>();

  function getLevel(id: string, visiting = new Set<string>()): number {
    if (level.has(id)) return level.get(id)!;
    if (visiting.has(id)) return 0; // cycle guard against bad data
    visiting.add(id);
    const p = byId.get(id);
    if (!p || p.parentIds.length === 0) {
      level.set(id, 0);
      return 0;
    }
    let max = -1;
    for (const pid of p.parentIds) {
      if (byId.has(pid)) max = Math.max(max, getLevel(pid, visiting));
    }
    const lvl = max + 1;
    level.set(id, lvl);
    return lvl;
  }
  people.forEach((p) => getLevel(p.id));

  const byLevel = new Map<number, string[]>();
  const placed = new Set<string>();
  for (const p of people) {
    if (!byLevel.has(level.get(p.id)!)) byLevel.set(level.get(p.id)!, []);
  }
  for (const p of people) {
    if (placed.has(p.id)) continue;
    const lvl = level.get(p.id)!;
    byLevel.get(lvl)!.push(p.id);
    placed.add(p.id);
    for (const sid of p.spouseIds) {
      if (!placed.has(sid) && level.get(sid) === lvl) {
        byLevel.get(lvl)!.push(sid);
        placed.add(sid);
      }
    }
  }

  const NODE_WIDTH = 200;
  const LEVEL_HEIGHT = 160;
  const nodes: { id: string; position: { x: number; y: number }; data: PersonNode; type: "personNode" }[] = [];
  for (const [lvl, ids] of byLevel) {
    ids.forEach((id, i) => {
      nodes.push({ id, position: { x: i * NODE_WIDTH, y: lvl * LEVEL_HEIGHT }, data: byId.get(id)!, type: "personNode" });
    });
  }

  const edges: { id: string; source: string; target: string; type: "parentChild" | "spouse" }[] = [];
  for (const p of people) {
    for (const pid of p.parentIds) {
      if (byId.has(pid)) edges.push({ id: `pc-${pid}-${p.id}`, source: pid, target: p.id, type: "parentChild" });
    }
    for (const sid of p.spouseIds) {
      if (p.id < sid) edges.push({ id: `sp-${p.id}-${sid}`, source: p.id, target: sid, type: "spouse" });
    }
  }

  return { nodes, edges };
}
```

`TreeView.tsx` fetches `/api/tree`, passes `nodes`/`edges` straight into `<ReactFlow nodes={nodes} edges={edges} nodeTypes={{ personNode: TreeNode }} />`. `TreeNode.tsx` renders the styled card (section 8) and calls `onClick` to open `PersonDetailPanel` with that node's `id`.

Roots (people with `parentIds.length === 0`) naturally land at `level 0` wherever they are — this is what gives multi-root support for free: unconnected branches just render as separate clusters on the same canvas.

---

## 8. Design tokens — exact Tailwind config

**`tailwind.config.ts`**:
```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "media",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: "#FBF6EF", dark: "#1B1614" },
        surface: { DEFAULT: "#FFFFFF", dark: "#26201D" },
        primary: { DEFAULT: "#8C2F39", dark: "#C4525C" },
        accent: { DEFAULT: "#C79A3C", dark: "#D9B25E" },
        textPrimary: { DEFAULT: "#2A1E18", dark: "#F1E9DE" },
        textSecondary: { DEFAULT: "#6B5D52", dark: "#B8A896" },
        border: { DEFAULT: "#E4D8C6", dark: "#3A322C" },
        male: "#4B6E8A",
        female: "#A85A73",
      },
      fontFamily: {
        heading: ["Poppins", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};
export default config;
```

- Headings use `font-heading`, body text `font-body` (both loaded via `next/font/google` in `layout.tsx` and exposed as CSS variables matching the names above).
- Tree node card (`TreeNode.tsx`): `rounded-card border-2 border-accent bg-surface shadow-md p-3`, a 32px circular thumbnail (`photoUrl` if set, else initials on a `male`/`female`/neutral background) above the name, name in `font-heading text-textPrimary`, dob in `font-body text-sm text-textSecondary`. Gender sets a 4px left border in `male`/`female`.
- Deceased person: whole card at `opacity-60` with the accent border, no strikethrough text.
- Spouse edge (custom react-flow edge type `"spouse"`): solid line in `accent` color with a small ring icon (`lucide-react`'s `Link2` icon, rotated, at the edge midpoint via react-flow's `EdgeLabelRenderer`).
- Parent-child edge (`"parentChild"`): solid line, `textSecondary` color, smoothstep path.

---

## 9. Pages & components — exact behavior

### `src/app/page.tsx` (Search, `/`)
- Renders `<SearchBar />` (controlled input, 300ms debounce, calls `GET /api/people?q=`) and a list of `<PersonCard />` results.
- `PersonCard` shows a 40px circular thumbnail on the left (`photoUrl` if set, else an initials placeholder), name, dob/age, currentPlace, and (if present) a one-line spouse hint fetched alongside the search result.
- Floating "+ Add Person" button (bottom-right, `bg-primary`) opens `PersonForm` in create mode inside `PersonDetailPanel`.
- Tapping a card opens `PersonDetailPanel` in view mode for that person's `id`.

### `src/app/tree/page.tsx` (`/tree`)
- Renders `<TreeView />` (client component, wraps `ReactFlow`).
- A `<select>` above the canvas lists all people; picking one calls `fitView` centered on that node's subtree (client-side, filters nodes/edges already fetched — no extra API call needed since the whole graph is small enough to fetch once).

### `PersonDetailPanel.tsx`
- Slide-over panel (fixed to the right on desktop, full-screen on mobile — `w-full sm:w-96 fixed inset-y-0 right-0 bg-surface shadow-xl`).
- View mode: a 96px circular photo (or initials placeholder) at the top, then all `Person` fields laid out in a definition-list style, plus a "Relationships" section listing parents/spouse(s)/children as tappable `PersonCard`-style rows (tapping one re-opens the panel for that person — keep a simple in-memory navigation stack so a "back" chevron works).
- Edit mode: renders `<PersonForm initialData={person} />`.
- "Add relationship" row of three buttons: **Add spouse**, **Add parent**, **Add child** — each opens `RelationshipPicker`.
- Delete button at the bottom, `confirm()` browser dialog before calling `deletePerson`.

### `PersonForm.tsx`
Fields, in this order: name (required, text), gender (select: Male/Female/Other/unset), dob (date input) + dobPrecision (select: Full date/Year only/Unknown, defaults to "Full date"), phone (tel), email (email), currentPlace (text), nativePlace (text), occupation (text), bloodGroup (select: A+/A-/B+/B-/AB+/AB-/O+/O-/Unknown), deceased (checkbox) → reveals deathDate (date) when checked, notes (textarea).
Validated client-side with the same `zod` schema used server-side (`lib/validation.ts`, imported into both).

At the top of the form, above the `name` field, render `<PhotoUpload personId={person?.id} currentUrl={person?.photoUrl} />`. **Photo upload requires an existing person id**, so on the create flow: submit the base form first (via `createPerson`), then re-render the same panel in edit mode for the newly-created person — the photo control becomes active at that point. Don't try to upload a photo before the person record exists.

### `PhotoUpload.tsx`
- If no `personId` (still in create mode): render nothing, or a greyed-out placeholder circle with the text "Save first to add a photo."
- If `personId` present: a circular preview (96px) — `currentUrl` as `<img>` if set, else initials-on-color placeholder (first letter of name, background from `male`/`female`/neutral accent) — with a small camera icon overlay button.
- Clicking the button opens a native file picker (`<input type="file" accept="image/*" className="hidden">` triggered via ref). On file selection, immediately build a `FormData` with the file under key `"photo"` and call `uploadPersonPhoto(personId, formData)`; show a small spinner over the circle while the action is pending (`useTransition`); on success, update the displayed image to the returned URL.
- No client-side cropping/resizing in v1 — accept whatever the phone camera/gallery gives; Vercel Blob serves it as-is. `accept="image/*"` and a 5MB soft warning in the UI is enough guarding for v1.

### `RelationshipPicker.tsx`
- A search input (reuses the `/api/people?q=` route) to find an existing person, **or** a "Create new person" toggle that shows a mini `PersonForm` inline.
- For "Add spouse": on submit, calls `createRelationship({ type: "SPOUSE", personAId: currentId, personBId: chosenId, marriageDate, status })` — marriageDate and status are optional fields shown in this picker only when type is spouse.
- For "Add parent" / "Add child": calls `createRelationship({ type: "PARENT_CHILD", personAId: parentId, personBId: childId })`, with `personAId`/`personBId` assigned based on which direction was clicked.

### `src/app/settings/page.tsx`
- "Export" button: plain `<a href="/api/export" download>` — browser handles the download natively, no JS needed.
- "Import" section: `<input type="file" accept="application/json">`, on change parses the file client-side with `JSON.parse`, shows a preview (`"12 people, 15 relationships found"`) computed from `payload.people.length` / `payload.relationships.length`, then a confirm button that calls the `importTree` Server Action with the parsed payload.

### `src/lib/validation.ts`
```ts
import { z } from "zod";

export const personSchema = z.object({
  name: z.string().min(1),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  dob: z.string().optional(),
  dobPrecision: z.enum(["full", "year", "unknown"]).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  currentPlace: z.string().optional(),
  nativePlace: z.string().optional(),
  occupation: z.string().optional(),
  bloodGroup: z.string().optional(),
  deceased: z.boolean().default(false),
  deathDate: z.string().optional(),
  notes: z.string().optional(),
});
```

---

## 10. PWA setup — exact config

1. Install `next-pwa`.
2. **`next.config.js`**:
```js
const withPWA = require("next-pwa")({ dest: "public" });
module.exports = withPWA({ reactStrictMode: true });
```
3. **`public/manifest.json`**:
```json
{
  "name": "Family Tree",
  "short_name": "FamilyTree",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FBF6EF",
  "theme_color": "#8C2F39",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```
4. Link it in `layout.tsx`'s `<head>`: `<link rel="manifest" href="/manifest.json" />` and `<meta name="theme-color" content="#8C2F39" />`.
5. Icons: generate two square PNGs (192px, 512px) — a simple monogram or tree glyph on the `#8C2F39` primary color works fine; exact artwork isn't specified, any reasonable placeholder is acceptable.
6. On Android Chrome, visiting the deployed URL triggers the native "Add to Home Screen" / install prompt once the manifest + service worker are present — no Play Store step.

---

## 11. Build order

Build in this exact order — each step only depends on the ones before it:

1. `npx create-next-app@latest` with TypeScript, Tailwind, App Router, `src/` directory — matching section 3's structure.
2. Install all dependencies from section 2.
3. Write `prisma/schema.prisma` (section 5), run `npx prisma migrate dev --name init` against the Neon connection string.
4. Write `src/lib/prisma.ts`, `src/lib/auth.ts`, `src/lib/validation.ts`, `src/lib/treeLayout.ts`.
5. Write `src/middleware.ts` and `src/app/actions/auth.ts`; build `src/app/login/page.tsx` + `LoginForm.tsx`. Confirm the login/redirect loop works before continuing.
6. Apply `tailwind.config.ts` (section 8), set up fonts in `layout.tsx`, write `globals.css`.
7. Write `src/app/actions/people.ts` and `src/app/actions/relationships.ts`.
8. Write the three Route Handlers (section 6).
9. Build components in this order: `PersonForm` → `PhotoUpload` → `PersonCard` → `SearchBar` → `PersonDetailPanel` → `RelationshipPicker` → `TreeNode` → `TreeView`.
10. Wire up `src/app/page.tsx` (Search) and `src/app/tree/page.tsx` (Tree).
11. Build `src/app/settings/page.tsx` (export/import).
12. Add PWA config + manifest + icons (section 10).
13. Write `.env.example` and `README.md` (setup + deploy steps, copied from section 12 below).
14. Test locally end-to-end: log in, add 3-4 people across two generations with a marriage link, confirm the tree renders both as separate levels with a spouse connector, export, wipe the DB, re-import, confirm the tree matches.

---

## 12. Deployment steps

1. Push the repo to GitHub.
2. Create a free Postgres instance at neon.tech — copy the connection string into `DATABASE_URL`.
3. In the Vercel dashboard, go to Storage → create a Blob store → connect it to this project — this auto-populates `BLOB_READ_WRITE_TOKEN` as a project env var (no manual copying needed).
4. On vercel.com → "Import Project" from GitHub (if not already imported) → add `DATABASE_URL`, `AUTH_PASSWORD=Fam@2125`, and `AUTH_SECRET` (a long random string, e.g. generated with `openssl rand -hex 32`) as environment variables — never commit these to the repo.
5. Run `npx prisma migrate deploy` against the production `DATABASE_URL` (locally, pointed at prod, or as a Vercel build step).
6. Deploy.
7. On your phone: open the deployed URL in Chrome → menu → "Add to Home Screen."

---

## 13. v2 ideas (explicitly out of scope for v1 — do not build these now)

- GEDCOM export/import compatibility
- "Relationship calculator" (how two people are related, in words)
- Anniversary/birthday reminders
- Read-only shareable links per branch
