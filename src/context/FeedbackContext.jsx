import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { ToastContainer } from "../components/common/ToastContainer";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { PromptModal } from "../components/common/PromptModal";

const FeedbackContext = createContext(null);

export const FeedbackProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState({ isOpen: false });
  const [promptState, setPromptState] = useState({ isOpen: false });

  const confirmResolverRef = useRef(null);
  const promptResolverRef = useRef(null);

  // --- Toast Methods ---
  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type, message, title = "") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const toast = {
    success: (msg, title) => addToast("success", msg, title),
    error: (msg, title) => addToast("error", msg, title),
    warning: (msg, title) => addToast("warning", msg, title),
    info: (msg, title) => addToast("info", msg, title),
  };

  // --- Confirm Dialog (replaces window.confirm) ---
  const confirm = useCallback(
    ({
      title = "Xác nhận hành động",
      message,
      confirmText = "Xác nhận",
      cancelText = "Hủy",
      variant = "danger",
    }) => {
      return new Promise((resolve) => {
        confirmResolverRef.current = resolve;
        setConfirmState({
          isOpen: true,
          title,
          message,
          confirmText,
          cancelText,
          variant,
        });
      });
    },
    []
  );

  const handleConfirmAction = useCallback(() => {
    if (confirmResolverRef.current) {
      confirmResolverRef.current(true);
      confirmResolverRef.current = null;
    }
    setConfirmState({ isOpen: false });
  }, []);

  const handleCancelConfirm = useCallback(() => {
    if (confirmResolverRef.current) {
      confirmResolverRef.current(false);
      confirmResolverRef.current = null;
    }
    setConfirmState({ isOpen: false });
  }, []);

  // --- Prompt Dialog (replaces window.prompt) ---
  const prompt = useCallback(
    ({
      title = "Nhập thông tin",
      message,
      defaultValue = "",
      placeholder = "",
      inputType = "text",
      required = true,
      confirmText = "Xác nhận",
      cancelText = "Hủy",
    }) => {
      return new Promise((resolve) => {
        promptResolverRef.current = resolve;
        setPromptState({
          isOpen: true,
          title,
          message,
          defaultValue,
          placeholder,
          inputType,
          required,
          confirmText,
          cancelText,
        });
      });
    },
    []
  );

  const handlePromptAction = useCallback((value) => {
    if (promptResolverRef.current) {
      promptResolverRef.current(value);
      promptResolverRef.current = null;
    }
    setPromptState({ isOpen: false });
  }, []);

  const handleCancelPrompt = useCallback(() => {
    if (promptResolverRef.current) {
      promptResolverRef.current(null);
      promptResolverRef.current = null;
    }
    setPromptState({ isOpen: false });
  }, []);

  return (
    <FeedbackContext.Provider value={{ toast, confirm, prompt }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelConfirm}
      />
      <PromptModal
        isOpen={promptState.isOpen}
        title={promptState.title}
        message={promptState.message}
        defaultValue={promptState.defaultValue}
        placeholder={promptState.placeholder}
        inputType={promptState.inputType}
        required={promptState.required}
        confirmText={promptState.confirmText}
        cancelText={promptState.cancelText}
        onConfirm={handlePromptAction}
        onCancel={handleCancelPrompt}
      />
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }
  return context;
};
