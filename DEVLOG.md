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

## Day 4 — 2026-05-23

**Hours worked:** 8

**What I did:**  
Designed and implemented the core database schema DDL migrations for `audits` and `leads` tables in Supabase, saved under `lib/db/schema.sql`. Created the Supabase client singleton in `lib/db/supabase.ts`. Developed robust server-side POST and GET API endpoints under `app/api/audit/save/route.ts` and `app/api/audit/fetch/route.ts` to execute computations and securely log audit records and marketing leads. Fully redesigned the main wizard (`app/page.tsx`) and dynamic shared public report pages (`app/audit/[slug]/page.tsx`) using the FUI (Fictional User Interface) / Industrial Brutalism Lite design system—replacing modern SaaS rounded cards with 1px grid divider lines, absolute corner brackets, high-contrast cyber volt-green highlights, and compact monospace layouts. Wired the multi-step form to database APIs to dynamically generate real UUID shared slugs and copy paths to the clipboard. Configured dynamic Open Graph metadata for rich social link previews.

**What I learned:**  
Next.js 15 dynamic routing parameters are compiled as Promises on the server side, which requires async promise wrapping when rendering dynamically fetched data. Additionally, decoupling standard browser pages from Node.js dependencies prevents silent loading crashes.

**Blockers / what I'm stuck on:**  
1. **Window Reference Hydration Crash**: Encountered an issue where referencing `window.location.origin` inside the Client Component JSX threw a server-side ReferenceError during pre-compilation, crashing client-side React hydration and leaving all buttons unwired. Fixed it by storing the origin in state and populating it after mounting.
2. **Node.js / Next.js Import Conflict**: Importing types directly from the server-side engine caused Webpack to compile Node built-ins (`fs`/`path`) for the browser, crashing execution. Solved this by removing the backend engine import and declaring types locally.
3. **Tailwind CSS Compilation**: Tailwind styling was initially uncompiled because standard Next.js loaders failed to recognize `.mjs` extensions for PostCSS configurations. Resolved it by creating a standard CommonJS `postcss.config.js` and purging the compilation cache `.next`.

**Plan for tomorrow:**  
Integrate AI workflow pipelines (Anthropic API) for personalized text-summarization recommendations, and continue expanding testing suites.

## Day 5 — 2026-05-24

**Hours worked:** 6

**What I did:**  
Integrated the Gemini LLM dynamic text pipeline to generate ~100-word personalized stack summaries directly inside the audit results payload. Documented the full prompt engineering structure, model criteria (Gemini 2.5 Flash), and reasoning in `PROMPTS.md`. Modified the server-side save route (`app/api/audit/save/route.ts`) to query the Gemini REST API directly using fetch and inject the result under `calculatedResult.aiSummary`. Implemented a robust mathematical fallback template text compiler (`generateFallbackSummary`) to guarantee 100% service uptime even if the API key is missing or calls fail. Styled the front-end components on both Step 4 of the wizard (`app/page.tsx`) and the dynamic shared public report pages (`app/audit/[slug]/page.tsx`) with a premium FUI bracketed box labeled `[ METRIC_SYNTHESIS_REPORT // COGNITIVE_ANALYSIS ]` complete with pulsing cyber-lime carets. Wrote comprehensive Vitest unit tests in `tests/ai.test.ts` to test the fallback compiler under different savings conditions.

**What I learned:**  
Designing AI pipelines with deterministic, grammatically sound mathematical fallback templates is a bulletproof way to build high-availability products. It ensures that the application never breaks or shows empty space even if API limits or billing limits are reached. I also learned that path aliases inside backend files need careful relative routing if they are to be executed directly by external test runners like Vitest.

**Blockers / what I'm stuck on:**  
1. **Vitest Path-Alias Resolution**: Running Vitest on the save route triggered compilation errors due to tsconfig `@/` path aliases not being recognized by standard Node.js test contexts. Solved it completely by shifting the API route imports to use relative paths.
2. **Supabase Client Initialization Crash**: Importing the API route inside test scripts triggered fatal Supabase constructor exceptions because the database environment variables are not loaded in Vitest. Resolved this cleanly by configuring `lib/db/supabase.ts` to default to placeholder URLs/keys during empty environment imports, which keeps imports compile-safe while fully preserving dynamic database connections in development and production.

**Plan for tomorrow:**  
Complete the bonus integrations (PDF, embed parametrics, peer budgets, referrals) and resolve the ESLint build blockers.

## Day 6 — 2026-05-25

**Hours worked:** 8

**What I did:**  
Successfully implemented and integrated all five B2B bonus deliverables directly into the primary wizard experience under `app/page.tsx`. Positioned the client-side `ExportPdfButton` alongside the wizard's navigation steps for unified local report printing. Programmed a responsive, highly optimized embed viewport toggle (`isEmbed`) using Next.js 15 `useSearchParams` query parsing, automatically stripping decorative telemetry headers and site containers for iframe integrations. Wired the quantitative peer benchmarking budget panel and the copy-to-clipboard referral acquisition discount card (`[Slug]-CRD`) on the Step 4 results view.
Created a server-side feedback logging endpoint (`app/api/feedback/route.ts`) that asynchronously captures custom tool suggestions and securely appends them to the `results_payload` JSONB column in Supabase without requiring database alterations.
Resolved a critical build-blocking lint error caused by unescaped single quotes in the shared audit JSX, stabilizing `npm run lint` and enabling successful green checks on the GitHub Actions CI workflow runner.

**What I learned:**  
Next.js client-side search parameter parsing using `useSearchParams` must be encapsulated inside a `<Suspense>` boundary during static page pre-compilation to prevent deoptimization build warnings. Additionally, storing feedback as metadata within a JSONB column is a highly elegant, migration-safe strategy for lightweight server logging.

**Blockers / what I'm stuck on:**  
1. **Supabase RLS UPDATE Block**: Anonymous client-side attempts to submit feedback failed due to RLS security boundaries on the `audits` table. Solved this by designing and adding the `Allow anonymous updates on audits` UPDATE rule to `lib/db/schema.sql` and executing it in the Supabase console.
2. **Resend Sandbox Constraints**: Under standard free developer sandbox keys, Resend restricts outbound transactional emails exclusively to the account holder's registered address, which might prevent reviewers from seeing delivery. Solved this by publishing a clear "Third-Party Sandbox Verification Guide" inside `TESTS.md` explaining credentials handling.

**Plan for tomorrow:**  
Finalize live public Vercel deployment, verify dynamic UUID routing in production, complete manual mobile Lighthouse audits, and submit all internship deliverables.

## Day 7 — 2026-05-26

**Hours worked:** 15.4

**What I did:**  
Optimized the team size, seat counts, and actual monthly spend inputs across the entire wizard and consultation modal by implementing seamless digit deletion. Inputs can now be cleared fully (setting them temporarily to `""` to prevent backspace locks) and are gracefully clamped to their minimum default values (`1` or `0`) on field blur (`onBlur`).
Resolved all 7 TypeScript type checking errors in `app/page.tsx` that were introduced by allowing empty string states in standard numeric fields. Safeguarded all mathematical calculations (multiplication, division, and inequalities) with robust local inline numeric conversion filters. Executed `npx tsc --noEmit` and confirmed that the type-checker succeeds with absolutely zero compilation errors or warnings.
Completed and integrated the full B2B viral referral acquisition loop:
1. Created client-side state for `referralCode`, persisting it across page reloads in `localStorage`.
2. Programmed URL search parameter parsing (`?ref=XXXXXX-CRD` or `?referral=...`) to automatically extract, capitalize, and pre-populate referral codes for new users.
3. Designed and styled a custom **Referral / Promo Code (Optional)** input field inside the **Unlock Stack Report** lead capture form.
4. Updated the API payload for `/api/audit/save` and the backend route handler to log the code into the database under a new `referral_code` column in the `leads` table.
5. Documented database schema migration changes in `lib/db/schema.sql`.
6. Dynamically rendered the copyable unique referral URL link (e.g. `http://localhost:3000/?ref=XXXXXX-CRD`) directly in the final dashboard metrics card and the public audit shared views.

*Pair Programming & Optimization Stretch:*
* Relocated the lead capture gate from pre-audit Step 3 to an optional B2B-style card in Step 4, delivering value upfront while boosting trust-based conversions.
* Resolved Gemini API truncation issues by raising the token output budget from `250` to `2048` to support Chain-of-Thought (thinking) execution.
* Upgraded the deterministic Audit Engine with high-tier Max plan consolidation parameters, lowered centralization seat thresholds (to $\ge 20$), and a dynamic confidence offset heuristic (lowering to 80% for custom price contracts).
* Implemented "Get In Touch" B2B consultation modal triggers and external Calendly links next to tool credit flags (triggering at $\ge \$200$/mo retail and $\ge \$300$/mo API spend).
* Included Gemini in the Credex supported retail tool registry and lowered the aggregate monthly savings consultation banner threshold to `$300` to maximize lead acquisitions.
* Integrated active SAML SSO and compliance security profiles directly into the AI summaries and local fallback compiler.
* Refined the waitlist card visual copy, promoting `"JOIN WAITLIST"` as the main bold monospace header.
* Fully verified Vercel git-push deployments, ensuring that the production bundle builds cleanly.

**What I learned:**  
Designing clean numeric inputs in React requires distinguishing between active user typing states (which must allow temporary empty values) and final display states (which clamp on blur). To maintain strict type safety, these empty values must be safely sanitized before performing any mathematical calculations or logical operations. Closing the loop on viral SaaS systems requires coordinating URL query readers on application entry with dynamic path generation at exit. Additionally, gating value delivery late in the funnel creates a high-trust onboarding experience that captures high-intent leads.

**Blockers / what I'm stuck on:**  
None. All components compile beautifully, all features are fully integrated, and database columns are synchronized. 

**Plan for tomorrow:**  
None! All deliverables have been completed successfully. The application is production-ready.
