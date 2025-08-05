import { toast } from 'react-hot-toast';

// Keep track of active toasts
let activeToasts = new Set();

// Toast manager to prevent excessive stacking
export const toastManager = {
  success: (message, options = {}) => {
    // Dismiss older toasts if we have too many
    if (activeToasts.size >= 2) {
      const oldestToast = Array.from(activeToasts)[0];
      toast.dismiss(oldestToast);
      activeToasts.delete(oldestToast);
    }
    
    const toastId = toast.success(message, {
      duration: 4000,
      ...options,
      onDismiss: (id) => {
        activeToasts.delete(id);
        options.onDismiss?.(id);
      }
    });
    
    activeToasts.add(toastId);
    return toastId;
  },

  error: (message, options = {}) => {
    // Dismiss older toasts if we have too many
    if (activeToasts.size >= 2) {
      const oldestToast = Array.from(activeToasts)[0];
      toast.dismiss(oldestToast);
      activeToasts.delete(oldestToast);
    }
    
    const toastId = toast.error(message, {
      duration: 5000,
      ...options,
      onDismiss: (id) => {
        activeToasts.delete(id);
        options.onDismiss?.(id);
      }
    });
    
    activeToasts.add(toastId);
    return toastId;
  },

  loading: (message, options = {}) => {
    const toastId = toast.loading(message, {
      ...options,
      onDismiss: (id) => {
        activeToasts.delete(id);
        options.onDismiss?.(id);
      }
    });
    
    activeToasts.add(toastId);
    return toastId;
  },

  dismiss: (toastId) => {
    toast.dismiss(toastId);
    activeToasts.delete(toastId);
  },

  dismissAll: () => {
    toast.dismiss();
    activeToasts.clear();
  }
};

// Export the standard toast for backward compatibility
export { toast };
