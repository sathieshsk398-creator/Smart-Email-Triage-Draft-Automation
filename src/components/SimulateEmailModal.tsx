import { useState, FormEvent } from 'react';
import { X, Sparkles, AlertCircle, RefreshCw, Send, HelpCircle } from 'lucide-react';

interface SimulateEmailModalProps {
  onClose: () => void;
  onInjectEmail: (email: { sender: string; senderEmail: string; subject: string; body: string }) => Promise<void>;
}

export default function SimulateEmailModal({ onClose, onInjectEmail }: SimulateEmailModalProps) {
  const [sender, setSender] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-generate customer query using Gemini
  const handleAutoGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/emails/generate-simulated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.sender && data.body) {
        setSender(data.sender);
        setSenderEmail(data.senderEmail || 'customer@example.com');
        setSubject(data.subject || 'Customer Support Request');
        setBody(data.body);
      }
    } catch (err) {
      console.error('Failed to generate mock email:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyPreset = (type: string) => {
    switch (type) {
      case 'billing_error':
        setSender('Thomas Shelby');
        setSenderEmail('tom@shelbyco.ltd');
        setSubject('Failed premium renewal charge #TX-901');
        setBody('Hi, our automated company payment card was declined for renewal invoice #TX-901. Our account name is ShelbyCo and we need to prevent service interruptions. Could you resubmit the invoice or let us know if there is a backup billing interface? Thank you.');
        break;
      case 'broken_integration':
        setSender('Bruce Wayne');
        setSenderEmail('bruce@wayne-enterprises.co');
        setSubject('SaaS Webhook payloads failing with signature errors');
        setBody('Hello engineering support, since your API gateway update, all of our custom webhook listeners are rejecting your payloads with a SIGNATURE_MISMATCH error code 403. It looks like you changed the HMAC SHA-256 header hashing key without warning. Please send documentation immediately.');
        break;
      case 'corporate_quote':
        setSender('Arthur Pendragon');
        setSenderEmail('arthur@camelot-media.tv');
        setSubject('Enterprise SLA and Volume Licensing Questions');
        setBody('Dear Sales Director,\n\nWe are looking to transition Camelot Media to your team workspace platform. We require a custom SLA guaranteeing 99.99% uptime, data residency controls inside EU boundaries, and advanced SAML SSO logins. We have an initial team size of 180 seats. Could we jump on a call this Thursday at 2 PM GMT to discuss?');
        break;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!sender || !senderEmail || !subject || !body) return;
    setIsSubmitting(true);
    try {
      await onInjectEmail({ sender, senderEmail, subject, body });
      onClose();
    } catch (err) {
      console.error('Failed to inject email:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden relative flex flex-col max-h-[90vh] animate-scale-up">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Send className="w-4 h-4 text-indigo-600" id="icon-simulate-modal" />
            Simulate Incoming Email Thread
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 text-left">
          
          {/* Quick templates */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Preset Sandbox Templates</span>
            <div className="flex gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleApplyPreset('billing_error')}
                className="text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-medium px-2 py-1 rounded cursor-pointer transition-colors"
                id="btn-preset-billing"
              >
                Billing Decline
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('broken_integration')}
                className="text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-medium px-2 py-1 rounded cursor-pointer transition-colors"
                id="btn-preset-broken"
              >
                Integration Outage
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('corporate_quote')}
                className="text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-medium px-2 py-1 rounded cursor-pointer transition-colors"
                id="btn-preset-quote"
              >
                Enterprise RFP
              </button>
              
              <button
                type="button"
                onClick={handleAutoGenerate}
                disabled={isGenerating}
                className="text-[10px] bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer ml-auto transition-colors"
                id="btn-preset-ai"
              >
                {isGenerating ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3 text-indigo-500 fill-indigo-200" />
                )}
                {isGenerating ? 'Writing Email...' : 'AI Generate random email'}
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sender Name</label>
              <input
                type="text"
                required
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="E.g., Thomas Shelby"
                className="w-full text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none p-2 rounded-lg"
                id="input-modal-sender"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sender Email</label>
              <input
                type="email"
                required
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="E.g., tom@shelbyco.ltd"
                className="w-full text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none p-2 rounded-lg"
                id="input-modal-email"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Subject Line</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="E.g., Critical database connection timeouts..."
              className="w-full text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none p-2 rounded-lg"
              id="input-modal-subject"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Body Content</label>
            <textarea
              required
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Paste custom customer ticket context here..."
              className="w-full text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none p-2 rounded-lg font-mono"
              id="textarea-modal-body"
            />
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-500 text-[10px] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
            Injecting this email automatically queues an automated background task. Gemini will run zero-shot text classification, key detail parsing, and reply drafting in real time.
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !sender || !senderEmail || !subject || !body}
            className={`text-xs font-semibold px-4 py-2 text-white rounded-lg flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer ${
              sender && senderEmail && subject && body
                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            id="btn-modal-submit"
          >
            {isSubmitting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            {isSubmitting ? 'Injecting...' : 'Inject Incoming Email'}
          </button>
        </div>
      </div>
    </div>
  );
}
