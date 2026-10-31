import React from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export const ToastContainer = ({ toasts = [], onDismiss }) => {
  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-2">
      {toasts.map((t) => {
        const isSuccess = t.type === "success";
        const isError = t.type === "error";
        const isWarning = t.type === "warning";

        const bgClass = isSuccess
          ? "bg-emerald-50 border-emerald-200 text-emerald-900"
          : isError
          ? "bg-rose-50 border-rose-200 text-rose-900"
          : isWarning
          ? "bg-amber-50 border-amber-200 text-amber-900"
          : "bg-blue-50 border-blue-200 text-blue-900";

        const Icon = isSuccess
          ? CheckCircle2
          : isError
          ? AlertCircle
          : isWarning
          ? AlertTriangle
          : Info;

        const iconColor = isSuccess
          ? "text-emerald-600"
          : isError
          ? "text-rose-600"
          : isWarning
          ? "text-amber-600"
          : "text-blue-600";

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-xs transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${bgClass}`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 text-xs leading-relaxed font-medium">
              {t.title && <div className="font-bold mb-0.5 text-sm">{t.title}</div>}
              <div className="break-words">{t.message}</div>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className="shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition"
              title="Đóng"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
