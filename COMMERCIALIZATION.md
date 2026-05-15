# Home Base — Commercialization Notes
*Captured May 2026 — exploratory discussion, not committed to roadmap*

---

## The Idea
Take Home Base from a personal household dashboard to a sellable branded product. Core value proposition: a unified family dashboard combining calendar, tasks, grocery, vehicles, finances, home status, and smart home data — for any household, not just ours.

---

## Phase 1 — Legal & Business (Before Touching Code)
- Form LLC or business entity
- Draft Terms of Service and Privacy Policy (required by app stores AND most API vendors)
- GDPR/CCPA compliance if users outside the US — data handling, deletion requests, consent flows
- Trademark the brand name before building around it

---

## Phase 2 — API & Service Licensing

Nearly every API currently in use has a "free for personal use, commercial license required" clause. Audit before launch:

| Service | Current Status | Commercial Reality |
|---|---|---|
| Google Calendar / Tasks | OAuth personal testing mode | Works commercially — but requires full Google OAuth verification process (see Phase 3) |
| Tomorrow.io | Free tier | Paid plan required for commercial use (~$19/mo+) |
| Anthropic API | Pay-per-token | Already commercial-friendly, no changes needed |
| Firebase / FCM | Free Spark plan | Must upgrade to Blaze (pay-as-you-go) once real user volume |
| Supabase | Free tier | Pro plan ($25/mo) once free limits exceeded or SLAs needed |
| Monarch Money | **Unofficial API** | **Hard stop — cannot use in commercial product.** Replace with Plaid, Finicity, or MX (see Financial Model below) |
| Bouncie OBD2 (future) | Consumer device | Review ToS — most IoT consumer APIs prohibit commercial re-use |

---

## Phase 3 — Google OAuth Verification

Currently in "testing mode" with explicit test users. Going public requires:
- Privacy policy URL, app homepage, demo video showing exact scope usage
- Google reviews each scope individually (Calendar, Tasks, etc.)
- Timeline: 2–6 weeks, back-and-forth with reviewers is common
- **Risk:** Sensitive scopes (Calendar read/write for a commercial app with paying users) may trigger a CASA Tier 2 security audit — estimated cost $15–75k if required
- Budget for this mentally even if it doesn't happen

---

## Phase 4 — App Store Conversion

### Recommended Path: Capacitor Wrapper (2–4 weeks)
Wrap existing React app in [Capacitor](https://capacitorjs.com/) (by Ionic). Produces real iOS and Android binaries that pass app store review. Keeps almost all existing code intact. Handles push notifications, home screen icon, app store listing.

**Alternative: React Native rewrite** — 3–6 months, better native performance, not recommended as first step.

### App Store Requirements
- **Apple:** $99/year developer program, 2–7 day review per submission, stricter review process
- **Google Play:** $25 one-time, 1–3 day review, more lenient
- Both require: privacy policy, age rating, data collection disclosure
- Apple risk: may reject apps deemed "too web-like" — Home Base has enough native substance to pass but expect revision requests

---

## Phase 5 — Multi-Tenant Architecture

The biggest technical lift. Currently built for one household. Selling it means every customer gets isolated data.

- Supabase Row Level Security needs `household_id` keyed across every table (currently effectively open)
- Auth system needs real sign-up/sign-in, not the current "Jacob or Katelin" selector
- Onboarding flow — new customers connect their own Google account, configure household members
- Billing via Stripe (subscription management)
- Admin dashboard — usage visibility, support tooling, billing management

**Estimated effort: 2–3 months of development**

---

## Financial Integration Model

### The Monarch Problem
Monarch Money is currently the plan for Sprint 12 via an unofficial community API. This cannot be used in a commercial product — ToS violation and fragile by nature.

### Proposed Commercial Model
**Freemium structure:**
- **Free tier:** Manual bill entry, recurring bill tracking, basic financial overview — all stored in Supabase, no bank connections
- **Paid add-on (subscription):** Full financial institution data via Plaid API — account balances, transactions, net worth tracking, auto-import. Users sign up for this as a pass-through cost tier.

**Why this works:**
- Plaid cost gets passed to subscribers, not absorbed
- Free tier is still genuinely useful and drives adoption
- Mirrors how other fintech apps (Copilot, YNAB, etc.) handle the Plaid integration cost
- Keeps the free product sustainable without financial API overhead

**Plaid pricing:** Usage-based, typically $0.30–0.50 per connected account per month at small scale. Needs to be factored into subscription pricing.

---

## Realistic Timeline & Cost Estimate

| Phase | Estimated Time | Estimated Cost |
|---|---|---|
| Legal / business setup | 2–4 weeks | $500–2,000 |
| Google OAuth verification | 2–6 weeks | Free (or $15–75k if CASA audit triggered) |
| API license upgrades | 1 week | $50–200/mo ongoing |
| Capacitor app store wrapper | 2–4 weeks | $99 Apple + $25 Google |
| Multi-tenant architecture | 2–3 months | Development time |
| Plaid integration (paid tier) | 4–6 weeks | $0.30–0.50/account/mo at scale |
| **Total realistic runway** | **6–9 months** | **$1–5k upfront + $200–800/mo ongoing** |

---

## Open Questions (To Revisit If Pursuing)
- Brand name — Home Base is generic, would need trademark search
- Is financial integration core to the commercial identity or a premium add-on only?
- Target market: tech-savvy homeowners? Families? Smart home enthusiasts?
- Pricing model: flat subscription vs. tiered vs. freemium with add-ons
- Does the personal OBD2 / sensor integration translate to a general product or is it too custom per household?
- Self-hosted option for privacy-conscious users?

---

*This is a daydream doc — nothing here is committed. Revisit when the personal version feels complete.*
