/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardView } from './views/DashboardView';
import { ProductsView } from './views/ProductsView';
import { InventoryView } from './views/InventoryView';
import { PricingView } from './views/PricingView';
import { PriceTagsView } from './views/PriceTagsView';
import { SuppliersView } from './views/SuppliersView';
import { PurchasingView } from './views/PurchasingView';
import { WebsiteSyncView } from './views/WebsiteSyncView';
import { ReportsView } from './views/ReportsView';
import { UsersView } from './views/UsersView';
import { AuditLogView } from './views/AuditLogView';
import { SettingsView } from './views/SettingsView';
import { SuperAdminView } from './views/SuperAdminView';
import { LoginView } from './components/auth/LoginView';
import { AccessRestrictedView } from './components/auth/AccessRestrictedView';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const AppContent: React.FC = () => {
  const { activeTab } = useApp();
  const { role, permissions, isAuthenticated, isLoading } = useAuth();

  // Mandatory Authentication Gate
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4 font-sans">
        <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-400">Verifying Security Session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'products':
        return <ProductsView />;
      case 'inventory':
        return <InventoryView />;
      case 'pricing':
        if (role === 'STORE_STAFF') {
          return (
            <AccessRestrictedView
              requiredRole="ADMIN or MANAGER"
              featureName="Store Pricing & Campaign Overrides"
            />
          );
        }
        return <PricingView />;
      case 'price-tags':
        return <PriceTagsView />;
      case 'suppliers':
        if (role === 'STORE_STAFF') {
          return (
            <AccessRestrictedView
              requiredRole="ADMIN or MANAGER"
              featureName="Wholesale Supplier Management"
            />
          );
        }
        return <SuppliersView />;
      case 'purchasing':
        if (role === 'STORE_STAFF') {
          return (
            <AccessRestrictedView
              requiredRole="ADMIN or MANAGER"
              featureName="Procurement & Purchase Orders"
            />
          );
        }
        return <PurchasingView />;
      case 'website-sync':
        return <WebsiteSyncView />;
      case 'reports':
        if (role === 'STORE_STAFF') {
          return (
            <AccessRestrictedView
              requiredRole="ADMIN or MANAGER"
              featureName="Financial & Operational Analytics"
            />
          );
        }
        return <ReportsView />;
      case 'users':
        if (role !== 'ADMIN') {
          return (
            <AccessRestrictedView
              requiredRole="ADMIN"
              featureName="User Profiles & System Administration"
            />
          );
        }
        return <UsersView />;
      case 'audit-log':
        if (role !== 'ADMIN' && role !== 'MANAGER') {
          return (
            <AccessRestrictedView
              requiredRole="ADMIN or MANAGER"
              featureName="Immutable Security Audit Logs"
            />
          );
        }
        return <AuditLogView />;
      case 'settings':
        if (role !== 'ADMIN') {
          return (
            <AccessRestrictedView
              requiredRole="ADMIN"
              featureName="System & Database Configurations"
            />
          );
        }
        return <SettingsView />;
      case 'super-admin':
        if (role !== 'ADMIN') {
          return (
            <AccessRestrictedView
              requiredRole="ADMIN"
              featureName="Security & Super Admin Monitoring"
            />
          );
        }
        return <SuperAdminView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <AppLayout>
      <ErrorBoundary key={activeTab}>
        {renderActiveView()}
      </ErrorBoundary>
    </AppLayout>
  );
};

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="Product Studio Application Error">
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
