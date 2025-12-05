"use client"

import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
}

export function ConfirmationModal({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = "Leave",
  cancelText = "Continue",
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[10000] pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-background border border-border rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <AlertCircle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-1" />
                </motion.div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{description}</p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end mt-6">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={(e) => { e.stopPropagation(); onCancel() }}>
                  <Button
                    variant="outline"
                    className="rounded-lg"
                  >
                    {cancelText}
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={(e) => { e.stopPropagation(); onConfirm() }}>
                  <Button
                    variant="destructive"
                    className="rounded-lg"
                  >
                    {confirmText}
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
