# Smart Email Triage & Draft Automation

An AI-powered customer inbox workspace that automatically classifies incoming emails, extracts key details, and drafts professional reply suggestions — with a live, real-time dashboard for monitoring background processing.

Built with a React + TypeScript frontend, an Express/WebSocket backend, and Google's Gemini API for natural language understanding.

---

## Overview

Support and sales inboxes are noisy: billing complaints, critical bug reports, sales inquiries, spam, and product feedback all land in the same queue. This project simulates an automated triage layer that sits in front of that inbox and does the first pass of work for a human agent:

- Classifies each email by **category**, **urgency**, and **sentiment**
- Extracts structured **key details** (account IDs, invoice numbers, version numbers, etc.)
- Generates a concise **summary** and a **draft reply** ready for review
- Lets a human refine the draft with natural-language instructions before approving it
- Rolls all activity up into a **daily operations report** with AI-generated insights

All processing runs through an asynchronous background task queue with live progress updates pushed to the UI over WebSockets, so triage doesn't block the interface and multiple emails can be processed in sequence without a page reload.

## Key Features

- **AI-Powered Classification** — Each email is analyzed by Gemini and categorized as a Support Claim, Billing issue, Sales Inquiry, Feedback, or Spam, with an associated urgency level and sentiment.
- **Structured Detail Extraction** — Account IDs, invoice numbers, software versions, and other key-value details are pulled directly from the email body.
- **AI-Drafted Replies** — A tailored, professional response is generated automatically for every triaged email.
- **Conversational Draft Refinement** — Reviewers can request edits to a draft in plain English (e.g. "make this more formal") and get an updated version.
- **Real-Time Task Queue** — A visual queue tracker shows each background job (single triage, batch triage, report generation) moving through pending → running → completed/failed states, streamed live via WebSockets.
- **Batch Triage** — Process every unprocessed email in the inbox in one action.
- **Daily Operational Reports** — On-demand, AI-synthesized executive summaries covering ticket volume, category/urgency breakdowns, and spam prevented.
- **Email Simulator** — Generate realistic, randomized test emails (via Gemini or a built-in preset library) to populate the sandbox without needing a real mailbox.
- **Graceful Offline Fallback** — If no Gemini API key is configured, the app automatically switches to a high-fidelity local heuristic engine (keyword/regex-based) so the full workflow remains demoable without an API key.
- **Persistent State** — Emails, queue tasks, and reports are persisted to a local JSON file so state survives server restarts.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Real-time updates | WebSockets (`ws`) |
| AI | Google Gemini API (`@google/genai`) |
| Icons / Animation | lucide-react, motion |
| Persistence | JSON file storage (`emails_db.json`) |

## Architecture

```
┌──────────────────┐        REST + WebSocket        ┌──────────────────────┐
│   React Frontend  │ ◄─────────────────────────────► │   Express Server      │
│  (Vite / Tailwind) │                                 │   (server.ts)         │
└──────────────────┘                                  └───────────┬───────────┘
                                                                   │
                                                        Background Task Queue
                                                     (triage / batch / reports)
                                                                   │
                                                     ┌─────────────▼─────────────┐
                                                     │   Gemini API   │  Local    │
                                                     │  (if key set)  │  Fallback │
                                                     └────────────────┴───────────┘
                                                                   │
                                                          emails_db.json
                                                        (persisted state)
```

The Express server exposes REST endpoints for managing emails, tasks, and reports, and broadcasts state changes to all connected clients over a WebSocket connection so the UI updates instantly as background jobs progress.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- A [Gemini API key](https://ai.google.dev/) (optional — the app runs in local simulation mode without one)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/Smart-Email-Triage-Draft-Automation.git
   cd Smart-Email-Triage-Draft-Automation
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables. Copy the example file and add your key:
   ```bash
   cp .env.example .env.local
   ```
   Then set:
   ```
   GEMINI_API_KEY="your-gemini-api-key"
   ```
   > If `GEMINI_API_KEY` is left unset, the app automatically falls back to a local rule-based triage engine, so it still runs end-to-end without an API key.

4. Start the development server:
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`.

### Production Build

```bash
npm run build
npm start
```


## Project Structure

```
├── server.ts                  # Express + WebSocket backend, task queue, Gemini integration
├── src/
│   ├── App.tsx                 # Root component, WebSocket client, state management
│   ├── types.ts                 # Shared TypeScript types (Email, QueueTask, DailyReport)
│   ├── components/
│   │   ├── EmailList.tsx        # Inbox list view
│   │   ├── EmailWorkspace.tsx   # Email detail + draft reply workspace
│   │   ├── TaskQueueTracker.tsx # Real-time background job tracker
│   │   ├── MetricCards.tsx      # Summary metric widgets
│   │   ├── ReportView.tsx       # Daily report display
│   │   └── SimulateEmailModal.tsx # Modal for generating test emails
│   └── index.css
├── emails_db.json              # Persisted local state (emails, queue, reports)
├── .env.example                 # Environment variable template
└── package.json
```

## Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | API key for Gemini AI calls. If omitted, the app uses a local heuristic fallback engine. |
| `APP_URL` | The URL where the app is hosted (used for self-referential links). |

## Usage

1. **View the inbox** — The workspace loads with a set of realistic sample emails covering billing, critical bugs, sales, feedback, and spam.
2. **Triage an email** — Select an email and trigger triage, or run **Batch Triage** to process every unprocessed email at once.
3. **Review the AI output** — Inspect the assigned category, urgency, sentiment, extracted details, and the generated draft reply.
4. **Refine the draft** — Give plain-language instructions to adjust tone or content, then approve the final reply.
5. **Simulate new emails** — Use the built-in simulator to inject fresh, realistic test emails into the inbox.
6. **Generate a report** — Compile a daily operational report summarizing ticket volume, category/urgency distribution, and AI-generated insights.

All of the above happens through an async task queue visible in real time in the **Task Queue Tracker** panel.


## Author

Sathiesh Kumar M

View my website in: https://smart-email-triage-draft-automation-1.onrender.com/


