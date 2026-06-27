export interface Email {
  id: string;
  subject: string;
  sender: string;
  senderEmail: string;
  date: string;
  body: string;
  status: 'unprocessed' | 'triaging' | 'processed' | 'failed';
  category: 'Support Claim' | 'Billing' | 'Spam' | 'Sales Inquiry' | 'Feedback' | 'Unknown';
  urgency: 'High' | 'Medium' | 'Low';
  sentiment: string;
  keyDetails: Record<string, string>;
  summary: string;
  draftReply: string;
  approved: boolean;
}

export interface QueueTask {
  id: string;
  type: 'triage_email' | 'triage_batch' | 'generate_report';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number; // 0 to 100
  message: string;
  createdAt: string;
  completedAt?: string;
  emailId?: string; // If specific to an email
  result?: any;
}

export interface DailyReport {
  id: string;
  date: string;
  totalEmails: number;
  byCategory: Record<string, number>;
  byUrgency: Record<string, number>;
  spamPrevented: number;
  summaryText: string;
  insights: string[];
}
