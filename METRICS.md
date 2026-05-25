# METRICS.md — Product Analytics & Funnel Instrumentation

> [!NOTE]
> Strategic product metrics framework designed for a B2B lead-generation SaaS tool, prioritizing absolute value conversion over empty vanity metrics.

---

## North Star Metric

**Audit completions per week.**

*Not visits. Not signups. Completions.*

A completed audit means the user entered their real stack, saw real results, and experienced the core value of the tool. Everything downstream — email captures, Credex CTAs clicked, consultations booked, and credits purchased — is a direct mathematical function of completion volume.

Visits are a vanity metric at this stage. Someone who lands and bounces contributes nothing to the lead funnel. However, someone who completes an audit and sees $800/mo in savings is one click away from a Credex consultation. Completion is the exact moment value is delivered and the commercial opportunity opens.

> [!WARNING]
> **Why DAU (Daily Active Users) is wrong for this tool:**
> Most users will audit their stack once, share the result, and return only when their stack changes — quarterly at best. Optimizing for daily return visits would mean building the wrong product features.

* **Target by Week 6**: **500+ completions/week**
* **Trigger Threshold**: Under **200 completions/week** by Week 4 triggers a pivot review (see below).

---

## 3 Input Metrics That Drive The North Star

### 1. Audit Start Rate
* **Definition**: `% of landing page visitors who begin the input form`
* **Target**: `≥ 40%`

This measures whether the landing page copy and CTA are doing their job. If visitors land and don't start, the problem is above the fold — headline, subheadline, or CTA. This is the first thing to instrument and the first thing to fix if completions are low.

$$\text{Audit Start Rate} = \frac{\text{Audits Started}}{\text{Unique Landing Page Visitors}}$$

### 2. Form Completion Rate
* **Definition**: `% of users who start the form and reach the results page`
* **Target**: `≥ 70%`

Drop-off here means the form is too long, confusing, or hitting friction on a specific step. Instrument each step of the multi-step form separately. If Step 3 (entering spend per tool) has a 40% drop-off, that step needs to be redesigned — utilizing autofill from known pricing, clearer labels, or fewer required fields.

$$\text{Form Completion Rate} = \frac{\text{Audits Completed}}{\text{Audits Started}}$$

### 3. Email Capture Rate
* **Definition**: `% of completed audits where the user submits their email`
* **Target**: `≥ 25%`

This is the commercial conversion point. A completed audit with no email is useful to the user but invisible to Credex. The capture rate measures whether the results page is delivering enough perceived value that the user wants to save or share the report.

> [!TIP]
> If the capture rate is below 15%, the results page is not showing enough savings, or the gate is appearing before the user has seen the value. Fix the results page design before touching the email gate copy.

$$\text{Email Capture Rate} = \frac{\text{Emails Submitted}}{\text{Audits Completed}}$$

---

## What To Instrument First

In priority order, before anything else, we will instrument the following event telemetry:

1.  **Landing Page ➔ Form Start** *(Did the hook work?)*
2.  **Form Step Completion (Per Step)** *(Where does the form lose people?)*
3.  **Results Page Load** *(Did they get to value?)*
4.  **Email Gate Submit** *(Did they want to keep it?)*
5.  **Credex CTA Click** *(Did high-savings users engage?)*
6.  **Shareable URL Generated** *(Are people sharing?)*

> [!IMPORTANT]
> Use **PostHog** or **Plausible** (both have free tiers and are privacy-respecting, which is highly relevant for a tool people trust with sensitive spend data). Fire a custom event at each step. Do not rely on pageview analytics alone — this is a single-page flow and most events will not show up in standard pageview data.

---

## What Number Triggers A Pivot Decision

### 📉 Scenario A: Audit completions are below 200/week by the end of Week 4
*   **Diagnosis**: This is an **acquisition** problem, not a product conversion problem. At sub-200 completions, the funnel has not been fed enough volume to optimize conversion rates meaningfully.
*   **Action**: Change channels — do not touch the product. If HN, Discord, and r/ExperiencedDevs have all been tried and completions are still below 200/week, the distribution hypothesis is wrong. The pivot is to find one niche channel that works (even at small scale) and double down on it exclusively.

### 📉 Scenario B: Email capture rate is below 15% with completions above 300/week
*   **Diagnosis**: The product is being used but not trusted enough to hand over an email. This is caused by either vague results (savings are $0 or trivially small) or the gate appearing before value is shown.
*   **Action**: A/B test the gate placement and results transparency before changing anything else.

### 📉 Scenario C: Credex CTA click rate is below 5% of high-savings audits
*   **Diagnosis**: The commercial link between the audit tool and Credex is broken. The banner is either not contextual enough, not prominent enough, or the savings number is not large enough to motivate action.
*   **Action**: Lower the trigger threshold from $500/mo savings to $300/mo and re-evaluate within 2 weeks.
