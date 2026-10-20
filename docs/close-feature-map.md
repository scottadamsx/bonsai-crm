# Close CRM: Feature Map and Mobile Cleanliness Spec

Purpose: the reference document for the BONSAI CRM UI rework. It maps what Close actually does (from Close's own help center, developer docs, and marketing pages), how its desktop and mobile apps are organized, and where BONSAI stands against it today.

Researched 2026-10-20. Sources are cited next to each section. Claims below come from the cited pages only.

---

## 1. Feature Map

Features are grouped the way Close organizes its own product and documentation.

### Leads

What it does: The Lead is the central record in Close. A lead is a company or account, and it carries a status, a description, addresses, a URL, custom fields, and everything that happens with that account (contacts, opportunities, activities, tasks). The Leads page is the main working list of the app.

Key screens and flows:
- Leads list: a filterable, sortable table of leads. Click "Add Filter" at the top left to stack filters (calls, emails, tasks, custom fields, statuses). Filters accumulate as chips at the top of the page. Columns are customizable, and the column set saves with the view.
- Search bar with AI Search: plain language queries like "leads who have not been contacted in 20 days and are under a specific status" return a filtered list. Works from any page.
- Lead creation: contacts, addresses, and custom fields can be nested in a single create call via the API; activities, tasks, and opportunities are added separately.
- Bulk actions from the list: bulk email, bulk status changes, bulk custom field updates.

Source: https://help.close.com/feature-guide/lead-filtering-and-smart-views and https://developer.close.com/api/resources/leads/create.mdx

### Contacts

What it does: A Contact is a person on a Lead (name, title, one or more emails, phones, and URLs). One lead holds many contacts. Contacts can be searched and filtered independently of leads, including a local time column derived from the contact's phone number.

Key screens and flows:
- Contacts are edited inside the lead page, and also have their own searchable list.
- Contact based searches sort by the contact's local time, so reps call at sane hours.
- In the API, contacts are nested under leads and auto-save when the lead is updated.

Source: https://help.close.com/feature-guide/lead-filtering-and-smart-views and https://developer.close.com/api/resources/advanced-filtering

### Opportunities and Pipelines

What it does: An Opportunity is a deal on a Lead. It has a value, a value period (one-time, monthly, or annual), a confidence percentage, a note, and a status. Pipelines group opportunity statuses into stages. Expected value (value times confidence) and annualized value are calculated for forecasting.

Key screens and flows:
- Pipeline view: a board of opportunities grouped by status, with totals per stage.
- Opportunity statuses belong to a pipeline and each has a type: active, won, or lost. Setting a won type status stamps date_won automatically; a lost status stamps date_lost.
- Stalled opportunity detection: opportunities can be flagged as stalled, with suggested actions, so dead deals surface instead of rotting.
- On the lead page, opportunities sit next to contacts and custom fields and are filterable.

Source: https://developer.close.com/api/resources/opportunities/list.mdx and https://developer.close.com/api/resources/opportunities/update.mdx

### Inbox

What it does: The Inbox is the daily driver screen. It merges everything that needs attention into one prioritized stream: tasks due today, incoming emails, missed calls, voicemails, SMS replies, and form submissions. Filter tabs at the top let you see only one type (for example, only Tasks).

Key screens and flows:
- Inbox (due today or overdue), Inbox > Future (scheduled later), Inbox > Done (completed).
- When a task comes due, a banner pops up: mark done, snooze, or click through to the lead.
- Items are actionable in place: reply to the email or SMS, return the call, or complete the task without opening the lead.
- Close's own guidance: a task's date is a "notification date", the day you want it to appear in the Inbox, not a hard deadline. Routine follow-up tracking belongs in Smart Views, and Tasks are for unique actions.

Source: https://help.close.com/feature-guide/tasks and https://close.com/crm

### Smart Views

What it does: A Smart View is a saved, dynamic filter over Leads or Contacts. The list re-evaluates constantly, so a view like "active opportunity, no communication in 3 days, no upcoming meeting, incomplete tasks" is always current. This is Close's anti-slip mechanism and how reps work a call list.

Key screens and flows:
- Build with stacked filters, customize columns, multi-field sort, then save. Saved Views hub holds Smart Views, Conversations, and Reports, with private and shared visibility.
- Any saved view can be pinned to the left sidebar for one click access.
- Smart Fields power the best filters: Latest communication (summary plus direction), Latest communication date, Latest communication user, Opportunity values, Email last opened, Local time.
- Canonical views Close teaches: hot leads (opened or replied recently), stalled deals (no activity in 30 plus days), renewals coming due, new leads with no logged activity, red flag views for leads slipping through the cracks.

Source: https://help.close.com/feature-guide/lead-filtering-and-smart-views and https://help.close.com/feature-guide/lead-filtering-and-smart-views/lead-filtering-tips

### Calling

What it does: Built-in VoIP calling is the core of Close. Click to call from any lead or list, calls log automatically with outcome, duration, recording, and transcript. Includes voicemail drop, call dispositions, and inbound calling with the lead's context popping up when the phone rings.

Key screens and flows:
- Call bar and composer on the lead page; one click dialing from lists and Smart Views.
- Power Dialer: works through a list dialing one number after another, logging as it goes. Predictive Dialer dials several numbers at once and connects only answered calls (Scale plan).
- Call Assistant: transcription and AI summaries of calls.
- Live call coaching on higher plans.

Source: https://close.com/crm (also summarized in ~/workspace/bonsai-crm/research.md, section 1)

### SMS

What it does: Native two-way SMS from the same numbers used for calling. Every text is logged to the lead timeline automatically, and texts arrive in the Inbox like email.

Key screens and flows:
- SMS composer on the lead page, threaded conversation view.
- SMS templates, scheduled messages, and SMS steps inside sequences and workflows.
- Centralized SMS inbox view across all leads.

Source: https://close.com/crm and https://close.com/blog/close-for-android

### Email

What it does: Two-way sync with Gmail and Outlook. Every sent and received email lands on the lead timeline with no manual logging. Includes templates, open and click tracking, bulk email, and email steps in sequences.

Key screens and flows:
- Email composer on the lead page with template picker.
- Email sync setup lives in Settings > Accounts and Apps (connect mailbox first, it is step 1 of Close's onboarding checklist).
- Opens feed Smart View filters ("opened my last email 7 plus days ago, never replied").

Source: https://help.close.com/getting-started/onboarding-checklist-start-here and https://close.com/crm

### Sequences and Workflows

What it does: Sequences enroll a lead in a timed series of steps (email, SMS, call task, generic task). Workflows are the broader automation engine: a trigger (new lead, status change, published custom activity, and more) runs steps such as sending email or SMS, creating tasks, creating opportunities, updating lead fields, or assigning a user.

Key screens and flows:
- Sequence builder: ordered steps with delays, using templates.
- Workflow step types include Email, SMS, Task (description, due date such as "immediately" or X days after the step, assignee), Create Opportunity, and Update Lead.
- A task due "immediately" rises to the top of the assignee's Inbox, which is how Close guarantees fast first follow-up on new leads.
- Workflow runs pause on required task steps unless the step is marked optional.

Source: https://help.close.com/feature-guide/workflows/workflow-steps and https://close.com/crm

### Tasks

What it does: A Task is one concrete to-do tied to a lead (optionally to a contact or opportunity), with a description, a due date and time, and an assignee. Tasks surface in the Inbox on their date.

Key screens and flows:
- Create from the lead page, from a workflow, or from the Inbox.
- Complete, snooze to a future date, reassign, or delete. Bulk complete and bulk snooze from the Inbox to clear clutter.
- Lead filters can find leads by their tasks (Task Status = Open, Assigned to = a user), which powers red flag views.

Source: https://help.close.com/feature-guide/tasks

### Reporting

What it does: Built-in reports over activity and pipeline: Activity Overview, Activity Comparison (rep versus rep), Sales Funnel, opportunity and pipeline reports, lead status change reports, email template performance, workflow performance, and leaderboards. Reports can be saved like views and filtered by the same query system.

Key screens and flows:
- Lead status report: per status, started count, ended count, net change, gained, lost, entered, left, plus a status transitions table (from status, to status, count) for a period.
- Reports are reachable from the Saved Views hub alongside Smart Views and Conversations.

Source: https://developer.close.com/api/resources/reporting/get-lead-statuses.mdx and https://close.com/crm

### Custom Fields and Custom Activities

What it does: Custom Fields extend Leads, Contacts, Opportunities, and Activities (text, number, date, choices, user, and more; single or multiple values). Custom Activities let an org define its own activity types (for example, "Demo booked" or "Site visit") that behave like native activities in the feed, filters, and workflows. Custom Objects extend this further to whole new record types.

Key screens and flows:
- Field values are set with keys like custom.cf_FIELD_ID in the API; multi-value fields support add and remove operations.
- Custom fields are filterable and sortable (choice based fields cannot be sorted), and can be columns in any lead list or Smart View.
- Custom fields can be converted into shared fields usable across object types.

Source: https://developer.close.com/api/resources/leads/create.mdx and https://developer.close.com/api/resources/advanced-filtering

### Integrations and API

What it does: A full REST API (API key basic auth or OAuth 2.0 bearer) covering leads, contacts, opportunities, activities, tasks, smart views, pipelines, statuses, custom fields, custom activities, custom objects, reporting, and users. Plus webhooks for real-time events, an official MCP server so AI agents can read and write Close data, Zapier, and native integrations (calendars, Zoom, Slack, DocuSign, HubSpot, Mailchimp, Help Scout, and others).

Key screens and flows:
- API keys are created in Settings > API Keys.
- Advanced Filtering API mirrors the UI filter system, including include_counts for scheduled Smart View counts.
- Webhook subscriptions stream events like new lead, call completed, and email opened.

Source: https://developer.close.com/api/resources/advanced-filtering (integration breadth also summarized in ~/workspace/bonsai-crm/research.md, section 3)

### Settings and Roles

What it does: Organization settings cover the data model and the team: lead statuses, opportunity statuses and pipelines, custom fields and activities, connected accounts and apps (email, calendar), phone numbers, API keys, team memberships, roles, and lead visibility rules.

Key screens and flows:
- Onboarding order Close prescribes: connect email and calendar, then customize lead records (statuses, custom fields, custom activities, opportunity statuses), then import data, then learn the Inbox, then set up phone numbers and SMS.
- Roles and permissions are a higher plan feature: role based permissions and lead visibility rules govern who sees and edits what.

Source: https://help.close.com/getting-started/onboarding-checklist-start-here and ~/workspace/bonsai-crm/research.md, sections 1 and 2

### Also present in Close (know it exists, mostly out of scope for BONSAI)

- Forms: built-in lead capture forms that feed the Inbox.
- Meetings: calendar sync (Google, Outlook), Zoom links, meeting logging, AI Notetaker with transcripts and summaries.
- Chloe AI agent: AI calling agent, call summaries, email rewriting, lead enrichment, lead summaries. Metered by AI credits on every plan.
- Bulk email and bulk editing from any filtered list.

Source: https://close.com/crm and ~/workspace/bonsai-crm/research.md, section 1

---

## 2. Data Model

Sources for this section: https://developer.close.com/api/resources/leads/create.mdx, https://developer.close.com/api/resources/opportunities/list.mdx, https://developer.close.com/api/resources/opportunities/update.mdx, https://developer.close.com/api/resources/advanced-filtering

### Core objects

- **Lead**: the account (usually a company). Fields include display_name, status_id, description, url, addresses, and custom fields. A lead owns contacts, opportunities, activities, and tasks. Deleting or working a lead means working the whole relationship.
- **Contact**: a person on exactly one lead (lead_id). Fields: name, title, and lists of emails, phones, and URLs, each item typed (for example, office or mobile). Contacts are the humans; leads are the accounts.
- **Opportunity**: a deal on a lead (lead_id, optionally contact_id). Fields: pipeline_id, status_id, value (integer, cents in the API), value_period (one_time, monthly, annual), confidence (0 to 100), expected_value and annualized_expected_value (calculated), note, date_won, date_lost.
- **Activity**: one timeline event on a lead. Native types: Call, Email, SMS, Meeting, Note, and Task completions, plus org defined Custom Activities. Activities carry direction (inbound or outbound), status, duration, a note, created_by, and date_created. Every communication in Close is an activity, which is why the lead feed can show everything in one stream.
- **Task**: a to-do with a due date, an assignee, and links to a lead, and optionally a contact or opportunity. Tasks appear in the Inbox on their date and are also queryable as activity adjacent data.
- **Smart View**: a stored filter definition (the same query JSON the Advanced Filtering API accepts) plus a saved column set and sort. It is a query, not a static list, so membership is always live.
- **Pipeline**: a named set of opportunity statuses. Pipelines let different sales motions (for example, new business versus renewals) track deals separately.

### How they relate

```
Organization
  Lead (account, has a Lead Status)
    Contact (person, many per lead)
    Opportunity (deal, belongs to one Pipeline, has an Opportunity Status)
    Activity (call, email, SMS, meeting, note; the timeline)
    Task (to-do, due date, assignee)
  Smart View (saved query over Leads or Contacts)
  Pipeline (set of Opportunity Statuses)
  Custom Field (defined per object type, values stored on each record)
```

### Lead Status versus Opportunity Status (the distinction that matters)

- **Lead Status** describes where the relationship stands, independent of any deal: typical label sets run from cold to working to customer to dead (labels are fully org defined, stored as a status list, referenced by status_id). One lead has exactly one lead status at a time. Reporting tracks how many leads started, ended, entered, and left each status in a period, and every transition between statuses.
- **Opportunity Status** describes one deal's stage inside one pipeline. Each status has a type: active, won, or lost. Moving to a won type status auto-stamps date_won; moving to lost stamps date_lost. A lead can hold several opportunities in different statuses at once.
- Practical rule: lead status answers "what is this account to us", opportunity status answers "where is this specific deal". Close keeps them separate on purpose, and conflating them is the most common CRM modeling mistake.

---

## 3. Navigation and Layout (Desktop)

Sources: https://close.com/changelog/improved-navigation (September 21, 2026 navigation redesign), https://help.close.com/feature-guide/lead-filtering-and-smart-views, https://close.com/crm

### Sidebar and app chrome

- **Search sits at the top of the sidebar** (moved there from the top bar in the September 2026 redesign) and can be triggered with the / key. It is the AI Search box, available on every page.
- **Main nav**: Inbox, Leads, Opportunities, Reporting, and the Saved Views area. Pinned Smart Views live in the sidebar under the main nav for one click access.
- **Organization switcher** is in the sidebar and now also holds import and memberships.
- **Bottom of the sidebar**: user profile (with a clear light and dark mode switcher) and help and support resources. Utility items are pushed to the bottom so the middle of the sidebar is all work.
- **App header**: on lead pages it carries Next and Previous lead buttons, so you can walk a list without going back. The Chloe AI entry point also sits in the header. Notification counts are shown with high legibility treatment.

### The Leads page

- Filter bar at the top: "Add Filter" builds stacked filter chips, Sort sits next to it, and the columns button customizes the table. Everything on this page (filters, columns, sort) is exactly what gets saved when you save a Smart View.

### The Lead page

- Header: lead name, lead status control, Next and Previous lead navigation.
- Left column (the record): lead details (description, address, URL), Contacts (filterable), Custom Fields (filterable), Opportunities, and Tasks for this lead. Everything about the account that is structured data lives here.
- Center column (the story): a single chronological Activity Feed holding calls, emails, SMS, meetings, notes, and custom activities, newest in context. Long notes collapse by default with a Show more expander.
- Composer: at the top of the feed, tabbed by action (note, email, SMS, call log), so logging or sending happens in the same place you read history. Files can be dragged and dropped straight onto the feed to create a note with the file attached.
- The design intent, in Close's own words: consolidate calls, texts, emails, tasks, notes, and deals all in one place for total lead clarity.

---

## 4. Mobile Cleanliness Spec

Primary source: https://close.com/blog/close-for-android (Close's official mobile launch post, covering both apps). Supporting: https://close.com/crm

### What the mobile app actually contains

- **Inbox is the home screen.** One unified stream with toggle filters for emails, calls, SMS, and tasks, plus a Calendar button for upcoming meetings. The phone opens onto "what needs me now", not a dashboard.
- **Leads**: a scrollable lead list with search, and Smart Views you open to start working a queue (for example, a calling list). No filter builder on the phone; the views were built on desktop and are consumed on mobile.
- **Lead profile: two tabs only, Details and Activities.** Details are editable in place. New activities are added from the profile as they happen. Call, SMS, and email actions live on the profile itself.
- **Calling**: inbound and outbound calling from the Close number, with contact context shown on incoming calls. Calls log automatically, with transcripts and AI summaries when Call Assistant is on.
- **Reporting is a short, curated set**: Sales Pipeline report (with the ability to update lead status on the go), Activity Overview (customizable dashboard), Activity Comparison, and Sales Funnel. Close's framing: "all the metrics you need, and none you don't."
- **Push notifications replace checking**: new SMS, voicemail, and missed call alerts arrive in real time.

### What mobile leaves out versus desktop

- No Smart View or filter construction, no custom columns, no multi-field sorting setup.
- No workflow or sequence building, no automation settings.
- No admin: no statuses, pipelines, custom fields, roles, API keys, or org settings.
- No bulk actions, no import, no reporting design (only viewing the prebuilt reports).
- Mobile is for communicating, logging, and checking status. Configuration stays on desktop.

### Concrete rules to copy into BONSAI (mobile web)

1. **Open on an Inbox, not a dashboard.** The first screen on a phone is one merged list of what is due and what came in (follow-ups due, recent replies), with simple type toggles at the top. Stat cards can wait for desktop.
2. **Bottom navigation, four to five items maximum.** Inbox, Leads, Pipeline, Follow-ups, Search. Everything else goes behind a single More or profile entry. If a destination is used less than weekly, it does not get a tab.
3. **Two tabs on the record screen.** Details and Activity. One scroll each, no nested cards, no third tab. If it does not fit one of those two buckets, it does not ship on mobile.
4. **One primary action per screen, thumb anchored.** On a lead it is Call (with Text and Log note as the two secondary actions in the same sticky bottom bar). Buttons at least 44 px tall, full width blocks over floating chips.
5. **Dense but calm list rows.** Each lead row shows exactly four things: name, status chip, latest activity summary, and its time. Nothing else. Rows around 56 to 64 px, one divider line, no card shadows, no nested boxes.
6. **Consume views, never build them on mobile.** Smart Views appear as a simple picker above the list. All filter construction happens on wide screens.
7. **Pipeline becomes a list on phones.** No horizontal kanban. Group deals by stage in one vertical scroll, tap to open, and change stage from inside the deal with a single picker.
8. **Hide by default, reveal on tap.** Secondary fields (address, custom fields, full history filters) start collapsed. The first viewport of any screen answers one question only.
9. **One accent color, one type scale.** Status gets a small colored chip; everything else is neutral text. No color coding by section, no decorative headers.
10. **Notifications over badges over nothing.** If something needs the user today, it is in the Inbox list itself, not a red dot they have to go hunting from.

---

## 5. Gap Table: Close versus BONSAI Today

BONSAI state checked against ~/workspace/bonsai-crm/src on 2026-10-20 (dashboard, contacts with detail page, pipeline kanban, activities, smart views, sequences with email templates, reminders page, CSV import, settings). Priorities follow ~/workspace/bonsai-crm/research.md sections 4 and 5: no dialer, no multi-user, no AI credits, build only the 20 percent a solo operator uses.

| Close feature | BONSAI has it? | Priority for a solo operator |
|---|---|---|
| Leads list with filters and search | Partial. Contacts page has search and type/category filters, but the record merges Lead and Contact into one row, and there is no lead status. | Must: add a lead status field. The list plus status is the core working surface. |
| Lead statuses (org defined) | No. Closest equivalent is contact_type (prospect, club, client) and category. | Must: one status per pipeline stage of the relationship (Spotted, Contacted, Working, Client, Dead) drives every filter that matters. |
| Contacts as people on a lead | No. One contact record holds both the business and the person. | Skip: for solo outreach to small businesses, merged is fine and simpler. Revisit only if a business needs two people tracked. |
| Opportunities and pipelines (kanban) | Yes. Deals with stages, drag and drop kanban, one-time value plus monthly recurring value, multiple pipelines (websites, clubs). | Done. Keep. |
| Opportunity confidence and won/lost dates | No. Deals have value and recurring value only. | Nice: a won date makes revenue reporting real later. Confidence can wait. |
| Inbox (unified, prioritized) | No. Follow-ups live on their own page and a dashboard card; there is no merged stream of due items and recent activity. | Must: this is the single highest value screen for a solo operator. A Today view merging overdue and due follow-ups with the latest activity per lead. |
| Smart Views | Partial. Saved views exist with filters for stage, category, tags, type, priority, pipeline. No activity based filters (no contact in X days, no upcoming follow-up), and views are not pinned in the sidebar. | Must: add activity based filters and sidebar pinning. The "not contacted in 14 days, no follow-up scheduled" view is the anti-slip mechanism from the research. |
| Built-in calling (VoIP) | No. tel: links only (Call Now on the contact page). | Skip: research.md is explicit, tel: links solve 90 percent for 5 to 10 calls a day. |
| Power and Predictive Dialer | No. | Skip: explicitly not needed, ever, at solo volume. |
| SMS (two-way, logged) | No. SMS exists only as a manual activity type to log. | Nice: Twilio in Phase 2 if email is not enough. Not a launch blocker. |
| Email sync and sending | No. Templates exist; nothing sends or syncs, emails are logged manually as activities. | Nice: Gmail send from the CRM is Phase 2. Tracking outreach status matters now, sending can stay in Gmail. |
| Sequences | Partial. Sequence definitions with day based steps, templates, and enrollments exist. Nothing sends automatically; progress is tracked manually. | Must for tracking (club Day 0/4/11 outreach status), Nice for automation. |
| Workflows (trigger based automation) | No. | Skip for now: solo volume does not justify a trigger engine. Revisit after revenue. |
| Tasks | Yes, as Reminders: due date, complete, per contact, with Overdue, Due Today, and Upcoming groups on the Follow-ups page. No snooze. | Done. Nice: add snooze, it is one field and one button. |
| Reporting | Partial. Dashboard stat cards: total contacts, active deals, pipeline value, monthly recurring, clients won, conversion rate, follow-ups due, recent activity. No period reports, no status flow, no per source breakdown. | Nice: simple counts are enough now. Revenue and close rate by source is Phase 3. |
| Custom Fields | Partial. A custom_fields JSON store exists on contacts and CSV import can carry values, but there is no field definition UI and no filtering by custom fields. | Nice: definitions UI only when a real field is needed twice. |
| Custom Activities | Partial. Five fixed activity types (call, email, sms, meeting, note). | Skip: the fixed five cover a solo operator's motion. |
| Custom Objects | No. | Skip. |
| Forms (lead capture) | No. Quick add contact exists; CSV import exists. | Nice: a landing page webhook that creates a contact is Phase 3. |
| Meetings and calendar | No. Meetings are a loggable activity type only. | Skip: his calendar already handles scheduling. |
| Integrations and API | No public API, no webhooks, no Zapier. | Skip now, Nice later: one inbound webhook for the landing page (Phase 3). |
| Settings | Partial. Settings covers pipeline stages and email templates only. | Done for Phase 1 scope. Statuses settings arrive with the lead status field. |
| Roles and permissions | No, by design. Single user, Supabase Auth login, signups disabled. | Skip: explicitly out of scope in research.md. |
| AI (Chloe, Call Assistant, enrichment) | No. | Skip: explicitly out of scope. He has Muse. |
| Bulk email and bulk edits | No. | Skip: 20 leads and 22 clubs do not need bulk tooling. |

### BONSAI extras Close does not emphasize

- Monthly recurring value is a first class field on every deal, because the care plan ($50/mo) is the business model. Close models this as a value period; BONSAI's simpler version is fine.
- Pipelines are pre-built around scott's three motions (websites, clubs, wild prospects) rather than a blank sales pipeline.

---

## 6. What the rework should take from this document

1. Add lead status as its own concept, separate from pipeline stage (section 2).
2. Build the Inbox as the home screen, desktop and mobile: overdue and due follow-ups merged with latest activity (sections 1 and 4).
3. Upgrade Smart Views with activity based filters (days since last contact, no upcoming follow-up) and pin views in the sidebar (section 1).
4. Reshape the contact page into Close's lead page: details rail on the left, one activity feed in the center, composer on top of the feed (section 3).
5. Apply the mobile rules in section 4 verbatim as acceptance criteria for every screen at phone width.
6. Do not build: dialer, SMS sending, workflows, roles, AI, bulk tools. The research already decided this; the gap table records it so it is not re-litigated.
