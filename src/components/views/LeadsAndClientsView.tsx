import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  FolderPlus,
  Globe,
  Mail,
  Phone,
  Plus,
} from 'lucide-react';
import { useAgency } from '../../context/AgencyContext';
import { formatCurrency } from '../../services/agencyServices';
import {
  AvatarCircle,
  KpiCard,
  PageHeader,
} from '../ui/Primitives';
import { LeadStatus } from '../../types/domain';

const LEAD_STAGES: LeadStatus[] = [
  'New',
  'Contacted',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Won',
  'Lost',
];

export const LeadsAndClientsView: React.FC<{ mode: 'leads' | 'clients' }> = ({
  mode,
}) => {
  const {
    snapshot,
    currency,
    selectedClientId,
    openClientDetail,
    openProjectDetail,
    setQuickCreateOpen,
    updateLeadStatus,
    convertLeadToClient,
  } = useAgency();

  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  // ==========================================================================
  // 1. LEADS & CRM PIPELINE (Section 26 & 97)
  // ==========================================================================
  if (mode === 'leads') {
    const totalPipelineBdt = snapshot.leads
      .filter((l) => l.status !== 'Lost')
      .reduce((s, l) => s + l.potentialValueBdt, 0);

    const wonLeads = snapshot.leads.filter((l) => l.status === 'Won');
    const convRate = Math.round(
      ((wonLeads.length + 2) / Math.max(1, snapshot.leads.length + 2)) * 100
    );

    return (
      <div className="space-y-6">
        <PageHeader
          title="Lead Pipeline & Agency CRM"
          subtitle="Track inbound agency opportunities from discovery to proposal, convert Won deals into active Client accounts, and kick off projects."
          actions={
            <button
              onClick={() => setQuickCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Lead</span>
            </button>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Active Pipeline Value"
            value={formatCurrency(totalPipelineBdt, currency)}
            delta="+22.4%"
            deltaPositive
            subtext={`Across ${snapshot.leads.length} tracked opportunities`}
          />
          <KpiCard
            label="Lead-to-Retainer Conversion"
            value={`${convRate}%`}
            delta="+4.1% vs Q3"
            deltaPositive
            subtext="Qualified inbound + ABM"
          />
          <KpiCard
            label="Deals in Proposal / Negotiation"
            value={
              snapshot.leads.filter(
                (l) => l.status === 'Proposal' || l.status === 'Negotiation'
              ).length
            }
            subtext="Closing within 14 days"
          />
          <KpiCard
            label="Won Deals Ready to Onboard"
            value={wonLeads.length}
            subtext="Click Convert to Client below"
          />
        </div>

        {/* Visual Drag-and-Drop Lead Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3.5 overflow-x-auto pb-2">
          {LEAD_STAGES.filter((s) => s !== 'Lost').map((stage) => {
            const stageLeads = snapshot.leads.filter((l) => l.status === stage);
            return (
              <div
                key={stage}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedLeadId) {
                    updateLeadStatus(draggedLeadId, stage);
                    setDraggedLeadId(null);
                  }
                }}
                className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex flex-col gap-2.5 min-h-[430px]"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 px-1">
                  <span>{stage}</span>
                  <span className="font-mono text-slate-400">{stageLeads.length}</span>
                </div>

                <div className="space-y-2.5 flex-1">
                  {stageLeads.map((lead) => {
                    const mgr = snapshot.users.find(
                      (u) => u.id === lead.assigned_manager_id
                    );
                    const alreadyClient = snapshot.clients.some(
                      (c) => c.company.toLowerCase() === lead.company.toLowerCase()
                    );

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={() => setDraggedLeadId(lead.id)}
                        className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs shadow-2xs"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{lead.source}</span>
                          <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                            {formatCurrency(lead.potentialValueBdt, currency)}
                          </span>
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {lead.company}
                        </div>
                        <div className="text-slate-500">
                          {lead.name} · {lead.service}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2">
                          {lead.notes}
                        </p>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-400 truncate">
                            Owner: {mgr?.name.split(' ')[0]}
                          </span>
                          <select
                            value={lead.status}
                            onChange={(e) =>
                              updateLeadStatus(lead.id, e.target.value as LeadStatus)
                            }
                            className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[11px]"
                          >
                            {LEAD_STAGES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>

                        {lead.status === 'Won' && !alreadyClient && (
                          <button
                            onClick={() => {
                              const createdClient = convertLeadToClient(lead.id);
                              if (createdClient) {
                                openClientDetail(createdClient.id);
                              }
                            }}
                            className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Convert to Client</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ==========================================================================
  // 2. CLIENT DETAIL WORKSPACE (Section 27)
  // ==========================================================================
  if (selectedClientId) {
    const client = snapshot.clients.find((c) => c.id === selectedClientId);
    if (!client) {
      return (
        <button
          onClick={() => openClientDetail(null)}
          className="text-xs text-indigo-500 hover:underline"
        >
          Back to Clients
        </button>
      );
    }

    const mgr = snapshot.users.find((u) => u.id === client.manager_id);
    const clientProjects = snapshot.projects.filter((p) => p.client_id === client.id);
    const clientInvoices = snapshot.invoices.filter((i) => i.client_id === client.id);
    const clientFiles = snapshot.files.filter((f) => f.client_id === client.id);

    return (
      <div className="space-y-6">
        <button
          onClick={() => openClientDetail(null)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Client Directory</span>
        </button>

        <div className="p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {client.status} Retainer Account
              </span>
              <span aria-hidden="true">·</span>
              <span>{client.industry}</span>
              <span aria-hidden="true">·</span>
              <span>Joined {client.joined_date}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display">
              {client.company}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> {client.email} ({client.name})
              </span>
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> {client.phone}
              </span>
              <span className="inline-flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> {client.website}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-xs text-slate-500">Lifetime Contract Value</div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {formatCurrency(client.totalValueBdt, currency)}
              </div>
            </div>
            <button
              onClick={() => setQuickCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Internal Strategic Notes Box */}
        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/25 text-xs space-y-1">
          <div className="font-semibold text-amber-700 dark:text-amber-300">
            Internal Agency Account Notes (Hidden from Client Portal)
          </div>
          <p className="text-slate-700 dark:text-slate-300">{client.notes}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Client Campaigns & Projects ({clientProjects.length})
            </h2>
            <div className="space-y-3">
              {clientProjects.map((prj) => (
                <div
                  key={prj.id}
                  onClick={() => openProjectDetail(prj.id)}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 cursor-pointer flex items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <div className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                      {prj.code} · {prj.status}
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {prj.name}
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      Lead Manager: {mgr?.name} · Due {prj.deadline}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Billing & Invoices ({clientInvoices.length})
              </h2>
              {clientInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-none flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-mono font-semibold text-slate-900 dark:text-white">
                      {inv.code}
                    </div>
                    <div className="text-slate-500">{inv.itemsSummary}</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(inv.amountBdt, currency)}
                    </div>
                    <div className="text-[11px] text-slate-500">{inv.status}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Shared Files ({clientFiles.length})
              </h2>
              {clientFiles.map((f) => (
                <div
                  key={f.id}
                  className="py-2 border-b border-slate-100 dark:border-slate-800 last:border-none flex items-center justify-between text-xs"
                >
                  <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                    {f.name}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400 shrink-0 ml-2">
                    {f.visibility}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // 3. CLIENTS DIRECTORY
  // ==========================================================================
  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Accounts & Retainer Portfolio"
        subtitle="Manage client organizations, stakeholder contacts, active retainers, and account health."
        actions={
          <button
            onClick={() => setQuickCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Onboard New Client</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {snapshot.clients.map((cli) => {
          const mgr = snapshot.users.find((u) => u.id === cli.manager_id);
          const cliProjects = snapshot.projects.filter((p) => p.client_id === cli.id);
          return (
            <div
              key={cli.id}
              onClick={() => openClientDetail(cli.id)}
              className="p-5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/50 cursor-pointer flex flex-col justify-between gap-4 transition-all"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{cli.industry}</span>
                  <span className="font-medium text-indigo-600 dark:text-indigo-400">
                    {cli.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                  {cli.company}
                </h3>
                <p className="text-xs text-slate-500">
                  Primary Contact: {cli.name} · {cli.email}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {mgr && (
                    <AvatarCircle
                      initials={mgr.avatarInitials}
                      colorClass={mgr.avatarColor}
                      size="xs"
                    />
                  )}
                  <span className="text-slate-600 dark:text-slate-400">
                    {cliProjects.length} Projects
                  </span>
                </div>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(cli.totalValueBdt, currency)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
