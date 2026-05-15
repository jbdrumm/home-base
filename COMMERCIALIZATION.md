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

## Home Base Sensors — Standalone IoT Product Line

A sensor system that operates entirely independently of Home Assistant, targeting non-technical users. Built on ESP32 microcontrollers reporting directly to the Home Base cloud backend (Netlify + Supabase). No hub required, no ecosystem knowledge needed — scan a QR code and it works.

### Why Independent (Not HA-Dependent)
Home Assistant requires technical setup that most consumers won't attempt. A closed-loop ESP32 → WiFi → Supabase pipeline bypasses that entirely. You control the hardware, the firmware, and the cloud layer — no third-party middleware, no ecosystem dependency, no support surface you don't own.

### How It Works
```
Sensor → ESP32 → WiFi → Netlify function → Supabase → Home Base dashboard → Push notification
```
ESP32 wakes every 30 minutes, reads sensor(s), posts JSON to a Netlify endpoint, sleeps. Battery lasts weeks to months on this duty cycle. Solar charging makes runtime essentially indefinite.

---

### The Garden Hub — Flagship Entry Product

**The product vision:** A single weatherproof hub with multiple labeled plug-and-play sensor ports. Customer starts with what they need and expands as their garden grows — no new hub required, just additional sensors ordered from Home Base.

**Hub hardware:**
- ESP32 microcontroller (brain)
- Custom PCB with 6–8 labeled sensor port slots
- Solar charging input + LiPo battery management
- USB-C charging backup
- Status LED + WiFi indicator
- Weatherproof enclosure with port covers for unused slots
- BOM target: ~$35–45 per hub

**Sensor port layout (conceptual):**
- 6x soil moisture slots
- 1x temperature/humidity (shared I2C bus)
- 1x light intensity
- Unused slots covered, detected automatically on next boot

**Setup experience:** Customer plugs sensors into slots, scans QR code, app asks for WiFi credentials + sensor names ("Tomatoes," "Herb bed," "Rose bush"). Done in under 5 minutes. No technical knowledge required.

**Auto-detection:** On boot, hub scans all ports, detects connected sensors, registers new ones. Home Base app prompts: *"We found a new sensor on port 3 — what would you like to name it?"*

---

### The Sensor Accuracy Strategy — Two-Phase Go-to-Market

#### Option B First — Premium Launch (Year 1)
**I2C digital soil moisture sensors** (e.g. Adafruit Stemma Soil Sensor, ~$8/sensor)
- On-sensor ADC conversion delivers clean, precise percentage readings
- Per-plant moisture thresholds (e.g. tomatoes like 60–70%, succulents 20–30%)
- AI agent cross-references Tomorrow.io forecast — skips watering alert if rain expected tomorrow
- Up to 12+ sensors chainable on one hub via I2C bus
- Sensor cost: ~$19–24 retail per probe

**Rationale for launching here first:** Early adopters pay premium for novelty and precision. First reviews reflect accurate data and a differentiated product. Establishes brand credibility at the high end before moving mass market. Margin is maximized from the most motivated buyers.

**Target audience:** Passionate gardeners, tech enthusiasts, smart home early adopters.
**Positioning:** *"Professional-grade garden intelligence — precise moisture percentages, AI-driven watering recommendations, per-plant optimization."*

---

#### Option A Second — Mass Market Expansion (Year 2)
**Analog capacitive soil moisture sensors** (~$2/sensor)
- Simple wet/dry/optimal three-state reading
- Binary threshold: "needs water" or "good"
- Mirrors the exact methodology gardeners already use — the finger test (stick finger 1–2" into soil, judge wet or dry)
- ADC pins on ESP32, ~6–8 sensors per hub
- Sensor cost: ~$12–15 retail per probe

**Rationale for launching second:** By Year 2 you have real reviews, validated product-market fit, and proof the system works. The mainstream audience that needs social proof before buying is now reachable. Early adopters funded R&D and market validation.

**The finger test marketing angle:** *"Just like checking your garden by hand — but for every bed, every day, without leaving your kitchen."* This is not a downgrade from Option B. It's a different product for a different customer. Both legitimate, both valuable.

**Target audience:** Mainstream homeowners, casual gardeners, Skylight-type buyers, anyone who waters by feel.
**Positioning:** *"Simple garden sensing for everyone — know exactly which beds need water today, without stepping outside."*

---

### The Upgrade Path as Revenue Stream
- Hub hardware is **identical** across both tiers — one SKU, simple inventory
- Only the sensors differ — I2C probes vs analog probes, same ports
- Option A customers who want more precision: **upgrade kit** — swap analog probes for I2C sensors, same hub, firmware auto-updates
- Option B early adopters: loyalty discount on sensor expansions
- Upgrade path is a natural upsell built into the product lifecycle

---

### Sensor Product Line (Beyond Garden)
Once ESP32 firmware and cloud pipeline exist, adding sensor types is minimal incremental work — same chip, different sensor, same reporting infrastructure:

| Sensor | Est. Retail | Use Case |
|---|---|---|
| Soil moisture (I2C) | $22–24 | Garden — Option B |
| Soil moisture (analog) | $12–15 | Garden — Option A |
| Pool water level | $29–34 | Auto-fill trigger |
| Sump pump float | $19–24 | High-water alert |
| Boiler pressure | $34–39 | Hydronic diagnostic |
| Garage door tilt | $16–19 | Open/close detection |
| Leak pad | $16–19 | Under appliances |
| Door/window contact | $14–18 | Security/awareness |
| Outdoor temp/humidity | $24–29 | Microclimate data |

---

### Business Model — Razor and Blades
- **Garden Hub** (entry point): $79–99 — modest margin, drives ecosystem adoption
- **Sensor add-ons**: $12–39 each — recurring revenue as garden/home expands
- **Home Base subscription**: covers cloud, AI agent layer, push notifications
- **Upgrade kits**: analog → I2C swap — upsell built into product lifecycle

**Starter kit (launch SKU):**
- Garden Hub + 2x soil sensors + 1x temp/humidity sensor
- Pre-flashed, QR code setup, weatherproof
- Target retail: $89–109

**Lifetime value example:** Customer buys starter kit ($99), expands to 8 sensors over 2 seasons (+$120), subscribes for AI watering recommendations (+$X/yr). High LTV, deeply embedded in ecosystem.

---

### Connector Strategy
**Recommended: Proprietary magnetic connector** (premium path)
- Impossible to plug in wrong, waterproof by nature, premium feel
- Creates a sensor accessory revenue stream — sensors only work with your hub
- Higher tooling cost upfront, strong brand identity and margin payoff

**Alternative: JST connectors** — secure, polarized, cheap, reliable. Less consumer-friendly but lower tooling cost for v1.

---

### Go-To-Market Sequencing — Garden Hub as a Wedge Product

The Garden Hub and Home Base dashboard are independent businesses sharing a backend. The sensor product can — and should — launch before the commercial dashboard is ready.

#### Phase 1 — Standalone Garden Hub App
A focused, single-purpose mobile app. Does one thing well:
- View moisture readings per sensor/bed
- Set per-plant thresholds (wet/dry for Option A, precise % for Option B)
- Receive watering push notifications
- Cross-reference Tomorrow.io weather forecast — skip alert if rain expected
- Name and manage sensors
- Basic reading history and charts

No dashboard, no calendar, no household features. Just garden intelligence.

**Why focused is a strength:** A single-purpose app is easier to market, easier to review ("does it help me water my garden — yes/no"), easier to support, and more discoverable on the App Store and Google Play. Reviewers and gardening communities respond better to a tool that does one thing perfectly than a sprawling platform.

#### Phase 2 — Home Base Direct Integration
When the commercial dashboard launches, Garden Hub users receive a prompt: *"Home Base is now available — connect your garden sensors directly to your family dashboard."* Existing sensor data, history, and thresholds migrate automatically. The standalone app remains as a companion view for garden-focused users, but Home Base becomes the recommended path.

The **"direct integration"** label positions Home Base as the premium tier without making standalone users feel abandoned or upsold aggressively. They're being invited into something bigger, not pushed.

#### Why This Sequencing Wins

- **Real revenue** while dashboard commercialization is still in development
- **Real manufacturing and fulfillment experience** at low stakes before shipping full display units
- **App Store presence and reviews** established before the bigger product launch needs them
- **Installed user base** who already trust the brand when Home Base launches — Garden Hub users become the most motivated Home Base early adopters because they already have skin in the game
- **Supply chain validation** — figure out ESP32 sourcing, enclosure manufacturing, and sensor fulfillment at $89/unit before you're managing $549 display unit logistics

The Garden Hub is a focused, affordable hardware product that quietly builds the audience, infrastructure, and operational experience for the larger platform launch. A genuine wedge strategy.


- **I2C bus:** Up to 127 devices theoretically chainable on 2 pins — practical limit ~12–16 for this use case. Eliminates ADC pin count constraint entirely.
- **ESP32 ADC quirk:** Nonlinear at voltage extremes — affects raw analog sensor accuracy. Acceptable for wet/dry detection (Option A), not ideal for precise percentages (Option B). I2C sensors bypass this entirely.
- **Firmware:** Embedded C++ or MicroPython. Soil moisture + WiFi POST is one of the most documented ESP32 use cases — reference implementations widely available. One-time development investment becomes the platform for all sensor types.
- **Solar + battery:** LiPo + TP4056 charging board (~$3) + small 5V solar panel (~$8). 30-minute read cycle gives weeks of battery life without sun; solar makes it indefinite.


- Brand name — Home Base is generic, would need trademark search
- Is financial integration core to the commercial identity or a premium add-on only?
- Target market: tech-savvy homeowners? Families? Smart home enthusiasts?
- Pricing model: flat subscription vs. tiered vs. freemium with add-ons
- Does the personal OBD2 / sensor integration translate to a general product or is it too custom per household?
- Self-hosted option for privacy-conscious users?

---

*This is a daydream doc — nothing here is committed. Revisit when the personal version feels complete.*
