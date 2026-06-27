import { Wrench, CreditCard, Target, MessageSquare, AlertOctagon, HelpCircle, AlertCircle, CheckCircle, RefreshCw, Mail } from 'lucide-react';
import { Email } from '../types.js';
import { useState } from 'react';

interface EmailListProps {
  emails: Email[];
  selectedEmailId: string | null;
  onSelectEmail: (id: string) => void;
}

export default function EmailList({ emails, selectedEmailId, onSelectEmail }: EmailListProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('All');

  // Filter Emails
  const filteredEmails = emails.filter((email) => {
    const matchCategory = categoryFilter === 'All' || email.category === categoryFilter;
    const matchUrgency = urgencyFilter === 'All' || email.urgency === urgencyFilter;
    return matchCategory && matchUrgency;
  });

  const getCategoryMeta = (category: Email['category']) => {
    switch (category) {
      case 'Support Claim':
        return { icon: Wrench, bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-100', label: 'Support Claim' };
      case 'Billing':
        return { icon: CreditCard, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: 'Billing' };
      case 'Sales Inquiry':
        return { icon: Target, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', label: 'Sales Inquiry' };
      case 'Feedback':
        return { icon: MessageSquare, bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-100', label: 'Feedback' };
      case 'Spam':
        return { icon: AlertOctagon, bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', label: 'Spam' };
      default:
        return { icon: HelpCircle, bg: 'bg-slate-50', text: 'text-slate-400', border: 'border-slate-100', label: 'Pending Triage' };
    }
  };

  const getUrgencyBadge = (urgency: Email['urgency']) => {
    switch (urgency) {
      case 'High':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Low':
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const categories = ['All', 'Support Claim', 'Billing', 'Sales Inquiry', 'Feedback', 'Spam'];
  const urgencies = ['All', 'High', 'Medium', 'Low'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
      {/* Search & Filter bar */}
      <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/20">
        <div>
          <h3 className="text-sm font-semibold text-slate-800" id="header-inbox-stream">Inbox Stream ({filteredEmails.length})</h3>
          <p className="text-[11px] text-slate-400">Review triage categories and key analytical properties.</p>
        </div>

        {/* Filters Grid */}
        <div className="flex flex-col gap-2">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`text-[10px] font-medium px-2 py-1 rounded-full border transition-all cursor-pointer whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                }`}
                id={`filter-cat-${cat.replace(' ', '-')}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Urgency Filters */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-medium">Urgency:</span>
            <div className="flex gap-1.5">
              {urgencies.map((urg) => (
                <button
                  key={urg}
                  onClick={() => setUrgencyFilter(urg)}
                  className={`text-[10px] px-2 py-0.5 rounded border font-medium cursor-pointer transition-all ${
                    urgencyFilter === urg
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold'
                      : 'bg-white hover:bg-slate-50 text-slate-500 border-slate-200'
                  }`}
                  id={`filter-urg-${urg}`}
                >
                  {urg}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Email List Column */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 min-h-[300px] md:min-h-0">
        {filteredEmails.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2 h-full">
            <Mail className="w-8 h-8 text-slate-200" />
            <p>No emails match current filter criteria.</p>
          </div>
        ) : (
          filteredEmails.map((email) => {
            const isSelected = selectedEmailId === email.id;
            const meta = getCategoryMeta(email.category);
            const CatIcon = meta.icon;

            return (
              <div
                key={email.id}
                onClick={() => onSelectEmail(email.id)}
                className={`p-4 text-left transition-all cursor-pointer flex flex-col gap-2 relative ${
                  isSelected
                    ? 'bg-indigo-50/50 border-l-4 border-l-indigo-600'
                    : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                }`}
                id={`email-card-${email.id}`}
              >
                {/* Email Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-slate-700 truncate block">
                      {email.sender}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 truncate block">
                      {email.senderEmail}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(email.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Email Subject */}
                <h4 className={`text-xs font-semibold truncate ${
                  email.status === 'unprocessed' ? 'text-slate-900 font-bold' : 'text-slate-700'
                }`}>
                  {email.subject}
                </h4>

                {/* Body Snippet */}
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {email.body}
                </p>

                {/* Badges and Triage Indicator */}
                <div className="flex items-center justify-between gap-2 pt-1 mt-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Category Label */}
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${meta.bg} ${meta.text} ${meta.border}`}>
                      <CatIcon className="w-3 h-3" />
                      {meta.label}
                    </span>

                    {/* Urgency Label */}
                    {email.status !== 'unprocessed' && (
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${getUrgencyBadge(email.urgency)}`}>
                        {email.urgency}
                      </span>
                    )}
                  </div>

                  {/* Operational Status */}
                  <div className="shrink-0">
                    {email.status === 'unprocessed' && (
                      <span className="flex items-center gap-1 text-[9px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                        <AlertCircle className="w-2.5 h-2.5" />
                        New
                      </span>
                    )}
                    {email.status === 'triaging' && (
                      <span className="flex items-center gap-1 text-[9px] font-semibold text-violet-600 bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded animate-pulse">
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        Triaging
                      </span>
                    )}
                    {email.status === 'processed' && !email.approved && (
                      <span className="flex items-center gap-1 text-[9px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">
                        <CheckCircle className="w-2.5 h-2.5" />
                        Draft Ready
                      </span>
                    )}
                    {email.approved && (
                      <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded shadow-sm">
                        <CheckCircle className="w-2.5 h-2.5 fill-emerald-100" />
                        Approved
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
