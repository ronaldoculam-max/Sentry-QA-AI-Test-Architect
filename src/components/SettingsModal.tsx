import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, X, Key, Save, Info, Terminal, Briefcase, Globe, Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { JiraConfig } from '../types';
import { validateJiraConnection } from '../services/jiraService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  envOverride: string;
  setEnvOverride: (env: string) => void;
  jiraConfig: JiraConfig;
  setJiraConfig: (config: JiraConfig) => void;
  onSave: (key: string, env: string, jira: JiraConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  apiKey, 
  setApiKey, 
  envOverride, 
  setEnvOverride, 
  jiraConfig,
  setJiraConfig,
  onSave 
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'jira'>('general');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestConnection = async () => {
    if (!jiraConfig.domain || !jiraConfig.email || !jiraConfig.apiToken || !jiraConfig.projectKey) {
      setValidationResult({ success: false, message: "Please fill in all Jira fields." });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);
    try {
      const result = await validateJiraConnection(jiraConfig);
      setValidationResult({ 
        success: true, 
        message: `Connected! Found project: ${result.project.name} (${result.project.key})` 
      });
    } catch (err) {
      setValidationResult({ 
        success: false, 
        message: err instanceof Error ? err.message : "Connection failed" 
      });
    } finally {
      setIsValidating(false);
    }
  };

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
            className="relative w-full max-w-lg bg-white rounded-[32px] border border-gray-200 shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
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

              <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${activeTab === 'general' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  General API
                </button>
                <button
                  onClick={() => setActiveTab('jira')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${activeTab === 'jira' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Jira Connection
                </button>
              </div>
            </div>

            <div className="p-6 h-[400px] overflow-y-auto custom-scrollbar">
              {activeTab === 'general' ? (
                <div className="space-y-6">
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
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
                      <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-blue-900 uppercase">Pro Tip: Automatic Key</p>
                        <p className="text-[10px] text-blue-700 leading-relaxed">
                          In AI Studio, you don't actually need to paste a key here! We'll automatically use the key from your **User Secrets** if this field is left blank. 
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <label htmlFor="custom-env" className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Terminal className="h-3 w-3" />
                        Manual .env Override
                      </label>
                    </div>
                    <div className="relative">
                      <textarea 
                        id="custom-env"
                        className="w-full h-32 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-[11px] font-mono whitespace-pre"
                        placeholder="KEY=VALUE&#10;ANOTHER_VAR=FOO"
                        value={envOverride || ''}
                        onChange={(e) => setEnvOverride?.(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                    <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-700 leading-relaxed">
                      Connect to Jira to export test cases directly as Tasks. You can get an API Token from your 
                      <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener noreferrer" className="font-bold underline ml-1">Atlassian account settings</a>.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Globe className="h-3 w-3" />
                        Jira Subdomain
                      </label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="text"
                          placeholder="company"
                          className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                          value={jiraConfig.domain}
                          onChange={(e) => setJiraConfig({...jiraConfig, domain: e.target.value})}
                        />
                        <span className="text-[10px] text-gray-400 font-mono">.atlassian.net</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Briefcase className="h-3 w-3" />
                        Project Key
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g., QA"
                        className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-xs uppercase"
                        value={jiraConfig.projectKey}
                        onChange={(e) => setJiraConfig({...jiraConfig, projectKey: e.target.value.toUpperCase()})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      Atlassian Email
                    </label>
                    <input 
                      type="email"
                      placeholder="email@example.com"
                      className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                      value={jiraConfig.email}
                      onChange={(e) => setJiraConfig({...jiraConfig, email: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Key className="h-3 w-3" />
                      Jira API Token
                    </label>
                    <input 
                      type="password"
                      placeholder="Paste token here..."
                      className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono"
                      value={jiraConfig.apiToken}
                      onChange={(e) => setJiraConfig({...jiraConfig, apiToken: e.target.value})}
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleTestConnection}
                      disabled={isValidating}
                      className="w-full h-10 rounded-xl border border-blue-200 bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isValidating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Globe className="h-4 w-4" />
                      )}
                      Test Connection
                    </button>
                    
                    {validationResult && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mt-3 p-3 rounded-xl flex items-center gap-2 text-[10px] font-medium ${
                          validationResult.success 
                            ? "bg-green-50 text-green-700 border border-green-100" 
                            : "bg-red-50 text-red-700 border border-red-100"
                        }`}
                      >
                        {validationResult.success ? (
                          <CheckCircle2 className="h-3 w-3 shrink-0" />
                        ) : (
                          <AlertCircle className="h-3 w-3 shrink-0" />
                        )}
                        {validationResult.message}
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 h-11 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => onSave(apiKey, envOverride, jiraConfig)}
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
