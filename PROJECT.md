# clawjob - "JobTinder"

## Vision

A visual-first, mobile-style job swiping app. Zero walls of text. Candidates swipe through job cards featuring the hiring manager front-and-center, with recruiter info accessible via a flip card. Think Tinder, but for jobs.

## Core Concepts

- **Manager-First Hierarchy**: The direct manager's video/photo is the hero of every card. The manager is who you'd work for — they take priority.
- **Secondary HR**: Recruiter/HR info lives in a flip card below. Tap to reveal contact details.
- **Swipe UX**: Swipe right to apply, swipe left to skip. Tap buttons as an alternative.
- **No Walls of Text**: Everything is visual. Tags, short taglines, salary — no paragraphs.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, `src/` dir) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Deployment | Google Cloud Run |
| CI/CD | Cloud Build (triggered on push to `main`) |
| Container Registry | Artifact Registry (`us-central1-docker.pkg.dev/clawjob/clawjob`) |
| Docker | Multi-stage build, standalone Next.js output, port 8080 |
| Database | TBD (Cloud-native — Firestore or Cloud SQL planned) |

## GCP Project

- **Project ID**: `clawjob`
- **Project Number**: `451967687816`
- **Region**: `us-central1`
- **Cloud Run Service**: `clawjob`
- **Live URL**: `https://clawjob-yb6z4mnc2q-uc.a.run.app`

## GitHub

- **Repo**: `AmosTal/clawjob`
- **URL**: `https://github.com/AmosTal/clawjob`
- **Branch**: `main`
- **Cloud Build Connection**: `github-connection` (2nd gen, linked via GitHub App)

## Deployment Pipeline

```
git push origin main
       |
       v
Cloud Build trigger "deploy-on-push" fires
       |
       v
cloudbuild.yaml executes:
  1. Docker build (multi-stage, in Cloud Build — no local Docker needed)
  2. Push image to Artifact Registry (tagged with commit SHA + latest)
  3. Deploy to Cloud Run (512Mi, 1 CPU, unauthenticated)
       |
       v
Live at Cloud Run URL
```

No Docker required locally. Push to Git = deployed.

## Project Structure

```
src/
  app/
    layout.tsx        — Root layout, Geist font, metadata
    page.tsx          — Main page, composes SwipeDeck with sample data
    globals.css       — Tailwind v4 import, dark theme variables
  components/
    ManagerHero.tsx   — Full-bleed 70vh hero card (video/photo + gradient overlay)
    HRFlipCard.tsx    — 3D flip card (front: photo/name, back: contact info)
    ActionButtons.tsx — Skip (X) and Apply (heart) with tap animations
    SwipeDeck.tsx     — Drag-to-swipe orchestrator, composes all cards
  lib/
    types.ts          — TypeScript interfaces (JobCard, ManagerAsset, HRContact)
    data.ts           — Sample job data (5 cards)
public/
  assets/
    managers/         — Drop manager photos/videos here (e.g., marcus.jpg)
    hr/               — Drop HR/recruiter photos here (e.g., sarah.jpg)
Dockerfile            — Multi-stage: deps -> build -> standalone runner
cloudbuild.yaml       — Cloud Build pipeline config
.dockerignore         — Excludes node_modules, .git, .next, etc.
```

## Asset Convention

Components pull images from `/public/assets/` directories:

- **Managers**: `/public/assets/managers/{name}.jpg` (or `.png`, `.mp4` for video)
- **HR**: `/public/assets/hr/{name}.jpg`
- Filenames must match the `photo`/`video` paths in `src/lib/data.ts`
- If an image doesn't exist, the component falls back to showing initials

## UI Layout (Mobile-First, 430px max)

```
+-----------------------------+
|        clawjob logo         |
+-----------------------------+
|   Role Title                |
|   Company - Location        |
|   $Salary (green)           |
|   [tag] [tag] [tag]         |
+-----------------------------+
|                             |
|   MANAGER HERO (70vh)       |
|   video/photo, full-bleed   |
|   gradient overlay          |
|   Name, Title, Tagline      |
|                             |
+-----------------------------+
|    (X) Skip    (♥) Apply    |
+-----------------------------+
|   HR FLIP CARD              |
|   Front: photo, name, title |
|   Back: email, phone, CTA   |
+-----------------------------+
```

- Dark background (`bg-zinc-950`)
- Swipe right = Apply, swipe left = Skip
- Cards fly off with rotation + opacity animation
- "No more jobs! Check back later." when deck is empty

## IAM / Service Accounts

- **Cloud Build SA**: `451967687816-compute@developer.gserviceaccount.com`
  - Roles: `editor`, `run.admin`, `artifactregistry.writer`, `iam.serviceAccountUser`, `logging.logWriter`
- **Cloud Build Agent**: `service-451967687816@gcp-sa-cloudbuild.iam.gserviceaccount.com`
  - Roles: `cloudbuild.serviceAgent`, `secretmanager.admin`

## Future / TBD

- Cloud-native database (Firestore or Cloud SQL) for real job data
- Authentication for candidates
- Real manager videos and HR photos
- Application tracking / status flow
- Push notifications
- Custom domain
