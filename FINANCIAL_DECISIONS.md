# Home Base — Financial Integration Decision Log

## The Problem
Jacob wanted a financial component in Home Base that would eliminate manual tracking, display upcoming bills with pay type, show account balances, provide cash flow projections, and calculate net worth — all without storing sensitive financial data in Supabase.

---

## Platforms Evaluated

### Quicken Simplifi ($70/year)
- Already subscribed with full account history built up
- Best-in-class cash flow projection (7-90 day, visual + day-by-day + alerts)
- Auto-draft vs manual bill distinction not natively supported
- Receipt photo capture — not available
- No public API
- Known issue: Plaid token expiration after 90 days of no login causes balance adjustments — this is a Plaid behavior, not a Simplifi bug
- **Verdict: Good tool, wrong API situation**

### Monarch Money ($99/year) ✅ SELECTED
- Active free trial at time of decision
- Unofficial API available (hammem/monarchmoney, community fork bradleyseanf/monarchmoneycommunity)
- Receipt photo capture with transaction linking — available
- Cash flow projection — basic only, not comparable to Simplifi
- Auto-draft vs manual — not natively supported by either platform
- Pulls Zillow home values natively
- Pulls VinAudit vehicle values natively
- Successfully pulling Principal 401k (likely via MX or Finicity, not Plaid)
- **Verdict: Best overall fit for Home Base integration**

### YNAB ($109/year)
- Official public REST API — most stable option technically
- Strong cash flow projection built into core product
- No receipt photos
- No Zillow or VinAudit integration
- Unknown Principal 401k support
- VinAudit API needed separately at ~$240/year additional
- Total cost: ~$349/year vs Monarch's $99/year
- **Verdict: Best API stability but cost difference not justified**

### Plaid Direct
- Estimated $180-360/year for personal use volume — too expensive
- Does not integrate with Simplifi directly
- Principal 401k access uncertain (restricted third-party API access in 2025)
- **Verdict: Eliminated on cost**

---

## Key Decisions & Discoveries

**Auto-draft vs manual detection is not possible automatically.**
Bank transaction data does not flag how a payment was initiated. Decision: manual entry in Home Base with a simple toggle per bill. Set it once, rarely changes.

**Variable recurring bills can't be reliably auto-detected.**
Utilities vary monthly by usage. Decision: manual amount entry, not worth automating.

**Plaid is not free.**
Personal use pricing: $180-360/year. Eliminated.

**Monarch does not have a public API.**
Integration uses an unofficial reverse-engineered API (bradleyseanf/monarchmoneycommunity). Risk: could break when Monarch updates their app. Mitigation: active community fork actively tracks changes.

**Receipt photos serve a dual-date accounting purpose.**
Goal is recording date of realization (when transaction occurred) vs date of recognition (when bank posts it). Example: groceries purchased March 30 but posted April 1 should be recorded in March. Home Base builds a dual-date transaction record — realized date captured at photo, posted date matched when transaction appears from Monarch.

**Cash flow projection built natively in Home Base.**
Replaces Simplifi's projection feature using Monarch transaction and bills data.

**No financial data stored in Supabase.**
All financial data is live-fetched from Monarch on demand. PIN protection gates the financial drill-down.

---

## Institution Support

| Institution | Monarch Support |
|---|---|
| USAA | ✅ Full |
| Capital One | ✅ Full |
| M&T Bank | ✅ Full |
| Huntington Bank | ✅ Full |
| Ally | ✅ Full |
| Principal 401k | ✅ Via MX/Finicity |

---

## Final Decision

**Platform: Monarch Money at $99/year**

- Cancel Simplifi when 2-month remaining subscription expires
- Set Monarch password before trial expires (API requires password auth, not Google login)
- Subscribe to Monarch before 4-day trial window closes

**Annual cost: $99 (vs Simplifi $70 + limitations)**
