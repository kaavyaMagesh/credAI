# CredAI — AI Spend Audit Tool

CredAI is an AI Spend Audit Tool that tells any startup engineering team exactly where
they are overspending on AI tools — Cursor, Copilot, Claude, ChatGPT, and others
— with specific plan-level recommendations and real savings numbers, in under
3 minutes, no login required. It is built for the senior engineer or tech lead
who has been asked to justify their team's AI tooling spend but has no benchmark
to work from. For teams where the audit surfaces significant savings, it connects
them to Credex — a service that sources discounted AI credits from companies that
overforecast — as the next step to actually capture those savings.

---

## 🛠️ Decisions & Architectural Trade-offs

During the sprint build, we made five critical technical trade-offs to balance rapid development velocity against professional reliability and high-availability operations:

### 1. Live Markdown Pricing Parser vs. Database Pricing Seeding
*   **The Decision:** We chose to build a dynamic parser (`lib/pricing/parser.ts`) that reads `PRICING_DATA.md` at runtime rather than seeding and querying a traditional SQL database.
*   **The Rationale:** It establishes an elegant single-source-of-truth that programmatically links our user-facing documentation directly with our audit logic. This allows business-focused teams to update plan pricing, URLs, and verified dates by simply editing a markdown document, completely eliminating database migration runs or seed script complexity.

### 2. Hybrid Zero-Friction Abuse Protection vs. Interactive CAPTCHAs
*   **The Decision:** We implemented a double-layered defense consisting of an invisible frontend Honeypot field (`website` trap) alongside a server-side in-memory sliding window IP Rate Limiter, rejecting interactive widgets (like hCaptcha).
*   **The Rationale:** This keeps user friction at absolute zero, maintaining the clean, premium monospace FUI (Fictional User Interface) aesthetic of the web application. It catches automated spambot crawlers via the honeypot and restricts manual flooding to 5 requests per 10 minutes per IP, fully protecting our paid downstream API keys (Gemini, Resend) and database resources from abuse.

### 3. Node-Independent REST Fetch vs. Third-Party Client SDKs
*   **The Decision:** We utilized raw HTTP `fetch` REST calls to contact the Gemini API and Resend API rather than importing their official Node.js SDK libraries.
*   **The Rationale:** Direct REST fetch drastically minimized our dependency tree size, eliminated Webpack import compilation conflicts where Node.js built-ins (`fs`/`path`) crashed client-side hydration, and kept the serverless dynamic routes compile-safe, lightweight, and highly performant.

### 4. In-Memory Sliding Window Map vs. External Redis Caching
*   **The Decision:** We designed a server-side, in-memory `Map` tracking request timestamps rather than provisioning Upstash Redis or Vercel KV.
*   **The Rationale:** For a rapid prototype, this avoided external network latency overhead and DevOps configuration during the sprint. We accepted the serverless edge-case limit of rate-limiting per-instance to favor ultra-fast local development and instant offline unit testing.

### 5. Decoupled Frontend Type Interfaces vs. Shared Backend Import Types
*   **The Decision:** We declared isolated frontend-specific type interfaces inside `app/page.tsx` and client files instead of sharing and importing them directly from the server-side calculations module `lib/audit/engine.ts`.
*   **The Rationale:** Direct server imports in Client Components caused Next.js's bundler to attempt compiling server-side Node.js built-ins (`fs` and `path`) for the browser environment, throwing fatal Webpack reference compilation errors. By declaring isolated, decoupled type interfaces for the client view model, we eliminated Webpack browser bundling conflicts, keeping the client bundle compile-safe, lightweight, and completely decoupled from backend modules.

### Live Deployed URL : https://cred-ai-ten.vercel.app/
---

## Setup & Running Locally

Ensure Node.js is installed on your local environment before running.

```bash
# Install dependencies
npm install

#Set Up Environment Variables
copy .env.example .env.local

# Run the development server
npm run dev

# Run Vitest test suite
npm test

# Install Vercel CLI (once)
npm i -g vercel

# Deploy (first time — prompts for project setup)
vercel

# Deploy to production
vercel --prod

```
