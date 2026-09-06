import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Standardized Canonical Modal Component for PeoplePay360
 * 
 * Features:
 * - React Portal rendering directly at document.body level for 100% viewport backdrop coverage (covers header, sidebar, and canvas).
 * - Automatic document.body scroll locking on open and restoration on unmount/close.
 * - Keyboard Escape dismiss (when not in submitting/preventClose state).
 * - Backdrop click dismiss (configurable / disabled during submission).
 * - Responsive sizing and internal scrolling support for oversized contents.
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: IconComponent,
  maxWidth = 'max-w-lg',
  preventClose = false,
  children,
  headerClassName = 'px-6 py-4 border-b border-slate-100',
  customHeader = null
}) => {
  // Lock document body scrolling while modal is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle keyboard Escape dismiss
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !preventClose && onClose) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose, preventClose]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Full-viewport fixed backdrop covering entire screen, sidebar, and navbar */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={preventClose ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Dialog container */}
      <div 
        className={`relative bg-white rounded-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto z-10 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col ${maxWidth}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Custom Header or Default Header */}
        {customHeader ? (
          customHeader
        ) : (title || IconComponent) ? (
          <div className={`flex items-center justify-between shrink-0 ${headerClassName}`}>
            <div className="flex items-center gap-2.5">
              {IconComponent && (
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0051d5] flex items-center justify-center shrink-0">
                  <IconComponent size={18} />
                </div>
              )}
              <div>
                {title && <h3 className="font-bold text-slate-900 text-base leading-snug">{title}</h3>}
                {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
              </div>
            </div>
            {!preventClose && onClose && (
              <button 
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            )}
          </div>
        ) : null}

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
