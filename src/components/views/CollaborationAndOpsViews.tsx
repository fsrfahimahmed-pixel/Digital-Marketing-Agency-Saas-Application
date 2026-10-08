import React, { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Lock,
  MessageSquare,
  Pause,
  Play,
  Plus,
  Search,
  Send,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react';
import { useAgency } from '../../context/AgencyContext';
import { PermissionService } from '../../services/agencyServices';
import {
  AvatarCircle,
  ConfirmModal,
  EmptyState,
  KpiCard,
  PageHeader,
  PriorityText,
} from '../ui/Primitives';
import { FileCategory } from '../../types/domain';

// ============================================================================
// 1. MESSAGES & COLLABORATION VIEW (Section 30)
// ============================================================================
export const MessagesView: React.FC = () => {
  const { currentUser, snapshot, sendMessage } = useAgency();

  const visibleProjects = currentUser
    ? PermissionService.getVisibleProjects(currentUser, snapshot.projects)
    : [];

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    visibleProjects[0]?.id || 'prj_001'
  );
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'Client-visible' | 'Internal'>('ALL');
  const [searchText, setSearchText] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [replyVisibility, setReplyVisibility] = useState<'Client-visible' | 'Internal'>(
    'Client-visible'
  );

  if (!currentUser) return null;
  const isClient = currentUser.role === 'CLIENT';

  const messages = snapshot.messages.filter((m) => {
    if (isClient) {
      if (m.client_id !== currentUser.client_id || m.visibility !== 'Client-visible') {
        return false;
      }
    }
    if (selectedProjectId !== 'ALL' && m.project_id !== selectedProjectId) return false;
    if (!isClient && channelFilter !== 'ALL' && m.visibility !== channelFilter) return false;
    if (searchText.trim() && !m.content.toLowerCase().includes(searchText.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    const targetPrj =
      selectedProjectId === 'ALL' ? visibleProjects[0]?.id || 'prj_001' : selectedProjectId;
    sendMessage(
      targetPrj,
      replyContent,
      isClient ? 'Client-visible' : replyVisibility
    );
    setReplyContent('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isClient ? 'Agency Communication Thread' : 'Messages & Collaboration Hub'}
        subtitle={
          isClient
            ? 'Direct communication with your Account Manager and delivery team.'
            : 'Coordinate across Client Threads and Internal-Only specialist notes.'
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Project Thread Selector */}
        <div className="lg:col-span-4 p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search messages..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
            />
          </div>

          {!isClient && (
            <div className="flex items-center gap-1">
              {(['ALL', 'Client-visible', 'Internal'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setChannelFilter(f)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium ${
                    channelFilter === f
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {f === 'ALL' ? 'All' : f}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-1.5 pt-1">
            <button
              onClick={() => setSelectedProjectId('ALL')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                selectedProjectId === 'ALL'
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              All Project Channels ({visibleProjects.length})
            </button>
            {visibleProjects.map((prj) => (
              <button
                key={prj.id}
                onClick={() => setSelectedProjectId(prj.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors ${
                  selectedProjectId === prj.id
                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 font-semibold'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="font-mono text-[11px] text-slate-400">{prj.code}</div>
                <div className="truncate">{prj.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Conversation Canvas */}
        <div className="lg:col-span-8 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 flex flex-col min-h-[520px]">
          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            {messages.length === 0 ? (
              <EmptyState
                title="No messages in this channel"
                description="Start a conversation below to collaborate with the project team."
              />
            ) : (
              messages.map((msg) => {
                const sender = snapshot.users.find((u) => u.id === msg.sender_id);
                const prj = snapshot.projects.find((p) => p.id === msg.project_id);
                const isInternal = msg.visibility === 'Internal';

                return (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-xl border space-y-2 text-xs ${
                      isInternal
                        ? 'bg-amber-500/5 border-amber-500/30'
                        : 'bg-slate-50/70 dark:bg-slate-950/70 border-slate-200/80 dark:border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {sender && (
                          <AvatarCircle
                            initials={sender.avatarInitials}
                            colorClass={sender.avatarColor}
                            size="xs"
                          />
                        )}
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {sender?.name}
                        </span>
                        <span className="text-slate-400">· {sender?.title}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                        {isInternal && (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-sans font-semibold">
                            <Lock className="w-3 h-3" /> Internal Note
                          </span>
                        )}
                        <span>{msg.created_at}</span>
                      </div>
                    </div>
                    <p className="text-slate-700 dark:text-slate-200 leading-relaxed text-sm">
                      {msg.content}
                    </p>
                    <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">
                      {prj?.code} · {prj?.name}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form
            onSubmit={handleSend}
            className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-2.5"
          >
            {!isClient && (
              <select
                value={replyVisibility}
                onChange={(e) =>
                  setReplyVisibility(e.target.value as 'Client-visible' | 'Internal')
                }
                className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-medium"
              >
                <option value="Client-visible">Client-Visible Message</option>
                <option value="Internal">Internal Team Only</option>
              </select>
            )}
            <input
              type="text"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a message or @mention team member..."
              className="flex-1 w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. FILE MANAGEMENT VIEW (Section 31)
// ============================================================================
export const FilesView: React.FC = () => {
  const {
    currentUser,
    snapshot,
    uploadFile,
    toggleFileVisibility,
    deleteFile,
    addToast,
  } = useAgency();

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState<FileCategory>('Deliverables');
  const [uploadProjectId, setUploadProjectId] = useState(
    snapshot.projects[0]?.id || 'prj_001'
  );
  const [uploadVis, setUploadVis] = useState<'Client-visible' | 'Internal'>(
    'Client-visible'
  );
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);

  if (!currentUser) return null;
  const isClient = currentUser.role === 'CLIENT';

  const visibleFiles = snapshot.files.filter((f) => {
    if (isClient) {
      if (f.client_id !== currentUser.client_id || f.visibility !== 'Client-visible') {
        return false;
      }
    }
    if (categoryFilter !== 'ALL' && f.category !== categoryFilter) return false;
    return true;
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName.trim()) return;
    uploadFile(uploadProjectId, uploadName.trim(), uploadCategory, uploadVis);
    setUploadName('');
  };

  const previewFile = snapshot.files.find((f) => f.id === previewFileId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={isClient ? 'Approved Deliverables & Project Files' : 'Agency Asset & File Repository'}
        subtitle="Centralized storage for campaign briefs, contracts, Figma specs, reports, and video deliverables."
      />

      {/* Upload Bar for Internal Roles */}
      {!isClient && (
        <form
          onSubmit={handleUpload}
          className="p-5 rounded-xl bg-white dark:bg-slate-900/90 border border-dashed border-slate-300 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center"
        >
          <input
            type="text"
            required
            value={uploadName}
            onChange={(e) => setUploadName(e.target.value)}
            placeholder="File name (e.g., Q4_ROAS_Deck_v4.pdf)"
            className="lg:col-span-2 px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs"
          />
          <select
            value={uploadProjectId}
            onChange={(e) => setUploadProjectId(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs"
          >
            {snapshot.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} · {p.name}
              </option>
            ))}
          </select>
          <select
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value as FileCategory)}
            className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs"
          >
            <option value="Deliverables">Deliverables</option>
            <option value="Briefs">Briefs</option>
            <option value="Contracts">Contracts</option>
            <option value="Designs">Designs</option>
            <option value="Reports">Reports</option>
            <option value="Videos">Videos</option>
          </select>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Asset</span>
          </button>
        </form>
      )}

      {/* Category Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(['ALL', 'Deliverables', 'Reports', 'Designs', 'Contracts', 'Videos', 'Briefs'] as const).map(
          (cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </button>
          )
        )}
      </div>

      {/* File Table */}
      <div className="rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-slate-800/80 text-[11px] font-semibold text-slate-500 bg-slate-50/50 dark:bg-slate-950/40">
              <th className="py-3 px-5">File Name</th>
              <th className="py-3 px-4">Project</th>
              <th className="py-3 px-4">Category & Size</th>
              <th className="py-3 px-4">Uploaded By</th>
              <th className="py-3 px-4">Visibility</th>
              <th className="py-3 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 text-xs">
            {visibleFiles.map((file) => {
              const prj = snapshot.projects.find((p) => p.id === file.project_id);
              const uploader = snapshot.users.find((u) => u.id === file.uploaded_by);
              return (
                <tr key={file.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {file.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                    {prj?.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    {file.category} · {file.sizeLabel}
                  </td>
                  <td className="py-3.5 px-4">
                    {uploader?.name} · <span className="font-mono text-slate-400">{file.created_at}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    {!isClient ? (
                      <button
                        onClick={() => toggleFileVisibility(file.id)}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono border ${
                          file.visibility === 'Client-visible'
                            ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                            : 'border-amber-500/40 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {file.visibility}
                      </button>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        Approved for Client
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => setPreviewFileId(file.id)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Preview Asset"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          addToast('Download Started', `Downloading ${file.name} (${file.sizeLabel})...`)
                        }
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Download File"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      {!isClient && (
                        <button
                          onClick={() => deleteFile(file.id)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-rose-500 hover:bg-rose-500/10"
                          title="Delete File"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4"
          onClick={() => setPreviewFileId(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-indigo-500">
                {previewFile.fileType} ASSET PREVIEW · {previewFile.sizeLabel}
              </span>
              <button
                onClick={() => setPreviewFileId(null)}
                className="text-xs text-slate-500 hover:underline"
              >
                Close
              </button>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white break-all">
              {previewFile.name}
            </h3>
            <div className="p-8 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <FileText className="w-10 h-10 text-indigo-500 mx-auto" />
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Verified Agency Deliverable Preview
              </div>
              <p className="text-[11px] text-slate-500">
                Category: {previewFile.category} · Visibility: {previewFile.visibility}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 3. APPROVAL CENTER VIEW (Section 29 & 38)
// ============================================================================
export const ApprovalsView: React.FC = () => {
  const { currentUser, snapshot, decideApproval } = useAgency();
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Pending' | 'Approved' | 'Changes Requested'>('ALL');
  const [feedbackModalId, setFeedbackModalId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [rejectConfirmId, setRejectConfirmId] = useState<string | null>(null);

  if (!currentUser) return null;
  const isClient = currentUser.role === 'CLIENT';

  const approvals = snapshot.approvals.filter((a) => {
    if (isClient) {
      if (a.client_id !== currentUser.client_id || a.visibility !== 'Client-visible') {
        return false;
      }
    }
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deliverable & Governance Approval Center"
        subtitle="Review pending campaign deliverables, supplemental budget requests, and client sign-offs."
      />

      <div className="flex items-center gap-1.5">
        {(['ALL', 'Pending', 'Approved', 'Changes Requested'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium ${
              statusFilter === st
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {st === 'ALL' ? 'All Approvals' : st}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {approvals.map((apr) => {
          const prj = snapshot.projects.find((p) => p.id === apr.project_id);
          const req = snapshot.users.find((u) => u.id === apr.requester_id);

          return (
            <div
              key={apr.id}
              className="p-5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {apr.entityType}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{prj?.name}</span>
                  <span aria-hidden="true">·</span>
                  <span>Requested by {req?.name}</span>
                  <span aria-hidden="true">·</span>
                  <PriorityText priority={apr.priority} />
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">Status: {apr.status}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {apr.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">{apr.notes}</p>
                {apr.feedback && (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 text-xs text-amber-700 dark:text-amber-300">
                    Reviewer Feedback: “{apr.feedback}”
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => decideApproval(apr.id, 'Approved')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => setFeedbackModalId(apr.id)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium"
                >
                  Request Changes
                </button>
                {!isClient && (
                  <button
                    onClick={() => setRejectConfirmId(apr.id)}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-rose-500 hover:bg-rose-500/10"
                    title="Reject"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {feedbackModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              decideApproval(feedbackModalId, 'Changes Requested', feedbackText);
              setFeedbackModalId(null);
              setFeedbackText('');
            }}
            className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Request Deliverable Revisions
            </h3>
            <textarea
              rows={3}
              required
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Describe the requested changes..."
              className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFeedbackModalId(null)}
                className="px-4 py-2 text-xs text-slate-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-amber-600 text-white text-xs font-semibold"
              >
                Submit Changes Request
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        open={Boolean(rejectConfirmId)}
        title="Reject Approval Item?"
        description="Rejecting will return the deliverable or budget request to internal draft status and notify the requester."
        confirmLabel="Reject Item"
        danger
        onCancel={() => setRejectConfirmId(null)}
        onConfirm={() => {
          if (rejectConfirmId) {
            decideApproval(rejectConfirmId, 'Rejected', 'Rejected during governance review.');
            setRejectConfirmId(null);
          }
        }}
      />
    </div>
  );
};

// ============================================================================
// 4. CALENDAR & TIME TRACKING VIEW (Section 32 & 34)
// ============================================================================
export const CalendarAndTimeView: React.FC<{ initialMode?: 'calendar' | 'time' }> = ({
  initialMode = 'calendar',
}) => {
  const {
    currentUser,
    snapshot,
    logTimeEntry,
    setQuickCreateOpen,
    openProjectDetail,
  } = useAgency();

  const [tab, setTab] = useState<'calendar' | 'time'>(initialMode);
  const [calView, setCalView] = useState<'Agenda' | 'Week' | 'Month'>('Agenda');

  // Timer state
  const [isTimerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState(
    snapshot.tasks[0]?.id || 'tsk_001'
  );
  const [manualHours, setManualHours] = useState(2.0);
  const [manualNote, setManualNote] = useState('');

  useEffect(() => {
    setTab(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  if (!currentUser) return null;

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remSec = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(remSec).padStart(2, '0')}`;
  };

  const handleStopAndSaveTimer = () => {
    setTimerRunning(false);
    const hours = Math.max(0.5, Math.round((elapsedSeconds / 3600) * 10) / 10);
    logTimeEntry(selectedTaskId, hours, 'Logged via live AgencyOS execution timer');
    setElapsedSeconds(0);
  };

  const handleManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    logTimeEntry(
      selectedTaskId,
      manualHours,
      manualNote || 'Manual sprint timesheet entry'
    );
    setManualNote('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={tab === 'calendar' ? 'Agency Calendar & Milestones' : 'Time Tracking & Sprint Hours'}
        subtitle="Coordinate campaign deadlines, client review calls, and track billable specialist execution hours."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setTab('calendar')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                  tab === 'calendar'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500'
                }`}
              >
                Calendar
              </button>
              <button
                onClick={() => setTab('time')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                  tab === 'time'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500'
                }`}
              >
                Time Tracking
              </button>
            </div>
            <button
              onClick={() => setQuickCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Event</span>
            </button>
          </div>
        }
      />

      {tab === 'calendar' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {(['Agenda', 'Week', 'Month'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setCalView(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    calView === v
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {v} View
                </button>
              ))}
            </div>
            <span className="text-xs font-mono text-slate-500">October 2026</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {snapshot.calendarEvents.map((evt) => {
              const prj = snapshot.projects.find((p) => p.id === evt.project_id);
              return (
                <div
                  key={evt.id}
                  onClick={() => prj && openProjectDetail(prj.id)}
                  className="p-5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40 cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span>{evt.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{evt.date}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {evt.title}
                    </h3>
                    {prj && <div className="text-xs text-slate-500">{prj.name}</div>}
                  </div>
                  <span className="text-xs font-mono text-slate-500 shrink-0">
                    {evt.timeLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Live Timer + Manual Entry */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Live Execution Timer
              </h2>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs"
              >
                {snapshot.tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} · {t.title}
                  </option>
                ))}
              </select>

              <div className="py-6 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <div className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {formatTimer(elapsedSeconds)}
                </div>
                <div className="flex items-center justify-center gap-3">
                  {!isTimerRunning ? (
                    <button
                      onClick={() => setTimerRunning(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Start Timer</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStopAndSaveTimer}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>Stop & Log Entry</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <form
              onSubmit={handleManualLog}
              className="lg:col-span-7 p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-4"
            >
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Manual Timesheet Entry
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Task</label>
                  <select
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs"
                  >
                    {snapshot.tasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.code} · {t.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Duration (Hours)
                  </label>
                  <input
                    type="number"
                    step={0.5}
                    min={0.5}
                    max={24}
                    value={manualHours}
                    onChange={(e) => setManualHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Execution Description
                </label>
                <input
                  type="text"
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  placeholder="Describe completed deliverables..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Record Time Entry
              </button>
            </form>
          </div>

          {/* Logged Entries Table */}
          <div className="rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 bg-slate-50/50 dark:bg-slate-950/40">
                  <th className="py-3 px-5">Specialist</th>
                  <th className="py-3 px-4">Task & Project</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-5 text-right">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                {snapshot.timeEntries.map((te) => {
                  const usr = snapshot.users.find((u) => u.id === te.user_id);
                  const tsk = snapshot.tasks.find((t) => t.id === te.task_id);
                  return (
                    <tr key={te.id}>
                      <td className="py-3 px-5 font-medium text-slate-900 dark:text-white">
                        {usr?.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-indigo-600 dark:text-indigo-400">
                          {tsk?.code}
                        </span>{' '}
                        · {tsk?.title}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{te.description}</td>
                      <td className="py-3 px-4 font-mono">{te.date}</td>
                      <td className="py-3 px-5 text-right font-mono font-semibold text-slate-900 dark:text-white">
                        {te.hours}h
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
