import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface ConfirmDeleteDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Loading state for async deletes */
  isLoading?: boolean;
}

export default function ConfirmDeleteDialog({
  open,
  title = "Delete Item?",
  description = "This will be permanently removed. This cannot be undone.",
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDeleteDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-card border border-border rounded-xl p-6 max-w-xs w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <h3 className="text-sm font-mono uppercase tracking-[0.1em] text-foreground font-semibold">
                {title}
              </h3>
            </div>
            <p className="text-xs font-mono text-[var(--muted-foreground)] mb-5 leading-relaxed">
              {description}
            </p>
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 py-2.5 text-xs font-mono uppercase tracking-[0.15em] border border-border rounded-lg text-[var(--muted-foreground)] hover:text-foreground hover:border-foreground/30 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 py-2.5 text-xs font-mono uppercase tracking-[0.15em] bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer font-bold disabled:opacity-50"
              >
                {isLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
