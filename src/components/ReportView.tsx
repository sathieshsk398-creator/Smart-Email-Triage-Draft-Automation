import { FileText, ChevronRight, TrendingUp, Award, Activity, AlertCircle, Sparkles, CheckSquare } from 'lucide-react';
import { DailyReport } from '../types.js';
import { useState } from 'react';

interface ReportViewProps {
  reports: DailyReport[];
  onGenerateReport: () => void;
  isGenerating: boolean;
}

export default function ReportView({ reports, onGenerateReport, isGenerating }: ReportViewProps) {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Default to the first report if available
  const activeReport = reports.find((r) => r.id === selectedReportId) || reports[0];

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Report Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-500" id="icon-report" />
          Executive Operations Reports
        </h3>
        {reports.length > 0 && (
          <button
            onClick={onGenerateReport}
            disabled={isGenerating}
            className="text-[10px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded cursor-pointer transition-colors"
            id="btn-report-regen"
          >
            {isGenerating ? 'Compiling...' : 'Compile New Report'}
          </button>
        )}
      </div>

      {reports.length === 0 ? (
        <div className="p-8 text-center flex flex-col items-center justify-center gap-3 h-full min-h-[350px]">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full">
            <TrendingUp className="w-8 h-8" id="icon-report-empty" />
          </div>
          <h4 className="text-sm font-semibold text-slate-700">No Reports Compiled Yet</h4>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            Generate an automated operational report. The background task queue will ingest current emails and synthesize strategic summaries and analytics insights.
          </p>
          <button
            onClick={onGenerateReport}
            disabled={isGenerating}
            className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            id="btn-report-initial-generate"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isGenerating ? 'Generating Report...' : 'Compile Initial Executive Report'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 h-full overflow-hidden">
          {/* Left: Report History List */}
          <div className="p-3 overflow-y-auto max-h-[160px] md:max-h-none col-span-1 bg-slate-50/20">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Compiled Reports</h4>
            <div className="space-y-1">
              {reports.map((report) => {
                const isSelected = activeReport?.id === report.id;
                return (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReportId(report.id)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-600'
                    }`}
                    id={`report-tab-${report.id}`}
                  >
                    <div>
                      <div className="text-xs font-semibold">{report.date}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">
                        {report.totalEmails} total emails · {report.spamPrevented} spam filtered
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Detailed Report Dashboard */}
          <div className="p-4 overflow-y-auto col-span-2 text-left space-y-4">
            {/* Executive Summary Card */}
            <div className="bg-emerald-50/10 border border-emerald-100/30 rounded-xl p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 text-emerald-100">
                <Award className="w-12 h-12" />
              </div>
              <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 fill-emerald-200" />
                Executive Summary
              </div>
              <h3 className="text-xs font-bold text-slate-800 mb-2">Triage Analytics Summary - {activeReport.date}</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {activeReport.summaryText}
              </p>
            </div>

            {/* Metrics Breakdown Bar Graph / Statistics Display */}
            <div className="grid grid-cols-2 gap-4">
              {/* Category distribution */}
              <div className="border border-slate-100 rounded-lg p-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Category Distribution
                </div>
                <div className="space-y-2">
                  {Object.entries(activeReport.byCategory || {}).map(([cat, val]) => {
                    const percentage = Math.round((val / activeReport.totalEmails) * 100) || 0;
                    return (
                      <div key={cat} className="space-y-0.5">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-semibold text-slate-600">{cat}</span>
                          <span className="font-bold text-slate-700">{val} ({percentage}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Urgency breakdown */}
              <div className="border border-slate-100 rounded-lg p-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Urgency Breakdown
                </div>
                <div className="space-y-2">
                  {Object.entries(activeReport.byUrgency || {}).map(([urg, val]) => {
                    const percentage = Math.round((val / activeReport.totalEmails) * 100) || 0;
                    const color = urg === 'High' ? 'bg-rose-500' : urg === 'Medium' ? 'bg-amber-500' : 'bg-slate-400';
                    return (
                      <div key={urg} className="space-y-0.5">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-semibold text-slate-600">{urg}</span>
                          <span className="font-bold text-slate-700">{val} ({percentage}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${color} rounded-full`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* AI Insights Bullets */}
            {activeReport.insights && activeReport.insights.length > 0 && (
              <div className="border-t border-slate-100 pt-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  AI Operational Insights & Friction Points
                </div>
                <div className="space-y-2">
                  {activeReport.insights.map((insight, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg">
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span className="text-xs text-slate-600 leading-relaxed font-medium">
                        {insight}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
