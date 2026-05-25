# GTM.md — Go-To-Market Strategy & User Acquisition

> [!NOTE]
> Go-To-Market strategy, launching on developer-centric product channels, and driving the first 100 active users with $0 budget.

---

## 1. Who Exactly Is The User

Not "startup founders." Not "engineering managers."

The targeted user is a **senior engineer or tech lead (approx. age 26–50) at a 15–60 person Series A/B startup, who has been informally asked by their manager to justify or own the AI tooling decision.** They have no procurement department, no benchmark, and no title that says "buyer." But they are the de facto decision-maker on what tools the team uses, and they just got a Slack message that says something like: 

> *"Hey, can you put together what we're spending on AI tools and whether it's worth it?"*

They have 20 minutes. They Google it. Nothing useful exists. That is our entry point.

---

## 2. What They Search Right Before They Need This

A search specifying *"AI spend audit"* is highly unlikely. Instead, they search:

- `"is cursor business worth it vs pro"`
- `"github copilot vs cursor reddit 2025"`
- `"chatgpt enterprise vs team small startup"`
- `"how much should a startup spend on AI tools per developer"`

These are high-intent, informational queries with zero good existing answers. This tool is the answer.

---

## 3. Where They Actually Hang Out

| Community Hub | Destination / Link | Why They Are There |
| :--- | :--- | :--- |
| **Cursor Discord (#pricing)** | [discord.gg/cursor](https://discord.com/invite/cursor) | Real users complaining about Business vs Pro pricing weekly. Real pain, public, and highly searchable. |
| **Theo (t3.gg) Discord** | [discord.gg/theo](https://discord.com/invite/xHdCpcPHRE) | Price-conscious mid-to-senior level developers who are highly opinionated about tooling economics. |
| **r/ExperiencedDevs** | [reddit.com/r/ExperiencedDevs](https://www.reddit.com/r/ExperiencedDevs/) | Senior ICs discussing tooling trade-offs, standardizations, and workflow architectures (zero hype). |
| **r/LocalLLaMA** | [reddit.com/r/LocalLLaMA](https://www.reddit.com/r/LocalLLaMA/) | Cost-conscious developers actively exploring self-hosted model alternatives to expensive APIs. |
| **Windsurf Discord** | [discord.gg/windsurf](https://discord.com/invite/windsurf) | Active comparison debates on Cursor vs Windsurf vs Copilot plan features and pricing. |
| **Rands Leadership Slack (#tools)** | [randsinrepose.com/slack](https://randsinrepose.com/welcome-to-rands-leadership-slack/) | Invite-based but open channel where EMs and senior ICs discuss team procurement and tools. |
| **X — @cursor_ai Replies** | [x.com/cursor_ai](https://x.com/cursor_ai) | Public complaint threads under Cursor pricing and licensing announcements. |
| **X — @AnthropicAI Replies** | [x.com/AnthropicAI](https://x.com/AnthropicAI) | Product team plan announcements where developers ask *"is this worth it for my team?"* |
| **Hacker News** | [news.ycombinator.com](https://news.ycombinator.com) | Highly active cost-comparison threads appearing under search terms like `"cursor copilot spend"`. |
| **Indie Hackers** | [indiehackers.com](https://www.indiehackers.com) | Startup founders openly sharing monthly expense audits, detailing AI tooling configurations. |

---

## 4. First 100 Users in 30 Days ($0 Budget)

### 📅 Week 1 — Find Existing Pain (Direct Outreach)

1. **Cursor Discord `#pricing` Channel**: Find the last 10 threads where someone asked *"is Business worth it for a small team."* Reply with a genuine, specific answer showing the math, then add:
   > *"I built a tool that runs this calculation automatically: [link]."*
   *Limit to one genuine reply per thread. Zero spam.*
2. **X / Twitter Social Listening**: Search X daily for:
   `("cursor" OR "copilot" OR "claude") ("seats" OR "team plan" OR "expensive") -enterprise`
   Filter to the last 7 days. Find the complaint tweets. Quote-tweet with one specific data point from the audit engine instead of a generic pitch:
   > *"For a team of 8, Copilot Business vs Cursor Pro saves $X/mo. Full breakdown: [link]."*
3. **Indie Hackers Expensing threads**: Find 5 posts from the last 3 months where founders mentioned AI tooling costs in monthly expense breakdowns. Reply directly with a custom savings calculation.

### 📅 Week 2 — Community Co-Design

4. **r/ExperiencedDevs**: Post not as a launch, but as a constructive inquiry:
   > *"I built a tool to audit AI tool spend for dev teams — does this match what you are seeing in your workspaces?"*
   *Frame it as seeking feedback. The community responds exceptionally well to peer curiosity.*
5. **Hacker News Commentary**: Write high-value comments (not a *Show HN*) on any active threads discussing AI tooling or workspace costs. A targeted comment in an active thread gets read; a Show HN post often dies quickly without early momentum.
6. **Rands Leadership Slack `#tools`**: Post the URL with a single sentence:
   > *"Built a free, monospace AI spend auditor for dev teams — no login, instant results."*
   *Let the tool speak for itself.*

### 📅 Week 3 — Earned Media (Free Submissions)

7. **Free Newsletter Submissions**:
   - [TLDR Tech](https://tldr.tech/founders) — Free founder submissions (750k+ subscribers).
   - [Changelog News](https://changelog.com/news/submit) — Highly targeted developer submission channel.
   - [Software Lead Weekly](https://softwareleadweekly.com) — Direct outreach to curator Oren Ellenbogen.
8. **Windsurf Discord `#general`**: Participate in active Cursor vs Windsurf price-value debates, providing a programmatic calculator to settle pricing math.

### 📅 Week 4 — High-Density Loops

9. **Audit Telemetry Thread**: Take the single most surprising audit result from a real user (obtained with permission) and post it as a tweet thread:
   > *"We ran an audit on a 12-person engineering team's AI stack. Here is what we found."*
   *Provide real numbers and actual stacks. Shareable, high-relevance insights.*

---

## 5. The Unfair Distribution Channel

> [!IMPORTANT]
> **Credex's existing customer list.**
> Every person who has already bought discounted AI credits through Credex has self-selected as cost-conscious about AI spend. They are the highest-intent possible audience for an AI spend audit tool. Credex can email this list the tool as a free value-add — *"here's a tool to see where else you might be overspending"* — with zero paid CAC.
>
> No other applicant has access to this pre-qualified list. This is the one thing only Credex can do.

**Secondary Virality Loop**: The shared audit page itself contains the dynamic open graph layout (e.g., *"This shared report identifies up to $2,280/year in AI stack optimization savings"*). Every organic share acts as a cold acquisition channel with a pre-qualified value proposition baked directly into the social card thumbnail.

---

## 6. What Week-1 Traction Looks Like

| Success Metric | Target Goal | Corrective Actions If Missed |
| :--- | :--- | :--- |
| **Audit Completions** | 300+ runs | Increase community outreach threads. |
| **Email Captures** | 80+ leads (≥25%) | Optimize the lead capture modal copy to highlight report values. |
| **Credex Consult CTAs** | 10+ clicks | Increase visibility of the Credex bulk credit conversion banner. |
| **Organic X Shares** | 3+ unprompted posts | Make the shareable URL and copy buttons more prominent. |
| **User Social Proof** | 1+ rich testimonial | Reach out to highly optimized cohort users for comments. |
| **HN Score (if posted)** | 50+ upvotes | Optimize post timing and introductory comments. |

> [!TIP]
> If audit completions are high but email capture is below 15%, the results page is not showing enough value before the lead gate. That is the signal to iterate on the preview data — not to search for new acquisition channels.
