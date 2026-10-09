import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { TimeSimProvider } from './context/TimeSimContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { ToastContainer } from './components/ToastContainer';
import { CampusAIChatModal } from './components/CampusAIChatModal';

// Pages
import { LoginPage } from './pages/LoginPage';
import { NowPage } from './pages/NowPage';
import { CrowdPage } from './pages/CrowdPage';
import { RoomsPage } from './pages/RoomsPage';
import { IssuesPage } from './pages/IssuesPage';
import { TimetablePage } from './pages/TimetablePage';
import { EventsPage } from './pages/EventsPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('now');
  const [isAIChatOpen, setIsAIChatOpen] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-400 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 animate-pulse">
          ⚡
        </div>
        <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
          Initializing CampusNow Engine...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Role authorization guard for analytics
  const renderActiveView = () => {
    switch (activeTab) {
      case 'now':
        return <NowPage onNavigateTab={setActiveTab} onOpenAI={() => setIsAIChatOpen(true)} />;
      case 'crowd':
        return <CrowdPage />;
      case 'rooms':
        return <RoomsPage />;
      case 'issues':
        return <IssuesPage />;
      case 'timetable':
      case 'attendance':
        return <TimetablePage />;
      case 'events':
        return <EventsPage />;
      case 'announcements':
        return <AnnouncementsPage />;
      case 'analytics':
        return user?.role === 'ADMIN' ? (
          <AnalyticsPage />
        ) : (
          <NowPage onNavigateTab={setActiveTab} onOpenAI={() => setIsAIChatOpen(true)} />
        );
      default:
        return <NowPage onNavigateTab={setActiveTab} onOpenAI={() => setIsAIChatOpen(true)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-teal-500 selection:text-white">
      {/* Top Header Navbar */}
      <Navbar
        onOpenAI={() => setIsAIChatOpen(true)}
        onNavigateTab={setActiveTab}
      />

      {/* Main Content Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 pt-2 pb-24 md:pb-12">
        {/* Navigation Tabs (Desktop / Mobile responsive) */}
        <BottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenAI={() => setIsAIChatOpen(true)}
        />

        {/* Dynamic Page Component */}
        <div className="mt-2 animate-fadeIn">
          {renderActiveView()}
        </div>
      </main>

      {/* Interactive CampusAI Assistant Modal */}
      <CampusAIChatModal
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        onNavigateTab={setActiveTab}
      />

      {/* Floating System Toasts */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <TimeSimProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </TimeSimProvider>
    </ToastProvider>
  );
}
