import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center p-8 md:p-12 text-center min-h-[400px]"
    >
      {/* Animated Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.1,
        }}
        className="mb-6 p-6 md:p-8 bg-gradient-to-br from-brand-50 to-teal-50 dark:from-brand-900/20 dark:to-teal-900/20 rounded-full shadow-lg"
      >
        <motion.div
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: "easeInOut",
          }}
        >
          <Icon className="w-14 h-14 md:w-16 md:h-16 text-brand-500" strokeWidth={1.5} />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3"
      >
        {title}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-8 max-w-md leading-relaxed"
      >
        {description}
      </motion.p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto"
        >
          {action && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={action.onClick}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-brand-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            >
              {action.label}
            </motion.button>
          )}
          {secondaryAction && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={secondaryAction.onClick}
              className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold border-2 border-gray-200 dark:border-gray-700 hover:border-brand-500 dark:hover:border-brand-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            >
              {secondaryAction.label}
            </motion.button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
