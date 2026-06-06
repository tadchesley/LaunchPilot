# LaunchPilot — AI Agency Operating System

## Original Problem Statement
Build an AI-powered SaaS platform combining website deployment, AI audits, lead generation, outreach automation, and CRM — an all-in-one agency operating system. Inspired by SiteDrop.ai + Vercel + Apollo.io + HubSpot + Instantly.ai.

## Tech Stack (per environment)
- Frontend: React 19 + React Router v7 + Tailwind + Shadcn UI + Framer Motion
- Backend: FastAPI + Motor (MongoDB) + APScheduler + WeasyPrint
- AI: Claude Sonnet 4.5 via Emergent Universal LLM Key (emergentintegrations)
- Auth: JWT email/password + Emergent-managed Google OAuth
- Storage: Emergent built-in object storage
- Leads source: OpenStreetMap Overpass + Nominatim (free, no API key)

## User Personas
- Web agency owner — wins clients via outreach, audits, redesigns
- Freelancer / Marketer — needs lead-gen + deployments + CRM in one tool
- Developer — uses deployments + monitoring

## Iteration 1 — MVP (done)
- [x] Email/password (JWT) + Emergent Google OAuth
- [x] Dashboard KPIs
- [x] Projects + deployment history
- [x] AI website audits (Claude scores + issues + recommendations)
- [x] Lead Finder (seeded pool)
- [x] AI outreach generator + campaigns
- [x] CRM kanban (7 stages)
- [x] Settings

## Iteration 2 — Real integrations + simpler UI (done)
- [x] Real ZIP deploys (Emergent object storage extracts and serves)
- [x] Real lead source (OSM Overpass + Nominatim — free, no key)
- [x] CSV lead import
- [x] Uptime monitoring (5-min APScheduler) + in-app notifications
- [x] PDF audit export (WeasyPrint)
- [x] White-label client portal (public share links with brand)
- [x] Brand settings (name, color, logo upload)
- [x] Globally simplified UI (plain-English labels, removed testimonials)

## P1 Backlog (post v2)
- Stripe billing + plan enforcement
- Real outreach sending (Resend/SMTP/Gmail)
- Visual website editor (drag-drop sections)
- Audit deduplication on repeated OSM lookups
- Team workspaces + roles
- Apollo / Hunter.io BYO API key option
- Template marketplace

## Implemented Endpoints
- /api/auth/* — register, login, me, logout, session (Emergent OAuth exchange)
- /api/projects, /api/projects/:id, /api/projects/:id/deploy, /api/projects/upload (ZIP)
- /api/sites/{slug}/{path} — public static site serving from object storage
- /api/audits — run + list + get; /api/audits/{id}/share + /api/audits/{id}/pdf
- /api/portal/audit/{token} (public read-only audit) + /api/portal/audit/{token}/pdf
- /api/leads (search w/ optional source=real for OSM); /api/leads/import (CSV); /api/leads/filters
- /api/outreach/generate; /api/outreach/drafts; /api/campaigns CRUD
- /api/crm/contacts CRUD + /api/crm/contacts/{id}/stage; /api/dashboard/stats
- /api/monitoring/{project_id} + /check; /api/notifications + /read-all
- /api/brand (GET/POST); /api/uploads/logo; /api/assets/{path}
