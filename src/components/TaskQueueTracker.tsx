import { motion, AnimatePresence } from 'motion/react';
import { Loader2, CheckCircle, XCircle, Clock, Zap, HelpCircle } from 'lucide-react';
import { QueueTask } from '../types.js';

interface TaskQueueTrackerProps {
  queue: QueueTask[];
  onTriggerBatchTriage: () => void;
  onTriggerGenerateReport: () => void;
  onResetSandbox: () => void;
  unprocessedCount: number;
}

export default function TaskQueueTracker({
  queue,
  onTriggerBatchTriage,
  onTriggerGenerateReport,
  onResetSandbox,
  unprocessedCount
}: TaskQueueTrackerProps) {
  const activeTasks = queue.filter((t) => t.status === 'running' || t.status === 'pending');
  const completedTasks = queue.filter((t) => t.status === 'completed' || t.status === 'failed');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
      {/* Queue Controller Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-500 fill-violet-200" id="icon-task-queue" />
            Background Task Queue
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-100">
            WebSocket Live
          </span>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onTriggerBatchTriage}
            disabled={unprocessedCount === 0}
            className={`text-xs py-2 px-3 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all ${
              unprocessedCount > 0
                ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-100 active:scale-95 cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
            id="btn-batch-triage"
          >
            <Loader2 className={`w-3.5 h-3.5 ${activeTasks.length > 0 ? 'animate-spin' : ''}`} />
            Triage Batch ({unprocessedCount})
          </button>
          
          <button
            onClick={onTriggerGenerateReport}
            className="text-xs py-2 px-3 rounded-lg font-medium bg-slate-800 hover:bg-slate-900 text-white shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            id="btn-gen-report"
          >
            <Zap className="w-3.5 h-3.5" />
            Generate Report
          </button>
        </div>

        <button
          onClick={onResetSandbox}
          className="text-[11px] py-1 text-slate-500 hover:text-rose-600 transition-colors flex items-center justify-center gap-1 border border-dashed border-slate-200 hover:border-rose-200 rounded-md cursor-pointer"
          id="btn-reset-sandbox"
        >
          Reset Sandbox Dataset
        </button>
      </div>

      {/* Task Queue Content */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4 max-h-[380px] md:max-h-none">
        {/* Active Tasks Section */}
        <div>
          <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Active Tasks ({activeTasks.length})
          </h4>
          
          {activeTasks.length === 0 ? (
            <div className="text-xs text-slate-400 bg-slate-50/50 rounded-lg p-6 text-center border border-dashed border-slate-100">
              No tasks currently executing in the background. Incoming sandbox triggers automatically queue.
            </div>
          ) : (
            <div className="space-y-2.5">
              <AnimatePresence initial={false}>
                {activeTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layoutId={`task-${task.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        {task.status === 'running' ? (
                          <Loader2 className="w-3.5 h-3.5 text-violet-600 animate-spin" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        <span className="text-xs font-semibold text-slate-700 capitalize">
                          {task.type.replace('_', ' ')}
                        </span>
                      </div>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                        task.status === 'running' ? 'bg-violet-50 text-violet-600 border border-violet-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {task.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mb-2 leading-tight">
                      {task.message}
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-violet-600 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${task.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[9px] text-slate-400">
                        Created: {new Date(task.createdAt).toLocaleTimeString()}
                      </span>
                      <span className="text-[9px] font-semibold text-violet-600">
                        {task.progress}%
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Historical Completed Tasks */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Completed Logs ({completedTasks.length})
            </h4>
          </div>

          {completedTasks.length === 0 ? (
            <div className="text-[11px] text-slate-400 text-center py-4">
              Completed actions will appear here.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
              {completedTasks.slice(0, 10).map((task) => (
                <div
                  key={task.id}
                  className="p-2 border border-slate-100 hover:bg-slate-50/50 rounded-lg flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-medium text-slate-700 capitalize truncate">
                        {task.type.replace('_', ' ')}
                      </span>
                      {task.status === 'completed' ? (
                        <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-3 h-3 text-rose-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 truncate leading-normal">
                      {task.message}
                    </p>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 shrink-0">
                    {task.completedAt ? new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
