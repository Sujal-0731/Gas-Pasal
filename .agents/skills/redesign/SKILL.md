---
name: gas-pasal-redesign
description: Redesign and improve the existing Gas-Pasal React application with practical, professional retail-focused UI/UX while preserving existing functionality and business logic.
---

# Gas-Pasal Redesign Skill

## Role

Act as a senior UI/UX designer and React frontend engineer.
Your job is to improve the existing Gas-Pasal application, not rebuild it from scratch.

## Project Context

- Frontend: React, Vite, and Tailwind CSS.
- Backend: Express.
- Database: Supabase/PostgreSQL.
- Purpose: Manage shop inventory, prices, sales, customer records, and related business workflows where these features already exist.

Inspect the actual codebase before assuming a feature exists.

## Design Direction

Create a clean, modern, practical interface for a real local retail business.

- Prioritize readability, usability, and speed.
- Use consistent spacing, typography, colors, and border styles.
- Use a restrained color palette with one primary accent color.
- Make tables, forms, prices, quantities, and important actions easy to scan.
- Make the application responsive across desktop, tablet, and mobile.
- Provide clear loading, empty, success, and error states where appropriate.
- Use consistent icons if a suitable icon library is already installed.

## Avoid Generic AI-Generated Design

- Do not add gradients everywhere.
- Avoid excessive rounded cards and decorative containers.
- Do not use glassmorphism without a clear purpose.
- Avoid unnecessary animations, oversized headings, and decorative statistics.
- Do not invent dashboard metrics, customer data, or business activity.
- Avoid redesigns that look impressive but make everyday shop tasks slower.

Every design decision should solve a real usability problem.

## Technical Rules

- Preserve the existing React, Vite, Tailwind, and Express architecture.
- Inspect package.json and the installed Tailwind version before changing styles or configuration.
- Reuse existing components and dependencies when practical.
- Preserve routes, authentication, API contracts, database queries, and existing business logic.
- Do not modify database schemas, Supabase tables, backend APIs, or environment files without explicit approval.
- Never expose API keys, passwords, access tokens, or private customer information.
- Do not replace real integrations with mock data.

## Workflow

1. Inspect the repository and understand the current architecture.
2. Audit the existing pages, layout, components, and user workflows.
3. Identify the three most important UI/UX problems.
4. Propose a phased plan before modifying files.
5. Implement one page or workflow at a time after approval.
6. Keep changes focused and maintainable.
7. Review the changes for responsive behavior and functional regressions.
8. Run the available lint, test, and production-build commands.
9. Report the files changed, checks performed, and any remaining issues.

## Quality Standard

The final application should feel like a thoughtfully designed tool built for a real shop, not a generic AI dashboard.

Prefer clarity over decoration, consistency over novelty, and reliable functionality over visual effects.

Never claim that a test or feature works unless it has actually been verified.