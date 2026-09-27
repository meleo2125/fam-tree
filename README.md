# Family Tree App

A private web application to map an Indian family tree: add people, link relationships (marriage, parent-child), search by name/phone/place, and browse the tree visually. Built with Next.js 15 (App Router), Prisma, Neon Postgres, Tailwind CSS, React Flow, and installable on Android/iOS via PWA ("Add to Home Screen").

---

## Features

- **Single-Password Gate**: Custom Web Crypto signed cookie session gate (`/login`). No user accounts, shared family password.
- **Directory Search (`/`)**: Instant debounced search by name, phone number, native place, and current place with spouse relationship hints.
- **Interactive Visual Tree (`/tree`)**: Zoom, pan, and click genealogy tree canvas powered by `reactflow` with custom generational layout algorithm and styled nodes.
- **Rich Person Detail Slide-Over**: Full personal details, date of birth / age, native and current residences, blood group, deceased status, linked parents, spouses, and children with an in-memory back-navigation history.
- **Relationship Management**: Link spouses (with marriage dates and status), parents, and children to existing members or create new members inline.
- **Photo Uploads**: Direct photo upload backed by Vercel Blob (`@vercel/blob`) with automatic cleanup.
- **Export & Import (`/settings`)**: Download complete JSON backup archives and restore/merge records seamlessly.
- **Progressive Web App (PWA)**: Installable standalone app with offline service worker and native home screen support.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Database**: PostgreSQL (Neon Postgres recommended)
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Visual Graph**: React Flow (`reactflow`)
- **Storage**: Vercel Blob (`@vercel/blob`)
- **PWA**: `next-pwa`
- **Icons**: `lucide-react`
- **Validation**: `zod`

---

## Local Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Provide your PostgreSQL connection string in `DATABASE_URL`, set `AUTH_PASSWORD`, and generate `AUTH_SECRET` (e.g. `openssl rand -hex 32`).

3. **Initialize Prisma & Database**:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment Steps

1. Push the repo to GitHub.
2. Create a free Postgres instance at [neon.tech](https://neon.tech) — copy the connection string into `DATABASE_URL`.
3. In the Vercel dashboard, go to **Storage** → create a **Blob store** → connect it to this project — this auto-populates `BLOB_READ_WRITE_TOKEN` as a project environment variable.
4. On [vercel.com](https://vercel.com) → **Import Project** from GitHub → configure environment variables:
   - `DATABASE_URL`: Your Neon Postgres connection string
   - `AUTH_PASSWORD`: `Fam@2125` (or your chosen password)
   - `AUTH_SECRET`: A long random secret (e.g. generated with `openssl rand -hex 32`)
5. Run migrations against production:
   ```bash
   DATABASE_URL="your-neon-url" npx prisma migrate deploy
   ```
   *(or add `npx prisma migrate deploy && next build` as your Vercel build command).*
6. Deploy the project.
7. On your mobile phone: open the deployed URL in Chrome → tap the browser menu (three dots) → **"Add to Home Screen"** or **"Install App"**.
