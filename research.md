# BONSAI CRM: Close CRM Research + Build Plan
*Researched 2026-10-18. For scott Adams, solo operator.*

---

## 1. Close CRM: Feature Breakdown

Close (close.com) is a sales-first CRM built for inside sales teams. Its whole pitch: calling, SMS, and email live inside the pipeline, no switching tools.

**Core features:**

- **Built-in calling (VoIP):** Click-to-call from any lead, automatic call logging and recording, voicemail drop. Calls are metered (~$0.02/min) on top of the seat price.
- **SMS:** Native two-way texting, logged to the contact timeline automatically.
- **Email:** Gmail/Outlook sync, templates, open tracking, bulk email (Growth+), automated sequences.
- **Pipeline management:** Customizable kanban boards, drag-and-drop stages, multiple pipelines, deal value tracking, Expected Value forecasting.
- **Smart Views:** Saved filtered lead lists (by activity, status, stage). This is how reps work a list fast.
- **Workflows/automation (Growth+):** Lead assignment, task creation, email sequences, follow-up reminders, triggers.
- **Power Dialer (Growth+):** Auto-dials through a call list with logging. **Predictive Dialer (Scale):** Dials multiple numbers, connects on answer. Live call coaching (Scale).
- **Chloe AI agent:** On every plan (500-2,000 credits/user/mo). Call summaries, AI call notes, email rewriting, lead enrichment, voice assistance. Runs inside workflows on Growth+.
- **Reporting:** Activity volume, conversion rates, activity overview/comparison reports, exportable to CSV.
- **Team features (Scale):** Role-based permissions, lead visibility rules.
- **Inbox + tasks:** Centralized shared inbox and task list (Essentials+).
- **Forms:** Built-in lead capture forms (Essentials+).
- **Custom fields:** 250 on Solo, more on higher tiers. Custom activities on Growth+.

**What Close does NOT have:** No B2B contact database (you import your own leads). No marketing automation (no landing pages, no nurture campaigns). No LinkedIn or WhatsApp steps in sequences. Limited reporting depth vs. Salesforce.

---

## 2. Close CRM: Pricing (verified Oct 2026)

Four per-user plans. Annual billing shown first (monthly in parentheses).

| Plan | Annual | Monthly | Key limits |
|------|--------|---------|------------|
| **Solo** | $9/user/mo | $19/user/mo | 1 user only, 10,000 lead cap, NO workflows, NO dialer, 500 AI credits, 30-day recording retention |
| **Essentials** | $35/user/mo | $49/user/mo | Unlimited contacts/leads, team collab, shared inbox, NO workflows, 1,000 AI credits |
| **Growth** | $99/user/mo | $109/user/mo | Workflows, Power Dialer, bulk email, Chloe in workflows, 1,500 AI credits |
| **Scale** | $139/user/mo | $149/user/mo | Predictive dialer, permissions, live coaching, unlimited recording, 2,000 AI credits |

**Hidden costs:**
- Calls ~$0.02/min, SMS usage-based, phone numbers from $1/mo (premium $19/mo/line)
- Call Assistant add-on: $50/mo + $0.02/min
- AI credits beyond the included pool: billed separately
- No free plan. 14-day trial only.

**The real price for scott:** Close Solo at $9/mo ($108/yr) has no automation and no dialer. Anything with workflows starts at $99/mo ($1,188/yr). For a solo operator, that is expensive for what you get.

---

## 3. Close CRM: Tech Stack Clues

From developer.close.com and public sources:

- **Public REST API:** Full CRUD on Leads, Contacts, Tasks, Opportunities, Activities, Sequences. API key auth.
- **Webhooks:** Real-time event streaming (new lead, call completed, email opened, etc.).
- **OAuth 2.0:** For partners building public integrations.
- **MCP server:** Close ships an official MCP server so AI agents (Claude, ChatGPT, Cursor) can read/write Close data directly. This is notable: Close is already agent-compatible.
- **Zapier:** Native integration, plus 9,000+ apps through Zapier.
- **Other integrations:** Help Scout, Integrate.io, Stitch (ETL to data warehouses).
- **Web app:** React SPA at app.close.com.
- **Telephony:** Twilio-powered under the hood (industry standard for this; Close abstracts it).

**Takeaway for BONSAI:** Nothing exotic. A standard stack (React frontend, REST API, Postgres-style data model, Twilio for calling/SMS) replicates 90% of what matters. Close's moat is polish and the dialer, not secret tech.

---

## 4. What scott Actually Needs vs. What Close Offers

scott's sales motion (from his actual work):

| scott's need | Close equivalent | Verdict |
|---|---|---|
| Website clients: track from cold call to $300 build to $50/mo care plan | Pipeline with custom stages | Needed, but simpler |
| Club outreach: 22 clubs, 3-email sequence (Day 0/4/11), status per club | Email sequences + Smart Views | Needed, but he already has Gmail drafts; needs tracking, not sending |
| Wild prospects: quick-add a business spotted on the street | Lead capture / forms | Needed, dead simple |
| Follow-up reminders ("call Leo's back Thursday") | Tasks + workflow reminders | Needed, dead simple |
| Call logging ("called, no answer, try Friday") | Automatic call logging | Nice-to-have; manual log is fine for solo |
| Email open tracking | Built-in | Nice-to-have |
| Conversion reporting (leads -> clients, close rate) | Reporting dashboards | Needed, but a simple count works |
| Power dialer / predictive dialer | Growth/Scale feature | NOT needed. He calls 5-10 businesses a day, not 200 |
| Team permissions, role-based access | Scale feature | NOT needed. Solo operator |
| AI credits, Chloe agent | All plans | NOT needed. He has Muse |
| Multi-user seats | Per-user pricing | NOT needed |

**Bottom line:** Close charges $99/mo for the automation tier, but scott would use maybe 20% of it. He is paying for a 15-rep sales team's tool. BONSAI CRM should be the 20% he actually uses, built exactly around his workflow, for $0 in seat costs.

---

## 5. BONSAI CRM: Phased Build Plan

**Design principle:** Don't clone Close. Build the smallest thing that runs scott's actual sales motion. He is one person with three pipelines (websites, clubs, wild prospects), not a sales floor.

### Phase 1: MVP (build first)

The core loop: capture a lead, move it through stages, never lose a follow-up.

1. **Contacts table:** Name, business, phone, email, address, category (website client / club / wild prospect), source, notes. CSV import (to load the 20 St. John's leads + 22 clubs on day one).
2. **Kanban pipeline:** Drag-and-drop cards across stages. One board per pipeline:
   - *Websites:* Spotted → Contacted → Mockup Sent → Proposal → Client → Care Plan ($50/mo)
   - *Clubs:* Researched → Email Sent → Follow-up → Call → Onboarded
   - *Wild prospects:* Spotted → Researched → Contacted → Proposal → Client
3. **Activity log:** Manual entries per contact: called (with outcome + notes), emailed, met in person, left voicemail. Timestamped timeline per contact, newest first.
4. **Follow-up reminders:** "Remind me to call Leo's on Thursday." Due-date task list, surfaced in a daily view. This is the single most important feature: nothing falls through the cracks.
5. **Dashboard:** Total leads, leads by stage, conversion rate (clients / contacted), follow-ups due today. Simple counts, no fancy charts yet.

**Tech:** Next.js + Supabase (scott already runs both; heyscottybro and myBackyard prove the pattern). One new Supabase project or new tables in an existing one. Auth via his existing login.

**Effort estimate:** This is a weekend-scale build. Contacts + kanban + activity log + reminders + dashboard is standard CRUD with a drag-and-drop library.

### Phase 2: Communication (after MVP is in daily use)

6. **Email sequences:** Template + schedule follow-ups (Day 0/4/11 like the club outreach). Send via Gmail API using his connected account. Track sent/opened.
7. **SMS via Twilio:** Pay-as-you-go (~$0.0075/SMS). For "just sent you the mockup" nudges. Optional; email may be enough.
8. **Call click-to-dial:** tel: links on mobile are free and solve 90% of it. Skip built-in VoIP recording for now.

### Phase 3: Leverage (once revenue is flowing)

9. **myBackyard integration:** When a website contract is signed, auto-create the business's perk listing on myBackyard (the exclusive member discount). This wires the website business directly into the flywheel.
10. **Care plan automation:** Monthly check: is the client's site up? Any updates due? Auto-generate the $50/mo value report ("your site was up 99.9%, 340 visitors").
11. **Reporting v2:** Revenue tracking ($300 builds + $50/mo recurring), pipeline velocity, close rate by source (cold call vs. walk-in vs. wild spot).
12. **n8n webhooks:** Inbound lead from landing page creates a contact automatically. Outbound: new client triggers onboarding checklist.

### Explicitly NOT building

- Power/predictive dialer (he doesn't do volume calling)
- Multi-user seats and permissions (solo)
- AI credits or built-in AI (he has Muse)
- Marketing automation / landing pages (he has the landing page already)
- B2B contact database (he finds his own leads)

---

## 6. Cost Comparison

| | Close Solo (annual) | Close Growth (annual) | BONSAI CRM |
|---|---|---|---|
| Seat cost | $108/yr | $1,188/yr | $0 (self-built) |
| Workflows/automation | No | Yes | Phase 1-2 |
| Calling | Metered, manual only | Power dialer, metered | tel: links (free), Twilio later |
| Fits scott's workflow | Partially | Overkill | Exactly |
| myBackyard integration | No | No | Phase 3 |

**Recommendation:** Build BONSAI CRM Phase 1. It replaces a $108-$1,188/yr Close subscription with something that actually matches how scott sells, and it becomes the system of record for the website business, club outreach, and wild prospects in one place.

---

## Sources

- Close pricing verified against close.com via omidsaffari.com (Oct 5, 2026), traksource.com (Aug 2026), ciroapp.com, droidcrunch.com, saaszap.com, smartreach.io (Sep 2026)
- Feature details: theblogreviews.com (Sep 2026), prospeo.io, monday.com, saleoid.com, compixels.com (Oct 2026), pipeline.zoominfo.com
- Developer platform: developer.close.com (REST API, webhooks, OAuth, MCP server)
- Integrations: help.close.com
