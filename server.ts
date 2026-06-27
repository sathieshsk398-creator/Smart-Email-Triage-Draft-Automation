import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { Email, QueueTask, DailyReport } from './src/types.js';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = 3000;

// Enable JSON middleware
app.use(express.json());

// In-memory / persistent file path
const DATA_FILE = path.join(process.cwd(), 'emails_db.json');

// Preloaded realistic corporate sandbox emails
const INITIAL_EMAILS: Email[] = [
  {
    id: 'email-1',
    subject: 'Double charged for subscription plan',
    sender: 'John Davis',
    senderEmail: 'john.davis@globex.com',
    date: new Date(Date.now() - 3600000 * 2.5).toISOString(), // 2.5 hours ago
    body: 'Hello, I am writing because I noticed my credit card ending in 4521 was charged twice for the Professional Plan ($49.00) on June 24, 2026. Please refund the duplicate charge immediately. My account id is glo-902-pro. Thanks.',
    status: 'unprocessed',
    category: 'Unknown',
    urgency: 'Low',
    sentiment: 'Neutral',
    keyDetails: {},
    summary: '',
    draftReply: '',
    approved: false
  },
  {
    id: 'email-2',
    subject: 'CRITICAL: Database connection failing after update v2.4.1',
    sender: 'Sarah Miller',
    senderEmail: 'sarah.m@techstart.io',
    date: new Date(Date.now() - 3600000 * 1.2).toISOString(), // 1.2 hours ago
    body: 'Hello support, since we updated your SDK to v2.4.1 an hour ago, our production database connections are intermittently failing with error code CONN_TIMEOUT_901. This is currently blocking 50+ active developers in our team and taking down our customer-facing portal. We need an immediate rollback instruction or patch. Our customer key is TECHSTART-PROD-77.',
    status: 'unprocessed',
    category: 'Unknown',
    urgency: 'Low',
    sentiment: 'Neutral',
    keyDetails: {},
    summary: '',
    draftReply: '',
    approved: false
  },
  {
    id: 'email-3',
    subject: 'Enterprise pricing inquiry for 250 users',
    sender: 'Robert Mercer',
    senderEmail: 'mercer.capital@financecorp.com',
    date: new Date(Date.now() - 3600000 * 4.8).toISOString(), // 4.8 hours ago
    body: 'Dear Sales Team,\n\nWe are exploring a transition of our communication hubs to your software and want to request a quote for 250 enterprise seats with advanced SSO and 24/7 support. Could you schedule a 15-minute introductory call next Tuesday to discuss custom volume discounts?\n\nBest regards,\nRobert Mercer\nMercer Capital',
    status: 'unprocessed',
    category: 'Unknown',
    urgency: 'Low',
    sentiment: 'Neutral',
    keyDetails: {},
    summary: '',
    draftReply: '',
    approved: false
  },
  {
    id: 'email-4',
    subject: 'Feedback regarding the dark mode accent colors',
    sender: 'Alisha Harris',
    senderEmail: 'alisha.h@designhouse.co',
    date: new Date(Date.now() - 3600000 * 10).toISOString(), // 10 hours ago
    body: 'Hi guys! I love using your dashboard, but I noticed the high-contrast yellow in dark mode is slightly hard on the eyes when reading logs for several hours. A softer pastel yellow or light teal would be awesome! Otherwise, great product.',
    status: 'unprocessed',
    category: 'Unknown',
    urgency: 'Low',
    sentiment: 'Neutral',
    keyDetails: {},
    summary: '',
    draftReply: '',
    approved: false
  },
  {
    id: 'email-5',
    subject: 'Boost your organic traffic by 400% in 15 days guaranteed!!',
    sender: 'SEO King 99',
    senderEmail: 'seo-king-99@growth-hackerz-seo.biz',
    date: new Date(Date.now() - 3600000 * 24).toISOString(), // 24 hours ago
    body: 'Hey website owner!\n\nWe audited your site and found 14 critical indexing errors that are costing you thousands of visitors. Reply to this email to get a free 30-minute consultation with our top SEO growth experts. Do not reply to opt-out.',
    status: 'unprocessed',
    category: 'Unknown',
    urgency: 'Low',
    sentiment: 'Neutral',
    keyDetails: {},
    summary: '',
    draftReply: '',
    approved: false
  }
];

let emails: Email[] = [];
let queue: QueueTask[] = [];
let reports: DailyReport[] = [];

// Load persisted data or fallback to initials
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const data = JSON.parse(raw);
      emails = data.emails || [];
      queue = data.queue || [];
      reports = data.reports || [];
      console.log(`Loaded state: ${emails.length} emails, ${queue.length} tasks, ${reports.length} reports.`);
    } else {
      emails = [...INITIAL_EMAILS];
      queue = [];
      reports = [];
      saveData();
    }
  } catch (error) {
    console.error('Error loading data from file, falling back to in-memory state:', error);
    emails = [...INITIAL_EMAILS];
    queue = [];
    reports = [];
  }
}

function saveData() {
  try {
    const data = { emails, queue, reports };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving data to file:', error);
  }
}

// Lazy Gemini Initialization to avoid app crash if key is missing on startup
let geminiAI: GoogleGenAI | null = null;
function getGeminiAI(): GoogleGenAI | null {
  if (!geminiAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'MY_GEMINI_API_KEY') {
      console.warn('GEMINI_API_KEY environment variable is not set. Using high-fidelity local simulation.');
      return null;
    }
    geminiAI = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return geminiAI;
}

// Set up WebSocket Server
const wss = new WebSocketServer({ noServer: true });

function broadcast(type: string, payload: any) {
  const message = JSON.stringify({ type, ...payload });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected over WebSocket');
  // Immediately send current state to the client
  ws.send(JSON.stringify({
    type: 'INITIAL_STATE',
    emails,
    queue,
    reports,
    isGeminiConfigured: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
  }));
});

// Queue Runner Thread
let isProcessingQueue = false;

async function processNextQueueTask() {
  if (isProcessingQueue) return;
  
  const pendingTaskIndex = queue.findIndex(t => t.status === 'pending');
  if (pendingTaskIndex === -1) return;

  isProcessingQueue = true;
  const task = queue[pendingTaskIndex];
  task.status = 'running';
  task.progress = 5;
  task.message = 'Initializing background task...';
  broadcast('TASK_UPDATED', { task });
  saveData();

  try {
    if (task.type === 'triage_email' && task.emailId) {
      await runTriageEmailTask(task);
    } else if (task.type === 'triage_batch') {
      await runTriageBatchTask(task);
    } else if (task.type === 'generate_report') {
      await runGenerateReportTask(task);
    } else {
      throw new Error(`Unknown task type: ${task.type}`);
    }

    task.status = 'completed';
    task.progress = 100;
    task.completedAt = new Date().toISOString();
  } catch (error: any) {
    console.error(`Task ${task.id} failed:`, error);
    task.status = 'failed';
    task.progress = 100;
    task.message = `Failed: ${error.message || 'Unknown error'}`;
    task.completedAt = new Date().toISOString();
  } finally {
    broadcast('TASK_UPDATED', { task });
    saveData();
    isProcessingQueue = false;
    // Schedule next task check
    setTimeout(processNextQueueTask, 500);
  }
}

// TASK: Triage Single Email
async function runTriageEmailTask(task: QueueTask) {
  const emailId = task.emailId;
  const emailIndex = emails.findIndex(e => e.id === emailId);
  if (emailIndex === -1) {
    throw new Error(`Email with ID ${emailId} not found`);
  }

  const email = emails[emailIndex];
  email.status = 'triaging';
  broadcast('EMAIL_UPDATED', { email });

  // Update progress
  task.progress = 25;
  task.message = 'Reading incoming email contents & header analytics...';
  broadcast('TASK_UPDATED', { task });
  await delay(1000);

  task.progress = 50;
  task.message = 'Connecting to Gemini AI for natural language classification...';
  broadcast('TASK_UPDATED', { task });

  const ai = getGeminiAI();
  if (ai) {
    try {
      const prompt = `You are an automated customer inbox management agent. Triage and analyze the following incoming customer email:

Sender Name: ${email.sender}
Sender Email: ${email.senderEmail}
Subject: ${email.subject}
Date: ${email.date}

Body Content:
"""
${email.body}
"""

Please provide a structured response classifying the urgency, category, sentiment, extracting key-value details, writing a 1-sentence summary, and writing a tailored professional draft response.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: {
                type: Type.STRING,
                description: "Must be one of: 'Support Claim', 'Billing', 'Spam', 'Sales Inquiry', 'Feedback'"
              },
              urgency: {
                type: Type.STRING,
                description: "Must be one of: 'High', 'Medium', 'Low'"
              },
              sentiment: {
                type: Type.STRING,
                description: "One-word sentiment descriptor, e.g., 'Frustrated', 'Excited', 'Inquisitive', 'Skeptical', 'Neutral'"
              },
              keyDetails: {
                type: Type.OBJECT,
                description: "Extract essential details (e.g. Account ID, Invoice number, Date mentioned, Customer Key) as strings",
                properties: {
                  accountId: { type: Type.STRING },
                  invoiceId: { type: Type.STRING },
                  brokenVersion: { type: Type.STRING },
                  clientName: { type: Type.STRING }
                }
              },
              summary: {
                type: Type.STRING,
                description: "Concise 1-sentence summary"
              },
              draftReply: {
                type: Type.STRING,
                description: "Tailored professional response drafting suitable support/billing replies, or polite spam discard/refusals. Use professional placeholders like '[Your Name]' and sign-offs."
              }
            },
            required: ['category', 'urgency', 'sentiment', 'summary', 'draftReply']
          }
        }
      });

      const resultText = response.text?.trim() || '{}';
      const analysis = JSON.parse(resultText);

      email.category = analysis.category || 'Unknown';
      email.urgency = analysis.urgency || 'Low';
      email.sentiment = analysis.sentiment || 'Neutral';
      email.keyDetails = analysis.keyDetails || {};
      email.summary = analysis.summary || '';
      email.draftReply = analysis.draftReply || '';
      email.status = 'processed';

    } catch (apiError: any) {
      console.error('Gemini API call failed, using high-fidelity fallback:', apiError);
      runLocalTriageFallback(email, `(Note: Gemini call errored: ${apiError.message})`);
    }
  } else {
    // High-fidelity local simulation if API key is not yet set
    await delay(1200);
    task.progress = 75;
    task.message = 'Performing localized regular-expression and keyword heuristics...';
    broadcast('TASK_UPDATED', { task });
    await delay(800);
    runLocalTriageFallback(email, '(Local Offline Engine Mode)');
  }

  email.status = 'processed';
  task.message = `Successfully triaged email from ${email.sender}.`;
  broadcast('EMAIL_UPDATED', { email });
}

// Local simulation fallback
function runLocalTriageFallback(email: Email, modeLabel: string) {
  const bodyLower = email.body.toLowerCase();
  const subjectLower = email.subject.toLowerCase();
  
  let category: Email['category'] = 'Feedback';
  let urgency: Email['urgency'] = 'Low';
  let sentiment = 'Neutral';
  let keyDetails: Record<string, string> = {};
  let summary = '';
  let draftReply = '';

  if (bodyLower.includes('charge') || bodyLower.includes('billing') || bodyLower.includes('invoice') || bodyLower.includes('double') || bodyLower.includes('$')) {
    category = 'Billing';
    urgency = 'Medium';
    sentiment = 'Concerned';
    
    // Simple detail regexes
    const accIdMatch = email.body.match(/account\s*(?:id)?\s*is\s*([a-zA-Z0-9-]+)/i);
    const cardMatch = email.body.match(/card\s*ending\s*in\s*(\d+)/i);
    if (accIdMatch) keyDetails['Account ID'] = accIdMatch[1];
    if (cardMatch) keyDetails['Card Ending In'] = cardMatch[1];
    
    summary = 'Customer John Davis reports a duplicate $49 charge for the subscription plan and requests a refund.';
    draftReply = `Dear ${email.sender},\n\nThank you for reaching out to our billing support. I sincerely apologize for the duplicate charge on your credit card. \n\nI have retrieved your account details (${keyDetails['Account ID'] || 'N/A'}) and initiated a manual review of our payment logs. We have identified the duplicate charge of $49.00 and have processed a refund to your card ending in ${keyDetails['Card Ending In'] || '4521'}. The funds should reflect back in your account within 3-5 business days.\n\nThank you for your patience, and please let us know if we can help with anything else!\n\nBest regards,\n[Your Name]\nBilling Operations Team ${modeLabel}`;
  } 
  else if (bodyLower.includes('critical') || bodyLower.includes('fail') || bodyLower.includes('timeout') || bodyLower.includes('blocking') || bodyLower.includes('error')) {
    category = 'Support Claim';
    urgency = 'High';
    sentiment = 'Frustrated';
    
    const verMatch = email.body.match(/v\d+\.\d+\.\d+/);
    const keyMatch = email.body.match(/customer\s*(?:key)?\s*is\s*([a-zA-Z0-9-]+)/i);
    if (verMatch) keyDetails['SDK Version'] = verMatch[0];
    if (keyMatch) keyDetails['Customer Key'] = keyMatch[1];
    
    summary = 'Sarah Miller reports critical database timeout errors CONN_TIMEOUT_901 blocking development team after v2.4.1 update.';
    draftReply = `Dear ${email.sender},\n\nI understand the severity of this issue and apologize for the disruption this is causing your dev team. Our engineering leads have been notified of your ticket on customer key ${keyDetails['Customer Key'] || 'N/A'}.\n\nThis TIMEOUT error v2.4.1 is likely linked to a socket-pooling change. While we compile a hotfix, please roll back your client-side config to v2.4.0 in package.json and redeploy. This will safely restore connection pools immediately. \n\nWe will update you the second the patch is certified.\n\nWith urgency,\n[Your Name]\nSenior Tier 3 Support ${modeLabel}`;
  } 
  else if (bodyLower.includes('quote') || bodyLower.includes('pricing') || bodyLower.includes('users') || bodyLower.includes('discount')) {
    category = 'Sales Inquiry';
    urgency = 'Medium';
    sentiment = 'Inquisitive';
    
    const countMatch = email.body.match(/(\d+)\s*(?:users|seats)/i);
    if (countMatch) keyDetails['Seats Requested'] = countMatch[1];
    
    summary = 'Robert Mercer requests an enterprise hub transition pricing quote for 250 seats with SSO support.';
    draftReply = `Dear ${email.sender},\n\nThank you for your interest in our Enterprise platform! We would be delighted to host Mercer Capital and provide top-tier collaboration tools for your ${keyDetails['Seats Requested'] || '250'} seats.\n\nOur Enterprise plan includes full SAML SSO, audit logging, and 24/7 priority support. I have drafted a custom package reflecting bulk seat discounts and can coordinate an introductory call for next Tuesday. Let me know if 10:00 AM EST works for you.\n\nWarm regards,\n[Your Name]\nEnterprise Accounts Director ${modeLabel}`;
  } 
  else if (bodyLower.includes('organic') || bodyLower.includes('seo') || bodyLower.includes('traffic') || bodyLower.includes('indexing')) {
    category = 'Spam';
    urgency = 'Low';
    sentiment = 'Promotional';
    
    summary = 'Cold pitch advertising search engine traffic boosts and SEO audits.';
    draftReply = `Hi SEO King,\n\nThanks for reaching out. We are not interested in search engine marketing services at this time. Please remove our email address from your outbound list.\n\nRegards,\nSupport Team ${modeLabel}`;
  } 
  else {
    category = 'Feedback';
    urgency = 'Low';
    sentiment = 'Helpful';
    
    summary = 'Customer Alisha Harris provides constructive UI styling feedback on the yellow dark-mode highlights.';
    draftReply = `Hi ${email.sender},\n\nThank you for sending over this feedback! You are completely right—the high-contrast yellow highlights can cause eye strain under prolonged night work. \n\nI have logged a feature request ticket in our design board to explore softer pastel yellow highlight themes or high-contrast adjustments. We love hearing suggestions from our users!\n\nCheers,\n[Your Name]\nProduct Design Team ${modeLabel}`;
  }

  email.category = category;
  email.urgency = urgency;
  email.sentiment = sentiment;
  email.keyDetails = keyDetails;
  email.summary = summary;
  email.draftReply = draftReply;
}

// TASK: Triage Batch
async function runTriageBatchTask(task: QueueTask) {
  const unprocessed = emails.filter(e => e.status === 'unprocessed');
  const total = unprocessed.length;
  
  if (total === 0) {
    task.message = 'No unprocessed emails found in the queue.';
    task.progress = 100;
    return;
  }

  task.message = `Starting batch triage of ${total} emails...`;
  task.progress = 10;
  broadcast('TASK_UPDATED', { task });

  for (let i = 0; i < total; i++) {
    const email = unprocessed[i];
    task.message = `Processing email ${i + 1} of ${total}: "${email.subject}"...`;
    
    // Trigger direct single triage function but embed it in the batch loop
    const subTask: QueueTask = {
      id: `sub-${Date.now()}`,
      type: 'triage_email',
      emailId: email.id,
      status: 'pending',
      progress: 0,
      message: '',
      createdAt: new Date().toISOString()
    };

    await runTriageEmailTask(subTask);
    
    const percentage = Math.round(10 + (i + 1) * (90 / total));
    task.progress = percentage;
    broadcast('TASK_UPDATED', { task });
    await delay(500);
  }

  task.message = `Batch triage completed. Successfully processed ${total} emails.`;
  task.progress = 100;
}

// TASK: Generate Report
async function runGenerateReportTask(task: QueueTask) {
  task.progress = 15;
  task.message = 'Compiling triage metrics, category breakdowns, and urgency distributions...';
  broadcast('TASK_UPDATED', { task });
  await delay(1200);

  // Compute stats
  const totalEmails = emails.length;
  const processedEmails = emails.filter(e => e.status === 'processed');
  const spams = emails.filter(e => e.category === 'Spam').length;
  
  const byCategory: Record<string, number> = {};
  const byUrgency: Record<string, number> = {};

  emails.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + 1;
    byUrgency[e.urgency] = (byUrgency[e.urgency] || 0) + 1;
  });

  task.progress = 50;
  task.message = 'Connecting to Gemini to synthesize operational insights and trend summaries...';
  broadcast('TASK_UPDATED', { task });

  let summaryText = '';
  let insights: string[] = [];

  const ai = getGeminiAI();
  if (ai && processedEmails.length > 0) {
    try {
      const emailSummaries = processedEmails.map(e => `- [${e.category}] Urgency: ${e.urgency}. Summary: ${e.summary}`).join('\n');
      const prompt = `You are an operations dashboard analyst. Synthesize a neat executive summary of today's customer support inbox activity based on these triaged items:

${emailSummaries}

Include total support claims, urgent tickets, billing issues, spam count, and overall customer satisfaction trends. 

Output your analysis in structured JSON matching this schema:
{
  "summaryText": "A 2-3 sentence executive paragraph explaining key customer friction points and operational health.",
  "insights": [
    "Insight bullet 1 describing a key trend (e.g., system stability, billing queries, etc.)",
    "Insight bullet 2",
    "Insight bullet 3"
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summaryText: { type: Type.STRING },
              insights: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['summaryText', 'insights']
          }
        }
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      summaryText = parsed.summaryText || '';
      insights = parsed.insights || [];
    } catch (apiError) {
      console.error('Gemini Report failed, falling back to local analysis:', apiError);
      const fallback = getLocalReportFallback(emails);
      summaryText = fallback.summaryText;
      insights = fallback.insights;
    }
  } else {
    // Local synthesis
    await delay(1000);
    const fallback = getLocalReportFallback(emails);
    summaryText = fallback.summaryText;
    insights = fallback.insights;
  }

  const newReport: DailyReport = {
    id: `report-${Date.now()}`,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    totalEmails,
    byCategory,
    byUrgency,
    spamPrevented: spams,
    summaryText,
    insights
  };

  reports.unshift(newReport);
  task.result = newReport;
  task.message = 'Dashboard report generated successfully!';
  task.progress = 100;

  broadcast('REPORT_CREATED', { report: newReport });
  broadcast('INITIAL_STATE', { emails, queue, reports }); // Full state sync to refresh dashboard charts
}

function getLocalReportFallback(allEmails: Email[]) {
  const supportCount = allEmails.filter(e => e.category === 'Support Claim').length;
  const billingCount = allEmails.filter(e => e.category === 'Billing').length;
  const spamCount = allEmails.filter(e => e.category === 'Spam').length;
  const salesCount = allEmails.filter(e => e.category === 'Sales Inquiry').length;
  const criticalCount = allEmails.filter(e => e.urgency === 'High').length;

  return {
    summaryText: `Operational review confirms a total of ${allEmails.length} active customer threads. Outstanding issues are centered on high-priority technical support claims (${supportCount} tickets) and billing disputes (${billingCount} tickets). Automated systems successfully identified ${spamCount} advertisement streams, preventing queue clutter.`,
    insights: [
      criticalCount > 0 
        ? `Database connection timeout (CONN_TIMEOUT_901) is currently the highest customer impact incident, flagged as high-urgency.`
        : 'Inbound systems report stable technical metrics with zero active high-severity technical outages.',
      billingCount > 0 
        ? `Duplicate professional subscription charges ($49.00) require reconciliation with the payment provider logs.`
        : 'Billing streams are standard, with prompt refund authorizations.',
      salesCount > 0 
        ? `Enterprise interest is strong, with Robert Mercer seeking volume licensing pricing sheets for 250 enterprise seats.`
        : 'Sales leads queue is currently empty, with marketing campaigns steady.'
    ]
  };
}

// Helper: Delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// API: REST Routes
app.get('/api/emails', (req, res) => {
  res.json(emails);
});

// Generate a highly realistic customer query using Gemini
app.post('/api/emails/generate-simulated', async (req, res) => {
  const ai = getGeminiAI();
  if (ai) {
    try {
      const prompt = `You are a testing assistant for a CRM dashboard. Please write a highly realistic customer support, billing, or sales inquiry email on behalf of a fictitious customer. 
Generate a random product context (e.g. software SaaS subscriptions, physical smart kettles, fitness tracker integrations, logistics/delivery issues) and write the email in a natural, detailed human voice (could be slightly frustrated, curious, or formal).

Output your response strictly in structured JSON following this schema:
{
  "sender": "Fictitious customer's full name",
  "senderEmail": "customer.name@fictitious-domain.com",
  "subject": "A natural, realistic email subject line",
  "body": "The detailed email body containing account IDs or reference numbers, explaining their core problem/request."
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sender: { type: Type.STRING },
              senderEmail: { type: Type.STRING },
              subject: { type: Type.STRING },
              body: { type: Type.STRING }
            },
            required: ['sender', 'senderEmail', 'subject', 'body']
          }
        }
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      if (parsed.sender && parsed.body) {
        return res.json(parsed);
      }
    } catch (err) {
      console.error('Gemini simulation generator failed, falling back to preloaded list:', err);
    }
  }

  // Preloaded dynamic variations list
  const presets = [
    {
      sender: 'Marcus Aurelius',
      senderEmail: 'marcus.a@stoicenterprises.com',
      subject: 'Inquiry regarding volume discounts for corporate teams',
      body: 'Hello sales team,\n\nI am the operations officer at Stoic Enterprises. We are expanding our design group and want to provision 45 accounts on your Plus Tier. Do you offer an annual team discount or direct invoice payments? Please send over your pricing sheet.'
    },
    {
      sender: 'Clara Oswald',
      senderEmail: 'clara.o@time-travelers.org',
      subject: 'Urgent: Unable to log in with SAML SSO',
      body: 'Hi support team, when I try to log into our shared workspace using SAML SSO, it loops back to the login screen with error code SSO_VAL_711. It is preventing me from reviewing urgent customer contracts today. Please check my account status immediately.'
    },
    {
      sender: 'Diana Prince',
      senderEmail: 'diana@themyscira-logistics.com',
      subject: 'Billing discrepancy: charged twice during checkout',
      body: 'To whom it may concern,\n\nI tried purchasing the annual premium license earlier today but received an error on checkout. I retried and it went through, but my bank statement shows two pending charges of $199.00 each. Please cancel and refund the duplicate charge.'
    }
  ];

  const selected = presets[Math.floor(Math.random() * presets.length)];
  res.json(selected);
});

// Create/Inject custom email in the sandbox
app.post('/api/emails', (req, res) => {
  const { subject, sender, senderEmail, body } = req.body;
  
  if (!subject || !sender || !senderEmail || !body) {
    return res.status(400).json({ error: 'Missing required email fields' });
  }

  const newEmail: Email = {
    id: `email-${Date.now()}`,
    subject,
    sender,
    senderEmail,
    date: new Date().toISOString(),
    body,
    status: 'unprocessed',
    category: 'Unknown',
    urgency: 'Low',
    sentiment: 'Neutral',
    keyDetails: {},
    summary: '',
    draftReply: '',
    approved: false
  };

  emails.unshift(newEmail);
  saveData();

  // Create automated background task to triage this email immediately!
  const newTask: QueueTask = {
    id: `task-${Date.now()}`,
    type: 'triage_email',
    status: 'pending',
    progress: 0,
    message: `Scheduled triage for incoming email: "${subject}"`,
    createdAt: new Date().toISOString(),
    emailId: newEmail.id
  };

  queue.push(newTask);
  saveData();

  broadcast('EMAIL_UPDATED', { email: newEmail });
  broadcast('TASK_CREATED', { task: newTask });

  // Process the queue background loop
  processNextQueueTask();

  res.status(201).json({ email: newEmail, task: newTask });
});

// Update/Approve Draft Reply
app.post('/api/emails/:id/approve', (req, res) => {
  const { id } = req.params;
  const { draftReply, category, urgency } = req.body;

  const email = emails.find(e => e.id === id);
  if (!email) {
    return res.status(404).json({ error: 'Email not found' });
  }

  if (draftReply !== undefined) email.draftReply = draftReply;
  if (category !== undefined) email.category = category;
  if (urgency !== undefined) email.urgency = urgency;
  email.approved = true;

  saveData();
  broadcast('EMAIL_UPDATED', { email });

  res.json({ success: true, email });
});

// Refine/Rewrite Draft Response using instructions
app.post('/api/emails/:id/refine', async (req, res) => {
  const { id } = req.params;
  const { instruction, currentDraft } = req.body;

  if (!instruction) {
    return res.status(400).json({ error: 'Instruction is required for refinement' });
  }

  const email = emails.find(e => e.id === id);
  if (!email) {
    return res.status(404).json({ error: 'Email not found' });
  }

  const ai = getGeminiAI();
  if (ai) {
    try {
      const prompt = `You are a professional email drafting editor. Please refine and rewrite the draft email response based on the customer's original email, the previous draft, and the user's instructions.

Original Email Subject: ${email.subject}
Original Email Body:
"""
${email.body}
"""

Previous Draft Reply:
"""
${currentDraft || email.draftReply}
"""

User Refinement Instructions:
"""
${instruction}
"""

Provide ONLY the newly rewritten professional email draft response. Do not include any JSON wrappers, introductory text, explanations, markdown code fences, or sign-offs outside the email content itself. Just output the clean refined text response.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      const refinedText = response.text?.trim() || '';
      if (refinedText) {
        email.draftReply = refinedText;
        saveData();
        broadcast('EMAIL_UPDATED', { email });
        return res.json({ success: true, draftReply: refinedText, email });
      } else {
        throw new Error('Empty text returned from Gemini');
      }
    } catch (err: any) {
      console.error('Refinement query failed, fallback simulation applied:', err);
    }
  }

  // Fallback Refinement simulation if Gemini offline / missing key
  await delay(1200);
  const appendNotice = `\n\n[Refined Offline: Applied rule "${instruction}"]`;
  email.draftReply = (currentDraft || email.draftReply) + appendNotice;
  saveData();
  broadcast('EMAIL_UPDATED', { email });

  res.json({ success: true, draftReply: email.draftReply, email });
});

// Trigger explicit triage task for specific email
app.post('/api/emails/:id/triage', (req, res) => {
  const { id } = req.params;
  const email = emails.find(e => e.id === id);
  if (!email) {
    return res.status(404).json({ error: 'Email not found' });
  }

  // Check if there is already a pending/running task for this email
  const existingTask = queue.find(t => t.emailId === id && (t.status === 'pending' || t.status === 'running'));
  if (existingTask) {
    return res.json({ message: 'Triage task already in queue', task: existingTask });
  }

  const newTask: QueueTask = {
    id: `task-${Date.now()}`,
    type: 'triage_email',
    status: 'pending',
    progress: 0,
    message: `User requested explicit retriage for email: "${email.subject}"`,
    createdAt: new Date().toISOString(),
    emailId: email.id
  };

  queue.push(newTask);
  saveData();

  broadcast('TASK_CREATED', { task: newTask });
  processNextQueueTask();

  res.json({ message: 'Triage task added', task: newTask });
});

// Trigger full batch triage
app.post('/api/queue/batch-triage', (req, res) => {
  const unprocessedCount = emails.filter(e => e.status === 'unprocessed').length;
  if (unprocessedCount === 0) {
    return res.status(400).json({ error: 'No unprocessed emails in the inbox' });
  }

  const newTask: QueueTask = {
    id: `task-${Date.now()}`,
    type: 'triage_batch',
    status: 'pending',
    progress: 0,
    message: `Triggered batch triage of ${unprocessedCount} unprocessed emails`,
    createdAt: new Date().toISOString()
  };

  queue.push(newTask);
  saveData();

  broadcast('TASK_CREATED', { task: newTask });
  processNextQueueTask();

  res.json({ message: 'Batch triage task queued', task: newTask });
});

// Trigger executive report generation
app.post('/api/queue/generate-report', (req, res) => {
  const newTask: QueueTask = {
    id: `task-${Date.now()}`,
    type: 'generate_report',
    status: 'pending',
    progress: 0,
    message: 'Compiling Daily Operational Report and Insights...',
    createdAt: new Date().toISOString()
  };

  queue.push(newTask);
  saveData();

  broadcast('TASK_CREATED', { task: newTask });
  processNextQueueTask();

  res.json({ message: 'Report task queued', task: newTask });
});

// Clear/Reset data
app.post('/api/reset', (req, res) => {
  emails = [...INITIAL_EMAILS];
  queue = [];
  reports = [];
  saveData();
  
  broadcast('INITIAL_STATE', { emails, queue, reports });
  res.json({ success: true, message: 'Sandbox environment reset to initial state' });
});

// Bootstrapping the database state
loadData();

// Vite Middleware integration for SPA serving
const startServer = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const expressServer = server.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Email Triage server running on http://localhost:${PORT}`);
  });

  // Attach WebSocket server connection upgrade handling
  expressServer.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });
};

startServer();
