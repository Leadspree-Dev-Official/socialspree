import React, { useState } from 'react';
import { PostLog, Post, Tenant } from '../../types';
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Code, 
  RotateCw, 
  Search, 
  ExternalLink,
  X,
  ChevronRight
} from 'lucide-react';

interface AuditLogsViewProps {
  tenant: Tenant;
  logs: PostLog[];
  posts: Post[];
  onRetryPublish: (log: PostLog) => void;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({
  tenant,
  logs,
  posts,
  onRetryPublish
}) => {
  const [selectedLog, setSelectedLog] = useState<PostLog | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const tenantLogs = logs.filter(l => l.tenantId === tenant.id);
  const filteredLogs = tenantLogs.filter(l => 
    l.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.postId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.apiPostId && l.apiPostId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-['Inter']">
      {/* Top Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#5D3FD3]" />
            <span>Publishing Audit Trail & API Logs</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Complete technical audit log tracking HTTP status codes, raw JSON payloads, and Master API responses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by Log ID or Post ID..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#5D3FD3] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Log ID / Post ID</th>
                <th className="px-4 py-3">Execution Engine</th>
                <th className="px-4 py-3">HTTP Status</th>
                <th className="px-4 py-3">API Post ID</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-900 font-mono">{log.id}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Ref: {log.postId}</div>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase border ${
                      log.executionType === 'instant'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : log.executionType === 'background_cron'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                    }`}>
                      {log.executionType.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                      log.httpStatus === 200 || log.httpStatus === 201
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {log.httpStatus} OK
                    </span>
                  </td>

                  <td className="px-4 py-3.5 font-mono text-slate-600 text-[11px]">
                    {log.apiPostId || 'N/A'}
                  </td>

                  <td className="px-4 py-3.5 font-mono text-slate-500 text-[11px]">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>

                  <td className="px-4 py-3.5 text-right space-x-2">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px] inline-flex items-center gap-1"
                    >
                      <Code className="w-3 h-3 text-[#5D3FD3]" />
                      <span>Inspect Payload</span>
                    </button>

                    <button
                      onClick={() => onRetryPublish(log)}
                      className="px-2.5 py-1 bg-[#5D3FD3]/10 hover:bg-[#5D3FD3]/20 text-[#5D3FD3] rounded font-semibold text-[11px] inline-flex items-center gap-1"
                      title="Re-execute Dispatcher"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw Payload Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Code className="w-5 h-5 text-[#5D3FD3]" />
                  <span>Payload Inspector &mdash; {selectedLog.id}</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">HTTP Status Code: {selectedLog.httpStatus}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <h4 className="font-bold text-slate-700 mb-1 font-mono uppercase tracking-wider text-[11px]">Request Payload</h4>
                <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                  {JSON.stringify(selectedLog.requestPayload, null, 2)}
                </pre>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 mb-1 font-mono uppercase tracking-wider text-[11px]">API Response Payload</h4>
                <pre className="bg-slate-900 text-emerald-400 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                  {JSON.stringify(selectedLog.responsePayload, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-100">
              <span className="text-[11px] text-slate-400 font-mono">Tenant ID: {selectedLog.tenantId}</span>
              <button
                onClick={() => onRetryPublish(selectedLog)}
                className="px-4 py-2 bg-[#5D3FD3] text-white rounded-xl font-bold hover:bg-purple-700 transition-colors flex items-center gap-1.5"
              >
                <RotateCw className="w-4 h-4" />
                <span>Re-Execute Dispatch</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
