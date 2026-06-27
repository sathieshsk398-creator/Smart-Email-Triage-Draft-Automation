import { useState, useEffect } from 'react';
import { Mail, ArrowRight, CheckCircle, Copy, Sparkles, RefreshCw, AlertCircle, Calendar, Send, FileText, ChevronRight, X } from 'lucide-react';
import { Email } from '../types.js';

interface EmailWorkspaceProps {
  email: Email | null;
  onApprove: (id: string, updatedDraft: string, category: Email['category'], urgency: Email['urgency']) => Promise<void>;
  onTriggerTriage: (id: string) => Promise<void>;
}

export default function EmailWorkspace({ email, onApprove, onTriggerTriage }: EmailWorkspaceProps) {
  const [draftText, setDraftText] = useState('');
  const [refineInput, setRefineInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [editCategory, setEditCategory] = useState<Email['category']>('Unknown');
  const [editUrgency, setEditUrgency] = useState<Email['urgency']>('Low');

  // Synchronize draft text and parameters when the selected email changes
  useEffect(() => {
    if (email) {
      setDraftText(email.draftReply || '');
      setEditCategory(email.category);
      setEditUrgency(email.urgency);
      setRefineInput('');
      setSendSuccess(false);
      setShowSendModal(false);
    }
  }, [email]);

  if (!email) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center p-8 text-center h-full min-h-[450px]">
        <div className="p-4 bg-slate-50 text-slate-400 rounded-full mb-4">
          <Mail className="w-8 h-8" id="icon-workspace-empty" />
        </div>
        <h3 className="text-sm font-semibold text-slate-700">No Email Selected</h3>
        <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
          Select an incoming customer communication from the inbox feed to view AI-extracted properties, summary analytics, and draft context-aware answers.
        </p>
      </div>
    );
  }

  // Handle refinement API call
  const handleRefine = async () => {
    if (!refineInput.trim()) return;
    setIsRefining(true);
    try {
      const res = await fetch(`/api/emails/${email.id}/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction: refineInput, currentDraft: draftText })
      });
      const data = await res.json();
      if (data.success) {
        setDraftText(data.draftReply);
        setRefineInput('');
      }
    } catch (err) {
      console.error('Refinement failed:', err);
    } finally {
      setIsRefining(false);
    }
  };

  // Handle copy reply to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draftText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // Simulate final send of email
  const handleSendResponse = async () => {
    setIsSending(true);
    // Simulate API network latencies
    await new Promise((res) => setTimeout(res, 1200));
    setIsSending(false);
    setSendSuccess(true);
    // Automatically approve after successful mock send
    await onApprove(email.id, draftText, editCategory, editUrgency);
    setTimeout(() => {
      setShowSendModal(false);
      setSendSuccess(false);
    }, 2000);
  };

  // Triage state renderers
  if (email.status === 'unprocessed') {
    return (
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8 text-center flex flex-col items-center justify-center h-full min-h-[450px]">
        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full mb-4">
          <Sparkles className="w-8 h-8 animate-pulse" id="icon-workspace-new" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">Unprocessed Customer Thread</h3>
        <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
          This thread has not been categorized. Trigger the manual triage pipeline below or run the background batch triage queue.
        </p>
        <button
          onClick={() => onTriggerTriage(email.id)}
          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
          id="btn-workspace-triage"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Triage Email with Gemini
        </button>
      </div>
    );
  }

  if (email.status === 'triaging') {
    return (
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8 text-center flex flex-col items-center justify-center h-full min-h-[450px]">
        <div className="p-4 bg-violet-50 text-violet-600 rounded-full mb-4 animate-spin">
          <RefreshCw className="w-8 h-8" id="icon-workspace-triaging" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">Triage Pipeline Running</h3>
        <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
          Gemini AI is currently evaluating the customer message structure, analyzing sentiment metrics, and synthesizing a contextual draft response.
        </p>
        <div className="w-48 bg-slate-100 h-1 rounded-full mt-4 overflow-hidden relative">
          <div className="absolute top-0 left-0 bg-violet-600 h-full w-1/2 animate-infinite-loading rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden relative">
      {/* Workspace Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-500" id="icon-workspace" />
          Triage Analysis & Editor
        </h3>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          email.approved ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
        }`}>
          {email.approved ? 'Approved & Closed' : 'Reviewing Draft'}
        </span>
      </div>

      {/* Main workspace layout scroll */}
      <div className="p-4 flex-1 overflow-y-auto space-y-5">
        
        {/* original email segment (expander card) */}
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-left">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
            <span className="font-medium text-slate-600">Original Ticket Content</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(email.date).toLocaleString()}</span>
          </div>
          <div className="space-y-1 mb-2">
            <h4 className="text-xs font-bold text-slate-800">{email.subject}</h4>
            <div className="text-[10px] text-slate-500">
              From: <span className="font-medium text-slate-700">{email.sender}</span> ({email.senderEmail})
            </div>
          </div>
          <p className="text-[11px] text-slate-600 whitespace-pre-line leading-relaxed border-t border-slate-200/50 pt-2 bg-white/60 p-2 rounded">
            {email.body}
          </p>
        </div>

        {/* AI extraction panel */}
        <div className="border border-indigo-50 rounded-lg p-4 bg-indigo-50/10 text-left space-y-3.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-800">
            <Sparkles className="w-3.5 h-3.5 fill-indigo-200" />
            Gemini Classification & Extractions
          </div>

          {/* Classification attributes */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Category Class</div>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value as Email['category'])}
                className="text-xs font-medium text-slate-700 border border-slate-200 rounded px-1.5 py-0.5 bg-white w-full mt-0.5"
                id="select-workspace-cat"
              >
                <option value="Support Claim">Support Claim</option>
                <option value="Billing">Billing</option>
                <option value="Sales Inquiry">Sales Inquiry</option>
                <option value="Feedback">Feedback</option>
                <option value="Spam">Spam</option>
              </select>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 font-medium">Urgency</div>
              <select
                value={editUrgency}
                onChange={(e) => setEditUrgency(e.target.value as Email['urgency'])}
                className="text-xs font-medium text-slate-700 border border-slate-200 rounded px-1.5 py-0.5 bg-white w-full mt-0.5"
                id="select-workspace-urg"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 font-medium">Detected Sentiment</div>
              <div className="text-xs font-semibold text-indigo-700 mt-1 capitalize">
                {email.sentiment || 'Neutral'}
              </div>
            </div>
          </div>

          {/* Bullet summary */}
          {email.summary && (
            <div className="border-t border-indigo-100/50 pt-2">
              <div className="text-[10px] text-slate-400 font-medium">Auto Summary</div>
              <p className="text-[11px] text-slate-700 leading-normal font-medium mt-0.5">
                {email.summary}
              </p>
            </div>
          )}

          {/* Key details table */}
          {Object.keys(email.keyDetails || {}).length > 0 && (
            <div className="border-t border-indigo-100/50 pt-2.5">
              <div className="text-[10px] text-slate-400 font-medium mb-1">Extracted Key Details</div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(email.keyDetails).map(([key, val]) => (
                  <div key={key} className="bg-white border border-indigo-100/40 p-1.5 rounded flex items-center justify-between gap-1">
                    <span className="text-[9px] font-semibold text-slate-400 uppercase truncate">{key}</span>
                    <span className="text-[10px] font-mono font-bold text-indigo-800 truncate">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tailored response editor container */}
        <div className="text-left space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              Draft Response Reply
            </label>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopy}
                className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded transition-colors flex items-center gap-1 text-[10px] cursor-pointer"
                title="Copy to Clipboard"
                id="btn-workspace-copy"
              >
                <Copy className="w-3.5 h-3.5" />
                {isCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            className="w-full h-44 text-xs font-mono p-3 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-lg bg-slate-50/50 leading-relaxed shadow-inner"
            placeholder="Draft content..."
            id="textarea-draft-editor"
          />

          {/* Interactive instruction box */}
          <div className="flex gap-2 items-center bg-indigo-50/20 border border-indigo-100/40 p-2 rounded-lg">
            <input
              type="text"
              value={refineInput}
              onChange={(e) => setRefineInput(e.target.value)}
              placeholder="Suggest revision (e.g. 'add a refund link', 'sound more friendly')"
              className="flex-1 bg-white text-xs border border-slate-200 focus:outline-none focus:border-indigo-400 px-2.5 py-1.5 rounded-md"
              disabled={isRefining}
              onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
              id="input-workspace-refine"
            />
            <button
              onClick={handleRefine}
              disabled={isRefining || !refineInput.trim()}
              className={`text-xs px-3 py-1.5 font-medium rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
                refineInput.trim()
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
              id="btn-workspace-refine"
            >
              {isRefining ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              Refine
            </button>
          </div>
        </div>
      </div>

      {/* Workspace Footer Actions */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/30 grid grid-cols-2 gap-3 shrink-0">
        <button
          onClick={() => onApprove(email.id, draftText, editCategory, editUrgency)}
          className="text-xs py-2 px-4 rounded-lg font-medium border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          id="btn-workspace-approve-only"
        >
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          Approve Draft
        </button>
        <button
          onClick={() => setShowSendModal(true)}
          className="text-xs py-2 px-4 rounded-lg font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-100 transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
          id="btn-workspace-send"
        >
          <Send className="w-3.5 h-3.5" />
          Send & Archive
        </button>
      </div>

      {/* Send Confirmation Modal (User-owned Mutation Mandate!) */}
      {showSendModal && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden relative animate-scale-up">
            <button
              onClick={() => setShowSendModal(false)}
              className="absolute top-3 right-3 p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-5 text-left space-y-4">
              <div className="flex items-center gap-2.5 text-slate-800 font-bold text-sm border-b border-slate-100 pb-2.5">
                <Send className="w-4 h-4 text-indigo-600" />
                Confirm Email Despatch
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-500 leading-relaxed">
                  You are about to send a tailored draft response to <span className="font-semibold text-slate-700">{email.sender}</span> ({email.senderEmail}). This will commit changes and finalize the customer's support ticket.
                </p>

                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-[11px] space-y-1">
                  <div><span className="text-slate-400">Recipient:</span> <span className="font-semibold text-slate-700">{email.senderEmail}</span></div>
                  <div><span className="text-slate-400">Subject:</span> <span className="font-semibold text-slate-700">Re: {email.subject}</span></div>
                  <div className="border-t border-slate-200/50 mt-2 pt-2 text-slate-500 italic max-h-24 overflow-y-auto font-mono">
                    {draftText}
                  </div>
                </div>
              </div>

              {/* Action grid */}
              <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
                <button
                  onClick={() => setShowSendModal(false)}
                  className="text-xs font-semibold px-3 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
                  disabled={isSending || sendSuccess}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendResponse}
                  className="text-xs font-semibold px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
                  disabled={isSending || sendSuccess}
                  id="btn-modal-confirm-send"
                >
                  {isSending && <RefreshCw className="w-3 h-3 animate-spin" />}
                  {sendSuccess && <CheckCircle className="w-3 h-3" />}
                  {!isSending && !sendSuccess && <Send className="w-3 h-3" />}
                  {isSending ? 'Sending...' : sendSuccess ? 'Sent successfully!' : 'Confirm Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
