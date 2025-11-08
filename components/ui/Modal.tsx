// --- START OF FILE Modal.tsx (Final, Corrected Version) ---

import React, { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  contentClassName?: string;
  initialFocusRef?: React.RefObject<HTMLElement>;
  // NEW: Add a prop to explicitly receive the element that triggered the modal
  triggerRef?: React.RefObject<HTMLElement | null>;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, contentClassName, initialFocusRef, triggerRef }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // PRIORITY 1: Use the explicitly passed triggerRef if it exists.
      // PRIORITY 2: Fallback to the active element.
      previousFocusRef.current = triggerRef?.current || document.activeElement as HTMLElement;

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleKeyDown);

      const timer = setTimeout(() => {
        if (modalRef.current) {
          if (initialFocusRef?.current) {
            initialFocusRef.current.focus();
          } else {
            const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            focusableElements[0]?.focus();
          }
        }
      }, 100);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        clearTimeout(timer);
        // On close, focus the element we stored.
        previousFocusRef.current?.focus();
      };
    }
  }, [isOpen, onClose, initialFocusRef, triggerRef]);

  // Focus Trapping logic remains the same...
  useEffect(() => {
    if (!isOpen) return;
    const handleFocusTrap = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && modalRef.current) {
        const focusableElements = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter(el => el.offsetParent !== null);

        if (focusableElements.length === 0) return;
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            event.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            event.preventDefault();
          }
        }
      }
    };
    document.addEventListener('keydown', handleFocusTrap);
    return () => {
      document.removeEventListener('keydown', handleFocusTrap);
    };
  }, [isOpen]);


  if (!isOpen) return null;

  const defaultClasses = "bg-white rounded-lg shadow-xl w-full max-w-5xl transform transition-all dark:bg-gray-800 flex flex-col max-h-[90vh]";

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-[1001] flex justify-center items-center p-4" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        ref={modalRef}
        className={contentClassName || defaultClasses}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;