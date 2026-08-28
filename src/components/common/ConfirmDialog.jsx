// src/components/common/ConfirmDialog.jsx
// Reusable confirmation dialog for delete/blacklist actions

import Modal from "./Modal";

function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
}) {
  if (!isOpen) return null;

  const buttonColors = {
    danger: "bg-red-600 hover:bg-red-700",
    warning: "bg-yellow-600 hover:bg-yellow-700",
    info: "bg-blue-600 hover:bg-blue-700",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || "Confirm"} size="sm">
      <div className="py-4">
        <p className="text-gray-300">{message || "Are you sure?"}</p>
      </div>
      <div className="flex justify-end gap-3 mt-6 border-t border-zinc-700 pt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-400 hover:text-white border border-zinc-600 rounded-lg hover:bg-zinc-700 transition"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 text-white rounded-lg font-semibold transition ${buttonColors[variant]}`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;