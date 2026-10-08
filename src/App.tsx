import React from 'react';
import { PublicHomeAndLogin } from './components/auth/PublicHomeAndLogin';
import { AppShell } from './components/layout/AppShell';
import { EmptyState } from './components/ui/Primitives';
import {
  ApprovalsView,
  CalendarAndTimeView,
  FilesView,
  MessagesView,
} from './components/views/CollaborationAndOpsViews';
import {
  ActivityAuditView,
  AnalyticsView,
  FinanceAndInvoicesView,
  ReportsView,
  SettingsAndProfileView,
} from './components/views/GovernanceAndSettingsViews';
import { LeadsAndClientsView } from './components/views/LeadsAndClientsView';
import { ProjectsAndDetailView } from './components/views/ProjectsAndDetailView';
import { RoleOverviews } from './components/views/RoleOverviews';
import { TasksModuleView } from './components/views/TasksModuleView';
import { TeamAndDepartmentsView } from './components/views/TeamAndDepartmentsView';
import { AgencyProvider, useAgency } from './context/AgencyContext';

const AgencyRouter: React.FC = () => {
  const { currentUser, activeNav, navigateTo } = useAgency();

  if (!currentUser) {
    return <PublicHomeAndLogin />;
  }

  const renderActiveWorkspace = () => {
    switch (activeNav) {
      case 'overview':
        return <RoleOverviews />;
      case 'projects':
        return <ProjectsAndDetailView />;
      case 'tasks':
        return <TasksModuleView />;
      case 'team':
        return <TeamAndDepartmentsView key="team" initialSubTab="specialists" />;
      case 'departments':
        return <TeamAndDepartmentsView key="departments" initialSubTab="departments" />;
      case 'leads':
        return <LeadsAndClientsView mode="leads" />;
      case 'clients':
        return <LeadsAndClientsView mode="clients" />;
      case 'messages':
        return <MessagesView />;
      case 'files':
        return <FilesView />;
      case 'approvals':
        return <ApprovalsView />;
      case 'calendar':
        return <CalendarAndTimeView initialMode="calendar" />;
      case 'time':
        return <CalendarAndTimeView initialMode="time" />;
      case 'analytics':
        return <AnalyticsView />;
      case 'reports':
        return <ReportsView />;
      case 'finance':
      case 'invoices':
        return <FinanceAndInvoicesView />;
      case 'activity':
        return <ActivityAuditView />;
      case 'settings':
      case 'profile':
        return <SettingsAndProfileView />;
      default:
        return (
          <EmptyState
            title="We couldn't find that workspace."
            description="The requested route does not exist or has been moved."
            actionLabel="Return to Portal Overview"
            onAction={() => navigateTo('overview')}
          />
        );
    }
  };

  return <AppShell>{renderActiveWorkspace()}</AppShell>;
};

export function App() {
  return (
    <AgencyProvider>
      <AgencyRouter />
    </AgencyProvider>
  );
}

export default App;
