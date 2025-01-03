// src/components/Features.tsx
import React from 'react';
import { Sparkles, BarChart3, Users } from 'lucide-react';
import { FeatureCard } from './FeatureCard';
import { motion } from 'framer-motion';

export function Features() {
  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered MVP Generation',
      description:
        'Transform your ideas into working prototypes in minutes with our advanced AI technology.',
      sneakPeek: {
        type: 'video',
        src: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Replace with actual video URL
        title: 'AI-Powered MVP Generation Demo',
      },
    },
    {
      icon: BarChart3,
      title: 'Market Analysis',
      description:
        'Get deep insights into market opportunities and competitor landscapes.',
      comingSoon: true,
      sneakPeek: {
        type: 'comingSoon',
        message: 'Stay tuned! Market Analysis features are on the way.',
      },
    },
    {
      icon: Users,
      title: 'Community & Funding',
      description:
        'Connect with like-minded entrepreneurs and potential investors.',
      comingSoon: true,
      sneakPeek: {
        type: 'comingSoon',
        message: 'Community & Funding features will launch soon!',
      },
    },
  ];

  return (
    <section id="features" className="bg-gray-100 dark:bg-gray-900 py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            Our Features
          </h2>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
            Discover the powerful tools that make Website Builder AI the ultimate platform for your website needs.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              comingSoon={feature.comingSoon}
              sneakPeek={feature.sneakPeek}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
