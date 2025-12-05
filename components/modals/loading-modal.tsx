"use client"

import { motion, AnimatePresence } from "framer-motion"
import { LoadingSpinner } from "@/components/animations"

interface LoadingModalProps {
  isOpen: boolean
  message?: string
}

export function LoadingModal({ isOpen, message = "Processing..." }: LoadingModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100000]"
          >
            <div className="bg-background border border-border rounded-lg shadow-xl p-8 flex flex-col items-center gap-4">
              <LoadingSpinner />
              {message && (
                <motion.p
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-sm text-muted-foreground text-center"
                >
                  {message}
                </motion.p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
