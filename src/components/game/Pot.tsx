"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChipStack } from "./ChipStack";
import { cn } from "@/lib/utils";

/**
 * Pot — centre of the table. White "POTE: [Miktar]" label above a 3D stack
 * of coloured casino chips. Pulses when the amount changes.
 */
export function Pot({
  amount,
  label = "POTE",
  className,
}: {
  amount: number;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <motion.div
        key={amount}
        initial={{ scale: 0.8, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
        className="mb-1 rounded-full bg-black/40 px-4 py-1 ring-1 ring-amber-300/40"
      >
        <span className="text-glow-white text-sm font-black uppercase tracking-widest text-white sm:text-base">
          {label}:{" "}
        </span>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={amount}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            className="text-glow-gold text-base font-black text-amber-300 sm:text-lg"
          >
            {amount.toLocaleString("tr-TR")}
          </motion.span>
        </AnimatePresence>
      </motion.div>
      <div className="animate-pot-pulse">
        <ChipStack total={amount} size={48} />
      </div>
    </div>
  );
}
