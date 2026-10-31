import React, { useEffect } from "react";
import { AlertTriangle, AlertCircle, HelpCircle, X } from "lucide-react";

export const ConfirmModal = ({
  isOpen,
  title = "Xác nhận hành động",
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  variant = "danger", // 'danger' | 'primary' | 'warning'
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isDanger = variant === "danger";
  const isWarning = variant === "warning";

  const Icon = isDanger ? AlertCircle : isWarning ? AlertTriangle : HelpCircle;
  const iconBg = isDanger
    ? "bg-rose-100 text-rose-600"
    : isWarning
    ? "bg-amber-100 text-amber-600"
    : "bg-blue-100 text-blue-600";

  const btnConfirmBg = isDanger
    ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200"
    : isWarning
    ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200"
    : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200";

  return (
    <div
      className="fixed inset-0 z-[190] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl shrink-0 ${iconBg}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-slate-900 leading-snug">{title}</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-white hover:border-slate-400 transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-semibold rounded-xl shadow-xs transition ${btnConfirmBg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
