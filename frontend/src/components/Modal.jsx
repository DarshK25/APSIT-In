import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import { TransitionChild } from '@headlessui/react';

const Modal = ({ isOpen, onClose, title, children, actions }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <TransitionChild
          as="div"
          className="fixed inset-0 overflow-y-auto"
          enter="transition-opacity ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" />
              <div className="absolute inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                  <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-dark-card shadow-xl transition-all">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b p-4">
                      <h3 className="text-lg font-medium">{title}</h3>
                      <button
                        onClick={onClose}
                        className="rounded-full p-1 hover:bg-gray-100 transition-colors"
                      >
                        <X size={20} className="text-gray-500" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      {children}
                    </div>

                    {/* Actions */}
                    {actions && (
                      <div className="border-t p-4 flex justify-end space-x-2">
                        {actions}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TransitionChild>
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  actions: PropTypes.node,
};

export default Modal; 