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

## Hardware Product Strategy

### Display Hardware (Confirmed Spec)
**Waveshare 15.6" HDMI Capacitive Touch LCD**
- 1920x1080 IPS, 178° viewing angle
- Capacitive touch, up to 10-point, 6H toughened glass
- Driver-free on Raspberry Pi OS (HDMI + USB-A touch)
- Includes: HDMI cable, USB cable, 12V power adapter, stand
- **Single unit price: $125** (Alibaba/Waveshare direct)
- 10–999 units: $120 | 1,000+ units: $115

**18" version also under evaluation** — sits between Skylight's 15" and 27" Calendar Max, a gap no current competitor owns.

### Competitor Screen Size Reference
| Product | Size | Price |
|---|---|---|
| Skylight Calendar | 10", 15", 27" | $149 / $249 / $629 |
| Cozyla Calendar+ | 32" | ~$400+ |
| **Home Base Standard** | **15.6"** | **~$549 target** |
| **Home Base Pro XL** | **18"** | **~$799 target** |

Skylight's 15" is their bestseller. Home Base 15.6" directly competes at a lower price with far deeper integrations. The 18" is a differentiated size with no direct competitor.

---

### Compute: Pi 4 as Base, Pi 5 for Pro

**Pi 4 2GB ($35–45)** — base model for Standard tier. Handles Home Base PWA kiosk comfortably. No HA. Best supply-chain reliability of any Pi model.

**Pi 5 4GB ($60)** — Pro tier. Needed for Home Assistant co-habitation plus camera feeds and sensor data. Enough headroom for all planned Home Base features.

**Pi Zero 2W** — too weak for this use case. Struggles with complex React PWA + real-time data.

**Future:** Raspberry Pi CM4 embedded in a custom carrier board — the right call at v2 when injection-molded enclosure is viable. Cleaner, no exposed ports, purpose-built.

---

### Tiered Product Line

| Tier | Hardware | Software | Est. BOM | Target Retail |
|---|---|---|---|---|
| **Home Base Standard** | Pi 4 2GB + 15.6" display + enclosure | Home Base kiosk only | ~$310–370 | $549 |
| **Home Base Pro** | Pi 5 4GB + 15.6" display + enclosure | Home Base + HA pre-configured | ~$360–420 | $699–749 |
| **Home Base Pro XL** | Pi 5 4GB + 18" display + enclosure | Home Base + HA pre-configured | ~$400–460 | $799–849 |
| **DIY Bundle** | Pi 5 4GB bare board + pre-flashed SD card | Home Base + HA, no display | ~$65–80 | $149–199 |

---

### Can Home Assistant and Home Base Run on the Same Pi?

**Yes, on Pi 5. Tight but workable on Pi 4 2GB for light HA use.**

Home Assistant OS takes over the full Pi, so it cannot run alongside Pi OS directly. Two viable approaches:

**Option A — HA Supervised (Docker on Pi OS)**
HA runs as a supervised Docker container on top of Raspberry Pi OS. Both Home Base kiosk and HA run on the same machine. Officially "unsupported" by HA team but widely used and stable in practice. Good for DIY audience.

**Option B — HA Container (Docker core only)**
Lighter weight, more stable alongside Pi OS. Loses HA add-on store but retains all core device/sensor integrations. Recommended for the Pro hardware bundle — cleaner and more predictable.

**Pi 5 (4GB):** Comfortable running both simultaneously. Recommended for any configuration that includes HA.

**Pi 4 (2GB):** Workable for light HA (few Zigbee sensors, some smart plugs). Constrained with cameras, dozens of devices, or complex automations. This is why HA is Standard-tier excluded.

---

### DIY Bundle — The 2-for-1 Opportunity

Pre-flashed SD card that boots into:
1. Home Base in kiosk mode (Chromium fullscreen, auto-launch, auto-update)
2. Home Assistant running in Docker in the background

**First-boot wizard covers:**
- WiFi credentials
- Google account login
- Household member setup
- Optional: HA configuration at port 8123

**Target audience:** r/homeassistant and r/raspberry_pi communities — large, technically capable, already want this. They have their own displays and Pis. They want the software pre-configured and ready. This audience also becomes organic marketing — Reddit posts, setup showcases, word of mouth.

**Pricing:** $49–79 for SD card + software license. Near-zero hardware cost, pure software margin.

**Support policy (critical):** DIY tier gets community support only — Discord server, good documentation, no direct email support. This boundary must be explicit in purchase flow or it consumes founder time.

---

### Enclosure Path
- **V1 (prototype/pilot):** 3D printed or CNC aluminum frame (~$150–200/unit at low volume)
- **V2 (scale):** Injection-molded plastic — $5–30k tooling cost, $8–20/unit at 500+ units
- Single USB-C or barrel jack power cable to wall
- VESA standard mount on rear, ships with wall bracket
- Pi tucked behind display panel, no exposed ports visible from front

---

## Home Assistant Commercialization — The Everyday User Problem

HA is what makes Home Base genuinely differentiated but it's inherently DIY. Three viable paths for non-technical customers:

**Option A — Abstract It Away (recommended launch strategy)**
Don't expose HA to Standard tier customers. Calendar, tasks, grocery, vehicles, and finances all work standalone with no HA dependency. HA is a Pro tier feature only. Most customers never need to think about it.

**Option B — Pre-Configured Hardware Bundle (Pro tier)**
Ship Pi 5 with HA pre-installed as a Docker container, first-boot wizard handles initial setup. Controlled environment = predictable support surface. Customer plugs in, scans QR code, done.

**Option C — White-Glove Setup Service**
Paid onboarding ($99–299) via video call or in-home visit. Doesn't scale past ~50–100 customers without hiring but generates real revenue and surfaces what actually breaks in diverse home environments before you try to automate it away.

**Recommended path:** Launch Standard tier without HA. Pro tier ships with HA pre-configured. DIY bundle targets technical users with community-only support. Let demand signal whether white-glove service is worth building.

---

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
