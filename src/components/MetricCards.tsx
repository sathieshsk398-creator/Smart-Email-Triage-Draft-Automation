import { Mail, AlertTriangle, FileCheck, Award, Layers } from 'lucide-react';
import { Email, QueueTask } from '../types.js';

interface MetricCardsProps {
  emails: Email[];
  queue: QueueTask[];
}

export default function MetricCards({ emails, queue }: MetricCardsProps) {
  const total = emails.length;
  const unprocessed = emails.filter((e) => e.status === 'unprocessed').length;
  const urgent = emails.filter((e) => e.urgency === 'High' && e.status !== 'unprocessed').length;
  const readyReview = emails.filter((e) => e.status === 'processed' && !e.approved).length;
  const approved = emails.filter((e) => e.approved).length;
  const activeTasks = queue.filter((t) => t.status === 'running' || t.status === 'pending').length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {/* Inbox Feed */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3 transition-all hover:shadow-md">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
          <Mail className="w-5 h-5" id="icon-inbox" />
        </div>
        <div>
          <div className="text-xs text-slate-500 font-medium">Unprocessed</div>
          <div className="text-2xl font-semibold text-slate-800 tracking-tight">{unprocessed}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{total} total emails</div>
        </div>
      </div>

      {/* High Urgency */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3 transition-all hover:shadow-md">
        <div className={`p-3 rounded-lg ${urgent > 0 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-slate-50 text-slate-400'}`}>
          <AlertTriangle className="w-5 h-5" id="icon-urgent" />
        </div>
        <div>
          <div className="text-xs text-slate-500 font-medium">Urgent Claims</div>
          <div className={`text-2xl font-semibold tracking-tight ${urgent > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{urgent}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Require action</div>
        </div>
      </div>

      {/* Ready for Review */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3 transition-all hover:shadow-md">
        <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
          <Layers className="w-5 h-5" id="icon-review" />
        </div>
        <div>
          <div className="text-xs text-slate-500 font-medium">Drafts Pending</div>
          <div className="text-2xl font-semibold text-amber-600 tracking-tight">{readyReview}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Ready for review</div>
        </div>
      </div>

      {/* Approved Responses */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3 transition-all hover:shadow-md">
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
          <FileCheck className="w-5 h-5" id="icon-approved" />
        </div>
        <div>
          <div className="text-xs text-slate-500 font-medium">Approved</div>
          <div className="text-2xl font-semibold text-emerald-600 tracking-tight">{approved}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Ready to send</div>
        </div>
      </div>

      {/* Running Queue Tasks */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3 transition-all hover:shadow-md col-span-2 md:col-span-1">
        <div className={`p-3 rounded-lg ${activeTasks > 0 ? 'bg-violet-50 text-violet-600' : 'bg-slate-50 text-slate-400'}`}>
          <Award className={`w-5 h-5 ${activeTasks > 0 ? 'animate-spin' : ''}`} id="icon-queue-active" />
        </div>
        <div>
          <div className="text-xs text-slate-500 font-medium">Queue Status</div>
          <div className="text-base font-semibold text-slate-800 truncate">
            {activeTasks > 0 ? `${activeTasks} processing` : 'Queue Idle'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">WebSocket live tracking</div>
        </div>
      </div>
    </div>
  );
}
