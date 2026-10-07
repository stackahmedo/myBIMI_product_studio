import React, { useState, useEffect } from 'react';
import { Users, Shield, Check, X, Store as StoreIcon, UserCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dataService } from '../services/dataService';
import { UserProfile } from '../types/database';

export const UsersView: React.FC = () => {
  const { stores, currentUser, setCurrentUser, addToast } = useApp();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const list = await dataService.getUsers();
        setUsers(list);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const permissionsMatrix = [
    { permission: 'Manage Master Catalog & SKUs', superAdmin: true, storeManager: true, inventoryLead: true, staff: false },
    { permission: 'Override Store Retail Prices', superAdmin: true, storeManager: true, inventoryLead: false, staff: false },
    { permission: 'Execute Physical Stock Adjustments', superAdmin: true, storeManager: true, inventoryLead: true, staff: false },
    { permission: 'Inter-Branch Stock Transfers', superAdmin: true, storeManager: true, inventoryLead: true, staff: false },
    { permission: 'Print Shelf Price Tags & POP', superAdmin: true, storeManager: true, inventoryLead: true, staff: true },
    { permission: 'Trigger Website / POS Sync', superAdmin: true, storeManager: false, inventoryLead: false, staff: false },
    { permission: 'Create & Edit Store Branches', superAdmin: true, storeManager: false, inventoryLead: false, staff: false },
    { permission: 'Inspect Audit Logs & DDL Schema', superAdmin: true, storeManager: true, inventoryLead: false, staff: false },
  ];

  const roleLabels: Record<string, string> = {
    super_admin: 'Super Admin',
    store_manager: 'Store Manager',
    inventory_lead: 'Inventory Specialist',
    staff: 'Floor Staff',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Users & Access Permissions</h1>
        <p className="text-xs text-slate-500 mt-1">
          Role-Based Access Control (RBAC) and assigned branch permissions for BIMI operations.
        </p>
      </div>

      {/* Users List */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-900">Registered Operators ({users.length})</h2>
          <span className="text-[11px] text-slate-400">Click to switch active session</span>
        </div>

        <div className="divide-y divide-slate-100">
          {users.map((u) => {
            const isCurrent = currentUser.id === u.id;
            const assignedStore = stores.find((s) => s.id === u.assigned_store_id);

            return (
              <div
                key={u.id}
                className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                  isCurrent ? 'bg-slate-50/80' : 'hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-medium text-xs flex items-center justify-center">
                    {u.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-xs text-slate-900">{u.name}</p>
                      {isCurrent && (
                        <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                          ACTIVE SESSION
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {roleLabels[u.role]}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {assignedStore ? assignedStore.name : 'All Branches (Enterprise)'}
                    </p>
                  </div>

                  {!isCurrent && (
                    <button
                      onClick={() => {
                        setCurrentUser(u);
                        addToast({
                          type: 'info',
                          title: `Active user switched to ${u.name}`,
                        });
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs cursor-pointer"
                    >
                      Switch to User
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-xs font-semibold text-slate-900">Role Permissions Policy Matrix</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Defines granular operational actions across retail branches</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] text-slate-500 font-medium">
                <th className="py-3 px-4 font-medium">SYSTEM PERMISSION</th>
                <th className="py-3 px-4 font-medium text-center">SUPER ADMIN</th>
                <th className="py-3 px-4 font-medium text-center">STORE MANAGER</th>
                <th className="py-3 px-4 font-medium text-center">INVENTORY SPECIALIST</th>
                <th className="py-3 px-4 font-medium text-center">FLOOR STAFF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {permissionsMatrix.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-medium text-slate-900">{p.permission}</td>
                  <td className="py-3 px-4 text-center">
                    {p.superAdmin ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {p.storeManager ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {p.inventoryLead ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {p.staff ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
