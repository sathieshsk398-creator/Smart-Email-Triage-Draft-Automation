import { useState, useEffect, useRef } from 'react';
import { Mail, Zap, RefreshCw, Sparkles, FileText, PlusCircle, Activity, Server, AlertCircle, Trash2 } from 'lucide-react';
import { Email, QueueTask, DailyReport } from './types.js';
import MetricCards from './components/MetricCards.tsx';
import TaskQueueTracker from './components/TaskQueueTracker.tsx';
import EmailList from './components/EmailList.tsx';
import EmailWorkspace from './components/EmailWorkspace.tsx';
import ReportView from './components/ReportView.tsx';
import SimulateEmailModal from './components/SimulateEmailModal.tsx';

export default function App() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [queue, setQueue] = useState<QueueTask[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'workspace' | 'reports'>('workspace');
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [isGeminiConfigured, setIsGeminiConfigured] = useState(false);
  const [isCompilingReport, setIsCompilingReport] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);

  // Establish WebSocket connection for real-time live status updates
  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}`;
    
    console.log('Connecting WebSocket to:', wsUrl);
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket successfully connected to server');
      setWsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WS Message received:', data.type);

        switch (data.type) {
          case 'INITIAL_STATE':
            setEmails(data.emails || []);
            setQueue(data.queue || []);
            setReports(data.reports || []);
            if (data.isGeminiConfigured !== undefined) {
              setIsGeminiConfigured(data.isGeminiConfigured);
            }
            break;
          case 'TASK_CREATED':
            setQueue((prev) => [data.task, ...prev]);
            break;
          case 'TASK_UPDATED':
            setQueue((prev) =>
              prev.map((t) => (t.id === data.task.id ? data.task : t))
            );
            if (data.task.type === 'generate_report' && data.task.status === 'completed') {
              setIsCompilingReport(false);
            }
            break;
          case 'EMAIL_UPDATED':
            setEmails((prev) =>
              prev.map((e) => (e.id === data.email.id ? data.email : e))
            );
            break;
          case 'REPORT_CREATED':
            setReports((prev) => [data.report, ...prev]);
            setIsCompilingReport(false);
            break;
        }
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    socket.onclose = () => {
      console.warn('WebSocket connection closed. Retrying in 3s...');
      setWsConnected(false);
      setTimeout(() => {
        if (socketRef.current === socket) {
          setWsConnected(false);
        }
      }, 3000);
    };

    return () => {
      socket.close();
    };
  }, []);

  // 🚀 Custom Function: Backend-க்கு Real Email அனுப்பச் சொல்லும் API call
  const sendRealEmailAlert = async (emailData: { sender: string; subject: string; body: string }) => {
    try {
      await fetch('http://localhost:5000/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'sathieshsk398-creator@gmail.com', // இங்க உங்க நிஜமான ஜிமெயில் ஐடி குடுத்திருக்கேன் boss!
          subject: `🚨 New Smart Triage Alert: ${emailData.subject}`,
          text: `Hi Sathiesh,\n\nYour app received a new simulated email from ${emailData.sender}.\n\nContent:\n"${emailData.body}"\n\n- Smart Email Triage Automation Suite`
        }),
      });
      console.log('Real email notification dispatched to backend.');
    } catch (err) {
      console.error('Backend server not running or failed to send real email alert:', err);
    }
  };

  // API Call: Inject incoming custom customer email
  const handleInjectEmail = async (newEmail: { sender: string; senderEmail: string; subject: string; body: string }) => {
    try {
      const res = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmail),
      });
      const data = await res.json();
      if (data.email) {
        setSelectedEmailId(data.email.id);
        setActiveTab('workspace');
        
        // 🔥 இங்க ரியல் மெயில் அலர்ட் ஃபங்க்ஷனை ட்ரிக்கர் பண்றோம்!
        await sendRealEmailAlert(newEmail);
      }
    } catch (err) {
      console.error('Error injecting email:', err);
    }
  };

  // API Call: Approve Draft Response
  const handleApproveDraft = async (
    id: string,
    updatedDraft: string,
    category: Email['category'],
    urgency: Email['urgency']
  ) => {
    try {
      await fetch(`/api/emails/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftReply: updatedDraft, category, urgency }),
      });
    } catch (err) {
      console.error('Error approving draft:', err);
    }
  };

  // API Call: Trigger single triage task
  const handleTriggerTriage = async (id: string) => {
    try {
      await fetch(`/api/emails/${id}/triage`, {
        method: 'POST',
      });
    } catch (err) {
      console.error('Error triggering triage:', err);
    }
  };

  // API Call: Trigger batch triage
  const handleTriggerBatchTriage = async () => {
    try {
      await fetch('/api/queue/batch-triage', {
        method: 'POST',
      });
    } catch (err) {
      console.error('Error triggering batch triage:', err);
    }
  };

  // API Call: Trigger report generation
  const handleTriggerGenerateReport = async () => {
    setIsCompilingReport(true);
    setActiveTab('reports');
    try {
      await fetch('/api/queue/generate-report', {
        method: 'POST',
      });
    } catch (err) {
      console.error('Error generating report:', err);
      setIsCompilingReport(false);
    }
  };

  // API Call: Reset database state
  const handleResetSandbox = async () => {
    if (window.confirm('Are you sure you want to completely reset the sandbox environment to initial unprocessed state? All custom injected records will be cleared.')) {
      try {
        await fetch('/api/reset', {
          method: 'POST',
        });
        setSelectedEmailId(null);
        setActiveTab('workspace');
      } catch (err) {
        console.error('Error resetting sandbox:', err);
      }
    }
  };

  const selectedEmail = emails.find((e) => e.id === selectedEmailId) || null;
  const unprocessedCount = emails.filter((e) => e.status === 'unprocessed').length;

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-800 antialiased selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Visual Navigation Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm/5">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-sm shadow-indigo-100">
              <Mail className="w-5 h-5 fill-indigo-100/10" id="icon-main-logo" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                Smart Email Triage
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100/30">
                  Automation Suite
                </span>
              </h1>
              <p className="text-[10px] text-slate-400">Gemini AI Text Classification & Background Task Queue</p>
            </div>
          </div>

          {/* Operational Status Panel */}
          <div className="flex items-center gap-4">
            {/* API Status */}
            <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 text-xs">
              <span className="text-[10px] font-semibold text-slate-400">LLM Mode:</span>
              <span className={`inline-flex items-center gap-1 font-semibold ${
                isGeminiConfigured ? 'text-indigo-600' : 'text-slate-500'
              }`}>
                {isGeminiConfigured ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 fill-indigo-200 text-indigo-600 animate-pulse" />
                    Gemini Active
                  </>
                ) : (
                  <>
                    <Server className="w-3.5 h-3.5 text-slate-400" />
                    Offline Sandbox
                  </>
                )}
              </span>
            </div>

            {/* WebSocket Pulse */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 text-xs">
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-[10px] text-slate-500 font-medium">
                {wsConnected ? 'WS Live' : 'Connecting'}
              </span>
            </div>

            {/* Simulate Inbox triggers */}
            <button
              onClick={() => setShowSimulateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
              id="btn-simulate-inbound"
            >
              <PlusCircle className="w-4 h-4" />
              Simulate Email
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
        
        {/* Dynamic Metric Statistics cards */}
        <MetricCards emails={emails} queue={queue} />

        {/* View Switch / Workspace Tabs */}
        <div className="flex gap-4 items-center justify-between border-b border-slate-200/60 pb-1">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('workspace')}
              className={`text-xs font-semibold px-4 py-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'workspace'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
              id="tab-inbox"
            >
              Triage Workspace
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`text-xs font-semibold px-4 py-2 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'reports'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
              id="tab-reports"
            >
              <FileText className="w-3.5 h-3.5" />
              Compiled Reports
              {reports.length > 0 && (
                <span className="bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 text-[9px] rounded-full">
                  {reports.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Workspace Panes */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
          
          {/* Left Panel: Task queue (live monitor widget) */}
          <div className="lg:col-span-3 h-full">
            <TaskQueueTracker
              queue={queue}
              onTriggerBatchTriage={handleTriggerBatchTriage}
              onTriggerGenerateReport={handleTriggerGenerateReport}
              onResetSandbox={handleResetSandbox}
              unprocessedCount={unprocessedCount}
            />
          </div>

          {/* Core App View tabs */}
          {activeTab === 'workspace' ? (
            <>
              {/* Middle Panel: Interactive email feed stream */}
              <div className="lg:col-span-4 h-full">
                <EmailList
                  emails={emails}
                  selectedEmailId={selectedEmailId}
                  onSelectEmail={setSelectedEmailId}
                />
              </div>

              {/* Right Panel: Detail workspace and AI refinement editor */}
              <div className="lg:col-span-5 h-full">
                <EmailWorkspace
                  email={selectedEmail}
                  onApprove={handleApproveDraft}
                  onTriggerTriage={handleTriggerTriage}
                />
              </div>
            </>
          ) : (
            /* Alternate tab view: Daily analytical executive reports */
            <div className="lg:col-span-9 h-full">
              <ReportView
                reports={reports}
                onGenerateReport={handleTriggerGenerateReport}
                isGenerating={isCompilingReport}
              />
            </div>
          )}
        </div>
      </main>

      {/* Popups & Dialogs */}
      {showSimulateModal && (
        <SimulateEmailModal
          onClose={() => setShowSimulateModal(false)}
          onInjectEmail={handleInjectEmail}
        />
      )}
    </div>
  );
}