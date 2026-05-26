# USER_INTERVIEWS.md

*User research logs, product discoveries, and core design implications based on feedback.*

---

## Interview 1 — Manju, Data Engineer, Mid-Stage Enterprise Environment

I spoke with Manju, a Data Engineer, where AI tooling is actively used across engineering and analytics workflows. The conversation focused on AI spend visibility, budgeting practices, and positioning the product toward the right customer segment.

### Direct Quotes
* “How are you determining the benchmark for monthly savings comparisons?”
* “This would be more useful if you narrowed the target customer instead of trying to support everyone.”
* “Because the recommendations are deterministic and rule-based, the tool feels more reliable.”
* “Reddit and Discord are noisy channels. Focus on in-person networking and strong cold emails if you want professional users quickly.”
* “AI tooling costs are becoming part of normal work culture, but in our company they’re still handled manually by budgeting teams.”

### Most Surprising Thing They Said
The most surprising insight was that even companies actively using multiple AI tools still manage AI expenses manually through budgeting or finance workflows instead of dedicated optimization systems.

### What It Changed About My Design
This conversation pushed me to narrow the target audience from freelancers and general users toward small engineering teams and startup operators. It also made me understand the importance of deterministic audit logic over AI-generated financial recommendations, since explainability increases trust for cost-related decisions. Additionally, it changed my GTM strategy to prioritize direct outreach, founder communities, and professional networking over broad social-platform promotion.

---

## Interview 2 — Aishwarya, AI Engineer, Early-Stage AI Product Environment

I spoke with Aishwarya, a fresher AI Engineer working in an early-stage AI-focused product environment. The discussion focused on product trust, growth strategy, abuse prevention, and user conversion behavior.

### Direct Quotes
* “How would you prevent users from spamming the audit portal?”
* “Why is email capture placed before the audit, wont that discourage participation?”
* “What assumptions are you making in your economics model?”
* “Strong onboarding copy can outperform additional features.”
* “Think about why someone would bookmark or share the result.”

### Most Surprising Thing They Said
The most surprising insight was that onboarding and positioning could have a larger impact on conversion than adding more technical functionality. They emphasized that users decide within seconds whether the tool feels trustworthy and useful.

### What It Changed About My Design
This conversation made me prioritize onboarding clarity and trust-building over adding unnecessary complexity. I refined the landing page messaging to communicate value faster and moved more focus toward shareability and screenshot-friendly audit results. It also encouraged me to document abuse prevention measures such as rate limiting and honeypot fields more clearly, since backend reliability and misuse prevention directly affect trust in public tools.

When asked why email capture happens before the audit, I explained that my initial reasoning was to ensure lead collection and to send them a copy of their report. I also believed it would help identify serious users earlier in the funnel. However, during the discussion, I realized that early email gating could reduce trust and increase drop-off. So I moved the email capture to the end of the audit.

---

## Interview 3 — Javed, Manager, IITM E-Cell, Startup Ecosystem

I spoke with Javed, Student Manager at IITM E-Cell who regularly interacts with early-stage founders and student startup teams. The conversation focused heavily on positioning, retention, differentiation, and long-term product viability.

### Direct Quotes
* “Who is your ICP and why?”
* “This feels like a one-time utility tool. How are you planning to maximize LTV from a single customer?”
* “What competitive moat prevents other people from replicating this and makes you better than existing tools like Zylo?”

### Most Surprising Thing They Said
The most surprising insight was the challenge around long-term retention. They questioned whether a static audit report alone creates enough recurring value for teams to revisit the platform regularly, especially when optimization tools are often used only during budgeting cycles.

### What It Changed About My Design
The discussion made me think beyond the MVP as just a one-time calculator and helped me frame the audit report as the entry point rather than the complete product experience. Since AI tooling ecosystems evolve rapidly, with companies continuously experimenting with new subscriptions, models, and API usage patterns, I started considering recurring audits, spend alerts, benchmark tracking, and periodic optimization recommendations as ways to improve retention and long-term value.

The conversation also changed how I thought about competitive differentiation. Instead of viewing the moat as purely technical, I started focusing on specialization and execution. Broader SaaS optimization platforms like Zylo handle all categories of software spend, while my product is specifically optimized for AI tooling decisions, overlapping model usage, API-versus-seat pricing tradeoffs, and engineering-team workflows. This reinforced the importance of transparent and explainable recommendations tailored specifically to AI spend management.
