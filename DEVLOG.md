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
