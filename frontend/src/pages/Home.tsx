// src/components/Home.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Menu, X } from 'lucide-react';
import { Features } from './Features';
import { motion, AnimatePresence } from 'framer-motion';

export function Home() {
  const [prompt, setPrompt] = useState('');
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      navigate('/builder', { state: { prompt } });
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col font-[Inter]">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-blue-900 via-gray-900 to-blue-900 fixed w-full z-50 shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Rocket className="w-8 h-8 text-blue-500" />
            <span className="text-2xl font-extrabold text-white tracking-wide">
              Start⬆️ 
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className="text-gray-300 hover:text-blue-400 transition text-sm font-medium tracking-wide"
            >
              Features
            </a>
            <a
              href="#contact"
              className="text-gray-300 hover:text-blue-400 transition text-sm font-medium tracking-wide"
            >
              Contact
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-300 hover:text-blue-400"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-gray-900 px-4 py-6 space-y-4"
            >
              <a
                href="#features"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-gray-300 hover:text-blue-400 transition text-sm font-medium tracking-wide"
              >
                Features
              </a>
              <a
                href="#contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-gray-300 hover:text-blue-400 transition text-sm font-medium tracking-wide"
              >
                Contact
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="h-20"></div>

      {/* Hero Section */}
      <section
        className="relative flex items-center justify-center bg-cover bg-center py-32"
        style={{ backgroundImage: 'url(/path-to-your-hero-image.jpg)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-transparent to-gray-800 opacity-90"></div>
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            Your Gateway to <span className="text-blue-400">Innovation</span> & <br />
            Entrepreneurial Success
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed tracking-wide">
            Start⬆️ is the ultimate platform for students and startups to build projects,
            craft MVPs, perform market analysis, and secure funding—all in one place.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your next big idea..."
                className="w-full h-28 p-4 bg-gray-900 text-gray-100 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-500 text-sm tracking-wide"
              />
              <button
                type="submit"
                className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition tracking-wide"
              >
                Bring It to Life
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Features Section */}
      <Features />

      {/* Contact Section */}
      <section id="contact" className="bg-gray-900 text-gray-300 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6 tracking-wide">Get in Touch</h2>
          <p className="mb-8 leading-relaxed">
            Ready to revolutionize your journey? Reach out to our team, and let's make it happen.
          </p>
          <a
            href="#signup"
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition tracking-wide"
          >
            Contact Us
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-4">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm tracking-wide">&copy; {new Date().getFullYear()} Start⬆️. All rights reserved.</p>
          <div className="flex space-x-4 mt-2 md:mt-0">
            <a href="#" className="hover:text-blue-400 transition tracking-wide">
              Twitter
            </a>
            <a href="#" className="hover:text-blue-400 transition tracking-wide">
              Facebook
            </a>
            <a href="#" className="hover:text-blue-400 transition tracking-wide">
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
