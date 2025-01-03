// src/components/FeatureCard.tsx
import React, { useState } from 'react';
import { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SneakPeekContent {
  type: 'image' | 'video' | 'comingSoon';
  src?: string; // Required for 'image' and 'video'
  alt?: string; // For images
  title?: string; // For videos
  message?: string; // For 'comingSoon'
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  comingSoon?: boolean;
  sneakPeek?: SneakPeekContent;
}

export function FeatureCard({
  title,
  description,
  icon: Icon,
  comingSoon,
  sneakPeek,
}: FeatureCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSneakPeek = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-transform transform hover:scale-105"
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 },
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="flex items-center mb-4">
        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        {comingSoon && (
          <span className="ml-3 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded-full">
            Coming Soon
          </span>
        )}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>

      {sneakPeek && (
        <div className="mt-4">
          <button
            onClick={toggleSneakPeek}
            className="text-blue-600 dark:text-blue-400 hover:underline focus:outline-none"
            aria-expanded={isOpen}
            aria-controls={`sneak-peek-${title}`}
          >
            {isOpen ? 'Hide Sneak Peek' : 'Show Sneak Peek'}
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                id={`sneak-peek-${title}`}
                className="mt-2 border-t dark:border-gray-700 pt-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {sneakPeek.type === 'image' && sneakPeek.src ? (
                  <img
                    src={sneakPeek.src}
                    alt={sneakPeek.alt || 'Sneak Peek Image'}
                    className="w-full h-auto rounded-md shadow-sm"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/path-to-fallback-image.png';
                    }}
                  />
                ) : sneakPeek.type === 'video' && sneakPeek.src ? (
                  <div className="relative" style={{ paddingTop: '56.25%' }}>
                    <iframe
                      src={sneakPeek.src}
                      title={sneakPeek.title || 'Sneak Peek Video'}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute top-0 left-0 w-full h-full rounded-md shadow-sm"
                    ></iframe>
                  </div>
                ) : sneakPeek.type === 'comingSoon' ? (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-gray-500 dark:text-gray-300">
                      {sneakPeek.message || 'Coming Soon'}
                    </p>
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
