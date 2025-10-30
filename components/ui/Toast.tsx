
import React, { useEffect, useState, useRef } from 'react';
import { ToastData } from '../../types.ts';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastProps {
  toast: ToastData;
  onRemove: (id: number) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(true);

  const remove = () => {
    setIsVisible(false);
    onRemove(toast.id);
  };

  useEffect(() => {
    const timer = setTimeout(remove, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const handleClose = () => {
    remove();
  };

  if (!isVisible) return null;

  const isSuccess = toast.type === 'success';
  const icon = isSuccess ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />;
  
  const containerClasses = `
    flex items-center w-full max-w-xs p-4 text-gray-500 bg-white rounded-lg shadow-lg
    ring-1 ring-black ring-opacity-5
    dark:bg-gray-800 dark:text-gray-400 dark:ring-white/10
  `;
  
  return (
    <div className={containerClasses}>
      <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8">
        {icon}
      </div>
      <div className="ml-3 text-sm font-normal text-gray-700 dark:text-gray-200">{toast.message}</div>
      <button 
        type="button" 
        className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8 dark:bg-gray-800 dark:text-gray-500 dark:hover:text-white dark:hover:bg-gray-700" 
        aria-label="Close"
        onClick={handleClose}
      >
        <span className="sr-only">Close</span>
        <X size={20} />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastData[];
  onRemove: (id: number) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  const MAX_TOASTS = 3;
  
  useEffect(() => {
    if (toasts.length > MAX_TOASTS) {
      const oldestToasts = toasts.slice(0, toasts.length - MAX_TOASTS);
      oldestToasts.forEach(toast => onRemove(toast.id));
    }
  }, [toasts, onRemove]);

  useEffect(() => {
    const cleanup = setTimeout(() => {
      if (toasts.length > 0) {
        toasts.forEach(toast => onRemove(toast.id));
      }
    }, 30000);
    
    return () => clearTimeout(cleanup);
  }, []);

  return (
    <div className="fixed top-5 right-5 z-[2000] w-full max-w-xs space-y-4">
      {toasts.slice(-MAX_TOASTS).map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

export default ToastContainer;
