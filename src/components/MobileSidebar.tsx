import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React from 'react';

import { useUIStore } from '../application/store/ui-store';
import { ModelSelector } from './ModelSelector';
import { Sidebar } from './Sidebar';

interface MobileSidebarProps {
  onAddFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRepoFileClick: (path: string) => void;
  onSelectAllFiles: () => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({
  onAddFiles,
  onRepoFileClick,
  onSelectAllFiles
}) => {
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useUIStore();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md md:hidden"
            onClick={toggleMobileMenu}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-[320px] bg-white dark:bg-black h-full shadow-2xl md:hidden border-r border-gray-100 dark:border-white/10 flex flex-col"
          >
            <button 
              aria-label="Close mobile menu" 
              onClick={toggleMobileMenu} 
              className="absolute top-4 right-4 p-3 text-gray-400 hover:text-black dark:hover:text-white transition-colors z-[60] active:scale-95"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Mobile Model Selector */}
            <div className="px-8 pt-6 pb-2 shrink-0">
              <ModelSelector />
            </div>

            <div className="flex-1 overflow-hidden">
              <Sidebar
                className="h-full border-none"
                onAddFiles={onAddFiles}
                onRepoFileClick={onRepoFileClick}
                onSelectAllFiles={onSelectAllFiles}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
