import React, { useState, useEffect, useRef } from "react";
import { Edit3, X } from "lucide-react";

export const PromptModal = ({
  isOpen,
  title = "Nhập thông tin",
  message,
  defaultValue = "",
  placeholder = "",
  inputType = "text", // 'text' | 'number' | 'textarea'
  required = true,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  onConfirm,
  onCancel,
}) => {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue || "");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, defaultValue]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (required && !String(value).trim()) return;
    onConfirm(value);
  };

  return (
    <div
      className="fixed inset-0 z-[190] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 shrink-0">
                <Edit3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">{title}</h3>
            </div>

            {message && (
              <p className="text-xs sm:text-sm text-slate-600 mb-4 whitespace-pre-line leading-relaxed">
                {message}
              </p>
            )}

            {inputType === "textarea" ? (
              <textarea
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                required={required}
                rows={3}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              />
            ) : (
              <input
                ref={inputRef}
                type={inputType}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                required={required}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              />
            )}
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
              type="submit"
              disabled={required && !String(value).trim()}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-xs transition"
            >
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
