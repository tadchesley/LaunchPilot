# LaunchPilot — AI Agency Operating System

## Original Problem Statement
Build an AI-powered SaaS platform combining website deployment, AI audits, lead generation, outreach automation, and CRM — an all-in-one agency operating system. Inspired by SiteDrop.ai + Vercel + Apollo.io + HubSpot + Instantly.ai.

## Tech Stack (per environment)
- Frontend: React 19 + React Router v7 + Tailwind + Shadcn UI + Framer Motion
- Backend: FastAPI + Motor (MongoDB)
- AI: Claude Sonnet 4.5 via Emergent Universal LLM Key (emergentintegrations)
- Auth: JWT email/password + Emergent-managed Google OAuth

## User Personas
- Web agency owner — wins clients via outreach, audits, redesigns
- Freelancer / Marketer — needs lead-gen + deployments + CRM in one tool
- Developer — uses deployments + monitoring

## v1 Scope (MVP — done)
- [x] Landing page with hero, features bento grid, pricing, CTA
- [x] Auth: email/password (JWT) + Emergent Google OAuth + AuthCallback
- [x] Dashboard with KPI cards
- [x] Project deployments (upload ZIP/URL, list, status, rollback)
- [x] AI Website Audit (scores + AI recommendations via Claude)
- [x] Lead Finder (search + opportunity score, seeded mock data)
- [x] AI Outreach generator + campaigns list
- [x] CRM kanban pipeline (New → Contacted → Qualified → Proposal → Won/Lost)
- [x] Settings (profile, integrations)

## P1 Backlog (post-MVP)
- Visual website editor (drag-drop)
- Real outreach sending via SMTP/Gmail
- Stripe billing + usage metering
- Real lead provider integration (Apollo)
- Website monitoring + uptime alerts
- White-label client portal
- Template marketplace
- AI redesign preview generation (image gen)

## Implemented Endpoints
- /api/auth/register, /api/auth/login, /api/auth/me, /api/auth/logout, /api/auth/session
- /api/projects (CRUD), /api/projects/:id/deploy
- /api/audits (run + list), /api/audits/:id
- /api/leads (list/search/seed), /api/leads/:id
- /api/outreach/generate, /api/campaigns (CRUD)
- /api/crm/contacts (CRUD with stage)
- /api/dashboard/stats
