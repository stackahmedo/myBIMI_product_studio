import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Product } from '../../types/database';

interface DeleteConfirmModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (product: Product) => Promise<void>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  product,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !product) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(product);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs animate-in fade-in-50">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-10 animate-in zoom-in-95">
        <div className="p-6">
          <div className="flex items-center gap-3 text-rose-600 mb-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Delete Product Master</h3>
              <p className="text-xs text-slate-400">Irreversible catalog removal</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            Are you sure you want to permanently delete{' '}
            <strong className="text-slate-900">{product.name}</strong> (SKU: {product.sku})?
          </p>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500 space-y-1">
            <p>• All store-specific stock levels for this SKU will be removed.</p>
            <p>• Historical audit trail entries will be preserved for compliance.</p>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Product'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
