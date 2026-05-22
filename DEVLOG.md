# DEVLOG.md

*This log records daily progress during the 7-day build window.*

## Day 1 — 2026-05-20

**Hours worked:** 5

**What I did:**  
Researched the Credex internship requirements in depth and broke the project down into core product, engineering, and entrepreneurial deliverables. Defined the target user profile as seed-to-Series A startup founders and engineering managers actively paying for multiple AI subscriptions or API services without clear visibility into optimization opportunities. Evaluated the required tooling ecosystem, researched official pricing structures across vendors, and began normalizing pricing data for the audit engine. Planned the system architecture, audit-engine approach, database requirements, and repository structure. Finalized the decision to use deterministic audit rules instead of AI-generated financial recommendations for consistency and explainability.

**What I learned:**  
AI tooling pricing varies significantly across vendors, especially between seat-based subscriptions and token-based API pricing models. I also learned that recommendation quality depends heavily on contextual reasoning around team size, workflow type, and feature utilization rather than simply comparing raw prices.

**Blockers / what I'm stuck on:**  
Designing clean cross-tool redundancy logic is challenging because many AI products overlap partially rather than fully. Determining when a recommendation is financially responsible versus overly aggressive requires careful rule design.

**Plan for tomorrow:**  
Initialize the Next.js TypeScript project, set up the repository structure and required markdown deliverables, configure Tailwind and core dependencies, and begin implementing the foundational multi-step input form architecture.

## Day 2 — 2026-05-21

**Hours worked:** 6

**What I did:**  
Initialized the credAI project using Next.js with TypeScript and Tailwind CSS. Set up the foundational repository structure including application folders, utility layers, audit-engine modules, and all required markdown deliverables specified in the internship requirements. Installed and configured core dependencies including shadcn/ui, Supabase client libraries, form management utilities, validation tooling, and testing dependencies. Established environment-variable handling and created the initial GitHub repository workflow structure for future CI integration. Also mapped out the initial frontend architecture for the multi-step audit flow and result-generation pipeline.

**What I learned:**  
Early architectural decisions significantly affect development speed later in the project. Using a unified full-stack framework like Next.js simplifies deployment, routing, API integration, and Open Graph generation while keeping the codebase easier to maintain within a short development timeline.

***Blockers / what I'm stuck on:**  
Finalizing the technology stack required balancing rapid development speed against long-term maintainability and scalability. A blocker I encountered was  when I evaluated trade-offs between using Supabase versus building a custom backend, choosing faster iteration speed over deeper backend control. Another consideration was using Next.js as a unified full-stack framework instead of separating frontend and backend services, which simplified deployment but introduced tighter coupling. 

**Plan for tomorrow:**  
Complete PRICING_DATA.md with normalized vendor pricing structures and begin implementing the deterministic audit-engine rules for plan-fit evaluation, savings calculations, and cross-tool recommendation logic.

## Day 3 — 2026-05-22

**Hours worked:** 8

**What I did:**  
Populated PRICING_DATA.md with normalized live pricing data for all 8 required AI tools plus extras (Windsurf and v0) matching the strict markdown syntax schema. Developed the dynamic pricing parser in `lib/pricing/parser.ts` to programmatically parse PRICING_DATA.md live at runtime, achieving complete traceability and eliminating database seeding for pricing. Implemented the core deterministic Audit Engine in `lib/audit/engine.ts` with plan-seat fit checking, same-vendor downgrades, cross-tool redundancies (Cursor/Copilot, ChatGPT/Claude), alternative tool recommendations, and the Credex bulk credit conversion flag. Developed a robust Vitest suite covering 7 unit tests for pricing parsing and audit engine logic. Documented testing commands and test cases in TESTS.md. Initialized local Git, made the initial commit containing all setup, parser, and engine assets, and pushed upstream to branch main on GitHub.

**What I learned:**  
Designing the engine to dynamically parse the markdown document itself creates an incredibly powerful single-source-of-truth. It programmatically links our user documentation with our product logic, ensuring zero discrepancies, avoiding the need for database pricing seed scripts, and allowing business-focused teams to easily maintain pricing catalogs by modifying markdown.

**Blockers / what I'm stuck on:**  
Handling edge cases in API token metrics and determining a realistic seat retention rate during redundancy checks (e.g. Claude + ChatGPT overlap) was difficult, but resolved by adopting a realistic 20% retention rate for floating ChatGPT accounts.

**Plan for tomorrow:**  
Designing database schema using supabase.
