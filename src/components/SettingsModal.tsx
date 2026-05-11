import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, X, Key, Save } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  onSave: (key: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, apiKey, setApiKey, onSave }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[32px] border border-gray-200 shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Settings className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Settings</h3>
                  <p className="text-xs text-gray-500">Configure your workspace</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="api-key" className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Key className="h-3 w-3" />
                    Gemini API Key
                  </label>
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-wide"
                  >
                    Get Key
                  </a>
                </div>
                <div className="relative">
                  <input 
                    id="api-key"
                    type="password"
                    placeholder="Paste your API key here..."
                    className="w-full h-12 pl-4 pr-12 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <div className="absolute right-3 top-3 text-gray-300">
                    <Key className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Your API key is stored locally in your browser and never shared with our servers.
                  If left blank, the system will attempt to use the environment's default key.
                </p>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 h-11 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => onSave(apiKey)}
                className="flex-[2] h-11 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
