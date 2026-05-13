import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Loader2, 
  FileText, 
  ShieldAlert, 
  Eye,
  GitBranch,
  Paperclip,
  X,
  UploadCloud,
  File,
  Download,
  Terminal,
  FileJson,
  FileCode,
  FileType,
  ChevronDown,
  PlayCircle,
  Info,
  AlertTriangle,
  Accessibility,
  LayoutDashboard,
  ArrowRight,
  BarChart3,
  Shield,
  Briefcase,
  CheckCircle2
} from 'lucide-react';
import { Header } from './components/Header';
import { ResultHeader } from './components/ResultHeader';
import { StrategicAnalysisSection } from './components/StrategicAnalysisSection';
import { AdversarialDesignSection } from './components/AdversarialDesignSection';
import { SourcesSection } from './components/SourcesSection';
import { SettingsModal } from './components/SettingsModal';
import { analyzeRequirements } from './services/qaService';
import { QAResult, Attachment, JiraConfig } from './types';
import Mermaid from './components/Mermaid';
import { cn } from './lib/utils';
import * as ExportService from './services/exportService';
import { exportToJira } from './services/jiraService';

export default function App() {
  const [requirements, setRequirements] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<QAResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [envOverride, setEnvOverride] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [jiraConfig, setJiraConfig] = useState<JiraConfig>({
    domain: '',
    email: '',
    apiToken: '',
    projectKey: ''
  });
  const [isExportingToJira, setIsExportingToJira] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('sentryqa_gemini_api_key');
    const savedEnv = localStorage.getItem('sentryqa_custom_env');
    const savedJira = localStorage.getItem('sentryqa_jira_config');
    
    if (savedKey) setGeminiApiKey(savedKey);
    if (savedEnv) setEnvOverride(savedEnv);
    if (savedJira) {
      try {
        setJiraConfig(JSON.parse(savedJira));
      } catch (e) {
        console.error("Failed to parse saved Jira config");
      }
    }
  }, []);

  const saveSettings = (key: string, env: string, jira: JiraConfig) => {
    localStorage.setItem('sentryqa_gemini_api_key', key);
    localStorage.setItem('sentryqa_custom_env', env);
    localStorage.setItem('sentryqa_jira_config', JSON.stringify(jira));
    setGeminiApiKey(key);
    setEnvOverride(env);
    setJiraConfig(jira);
    setIsSettingsOpen(false);
  };

  const SUPPORTED_MIME_TYPES = [
    'application/pdf',
    'text/plain',
    'text/csv',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/heic',
    'image/heif',
    'audio/wav',
    'audio/mpeg',
    'audio/mp3',
    'video/mp4',
    'video/mpeg',
    'video/quicktime'
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let files: FileList | null = null;
    if ('files' in e.target && e.target.files) {
      files = e.target.files;
    } else if ('dataTransfer' in e) {
      files = e.dataTransfer.files;
    }

    if (!files) return;

    const newAttachments: Attachment[] = [];
    const unsupportedFiles: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Basic validation
      const isSupported = SUPPORTED_MIME_TYPES.some(type => {
        if (type.includes('*')) {
          return file.type.startsWith(type.replace('*', ''));
        }
        return file.type === type;
      }) || file.name.endsWith('.ts') || file.name.endsWith('.tsx') || file.name.endsWith('.js') || file.name.endsWith('.md');

      if (!isSupported && file.type !== "") {
        unsupportedFiles.push(file.name);
        continue;
      }

      const base64 = await fileToBase64(file);
      newAttachments.push({
        name: file.name,
        mimeType: file.type || 'text/plain', // Default to text/plain for code files without mime type
        data: base64
      });
    }

    if (unsupportedFiles.length > 0) {
      setError(`Unsupported file types: ${unsupportedFiles.join(', ')}. Please use PDF, Images, or Text files.`);
    }

    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (!requirements.trim() && attachments.length === 0) return;
    
    setIsAnalyzing(true);
    setError(null);
    try {
      const data = await analyzeRequirements(requirements, attachments, geminiApiKey, envOverride);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleJiraExport = async () => {
    if (!result || !jiraConfig.domain || !jiraConfig.apiToken || !jiraConfig.projectKey) {
      setError("Please configure Jira settings in the Gear menu first.");
      setIsSettingsOpen(true);
      return;
    }

    setIsExportingToJira(true);
    setError(null);
    setSuccess(null);
    try {
      await exportToJira(jiraConfig, result.testCases);
      setSuccess(`Successfully exported ${result.testCases.length} test cases to Jira project ${jiraConfig.projectKey}!`);
      // Clear success after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export to Jira');
    } finally {
      setIsExportingToJira(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Input Panel */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 h-fit">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold">Input</h2>
                </div>
                <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded text-[10px] font-bold text-blue-600 uppercase">
                  <UploadCloud className="h-3 w-3" />
                  Multi-Modal
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <label htmlFor="requirements-input" className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wide">Context & Requirements</label>
                  <textarea
                    id="requirements-input"
                    className="w-full h-48 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm font-sans resize-none"
                    placeholder="Describe functionality, user stories, or specific ACs..."
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                  />
                </div>

                <div 
                  className={cn(
                    "relative group cursor-pointer border-2 border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center gap-2",
                    isDragging ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-400 hover:bg-gray-50"
                  )}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragOverCapture={() => setIsDragging(true)}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileChange(e); }}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <input 
                    type="file" 
                    id="file-upload" 
                    multiple 
                    accept=".pdf,.txt,.csv,.png,.jpg,.jpeg,.webp,.ts,.tsx,.js,.md,.mp4"
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                  <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Paperclip className="h-5 w-5" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-900 leading-tight">Attach Files</p>
                    <p className="text-[10px] text-gray-500 mt-1">Upload Mockups, PDFs, or specs</p>
                  </div>
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Staged Attachments ({attachments.length})</p>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                      {attachments.map((file, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100 group">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-7 w-7 rounded bg-white flex items-center justify-center shrink-0 border border-gray-200">
                              <File className="h-4 w-4 text-gray-400" />
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-medium text-gray-900 truncate">{file.name}</p>
                              <p className="text-[9px] text-gray-400 uppercase">{file.mimeType.split('/')[1] || 'binary'}</p>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeAttachment(i); }}
                            className="p-1 hover:bg-red-50 hover:text-red-600 text-gray-400 rounded transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                id="analyze-button"
                disabled={isAnalyzing || (!requirements.trim() && attachments.length === 0)}
                onClick={handleAnalyze}
                className={cn(
                  "w-full mt-6 h-12 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shrink-0",
                  isAnalyzing 
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-95"
                )}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Crunching Data...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Generate Strategy
                  </>
                )}
              </button>

              <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-[10px] text-blue-700 leading-relaxed">
                  <strong>Note:</strong> A default API key is configured in the environment. Adding a custom key in settings (gear icon) is optional.
                </p>
              </div>
            </div>

            {success && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm flex items-start gap-3"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <p>{success}</p>
              </motion.div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-3"
              >
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}

            <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl shadow-blue-900/10">
              <h3 className="text-sm font-bold uppercase tracking-wider text-blue-300 mb-4">Core Principles</h3>
              <ul className="space-y-4">
                {[
                  { icon: ShieldAlert, label: "Adversarial Thinking", desc: "Building the 'Dirty Dozen' test suite." },
                  { icon: Eye, label: "Observability first", desc: "Validating state, logs, and system transitions." },
                  { icon: Accessibility, label: "Inclusive Design", desc: "Native WCAG 2.1 compliance audits." }
                ].map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="text-xs text-blue-200/70">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-8 space-y-8">
            <AnimatePresence mode="wait">
              {!result && !isAnalyzing ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-gray-200 rounded-3xl"
                >
                  <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <LayoutDashboard className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Requirements Loaded</h3>
                  <p className="text-gray-500 max-w-sm">
                    Enter your requirements on the left to generate a strategic QA validation plan.
                  </p>
                </motion.div>
              ) : result ? (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-8 pb-12"
                >
                  {/* Result Header */}
                  <ResultHeader result={result} />

                  {/* Phase 1: Strategic Analysis */}
                  <StrategicAnalysisSection analysis={result.analysis} />

                  {/* Identified Sources */}
                  <SourcesSection sources={result.sources} />

                  {/* Flowchart */}
                  {result.mermaidFlowchart && (
                    <section className="space-y-4">
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-6 w-6 text-indigo-500" />
                        <h2 className="text-xl font-bold">Happy Path Logic</h2>
                      </div>
                      <Mermaid chart={result.mermaidFlowchart} />
                    </section>
                  )}

                  {/* Phase 2: Adversarial Design */}
                  <AdversarialDesignSection adversarial={result.adversarial} />

                  {/* Phase 3: Formal Documentation */}
                  <section id="test-cases" className="space-y-6">
                    <div className="flex items-center justify-between sticky top-0 z-20 bg-gray-50 py-4 -mx-4 px-4 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <Terminal className="h-6 w-6 text-gray-700" />
                        <h2 className="text-2xl font-bold">Phase 3: Formal Documentation</h2>
                      </div>
                      <div className="relative group">
                        <button 
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                        >
                          <Download className="h-4 w-4" />
                          Export Report
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-gray-200 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                          <div className="p-2 space-y-1 font-sans">
                            <button 
                              onClick={() => ExportService.downloadFullReport(result)}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 text-left text-xs font-medium text-gray-700 transition-colors"
                            >
                              <FileJson className="h-4 w-4 text-amber-500" />
                              Full Data (JSON)
                            </button>
                            <button 
                              onClick={() => ExportService.exportPDF(result)}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 text-left text-xs font-medium text-gray-700 transition-colors"
                            >
                              <FileType className="h-4 w-4 text-red-500" />
                              Strategy (PDF)
                            </button>
                            <button 
                              onClick={() => ExportService.exportDOCX(result)}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 text-left text-xs font-medium text-gray-700 transition-colors"
                            >
                              <FileText className="h-4 w-4 text-blue-500" />
                              Formal Doc (DOCX)
                            </button>
                            <button 
                              onClick={() => ExportService.exportMarkdown(result)}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 text-left text-xs font-medium text-gray-700 transition-colors"
                            >
                              <FileCode className="h-4 w-4 text-indigo-500" />
                              Markdown (MD)
                            </button>
                            <button 
                              onClick={() => ExportService.exportPlaywright(result)}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 text-left text-xs font-medium text-gray-700 transition-colors"
                            >
                              <PlayCircle className="h-4 w-4 text-purple-500" />
                              Playwright (.ts)
                            </button>
                            <div className="h-px bg-gray-100 my-1 mx-2" />
                            <button 
                              onClick={() => ExportService.exportCSV(result)}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 text-left text-xs font-medium text-gray-700 transition-colors"
                            >
                              <Send className="h-4 w-4 text-green-500" />
                              Test Cases (CSV)
                            </button>
                            <div className="h-px bg-gray-100 my-1 mx-2" />
                            <button 
                              onClick={handleJiraExport}
                              disabled={isExportingToJira}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 text-left text-xs font-medium text-gray-700 transition-colors disabled:opacity-50"
                            >
                              {isExportingToJira ? (
                                <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                              ) : (
                                <Briefcase className="h-4 w-4 text-blue-800" />
                              )}
                              Export to Jira
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      {Object.entries(ExportService.groupTestCases(result.testCases)).map(([featureName, scenarios]) => (
                        <div key={featureName} className="space-y-4">
                          <div className="flex items-center gap-3">
                            <span className="h-px flex-1 bg-gray-200" />
                            <h3 className="text-lg font-bold text-gray-900 bg-gray-100 px-4 py-1 rounded-full border border-gray-200">
                              Feature: {featureName}
                            </h3>
                            <span className="h-px flex-1 bg-gray-200" />
                          </div>

                          {Object.entries(scenarios).map(([scenarioTitle, tcs]) => (
                            <div key={scenarioTitle} className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                              <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center justify-between">
                                <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                  <ArrowRight className="h-4 w-4 text-blue-500" />
                                  Scenario: {scenarioTitle}
                                </h4>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white px-2 py-1 rounded border border-gray-100">
                                  {tcs.length} Cases
                                </span>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                  <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-200 uppercase font-bold text-[9px] text-gray-400 tracking-widest">
                                      <th className="px-6 py-3 w-32">ID</th>
                                      <th className="px-6 py-3">Scenario / steps</th>
                                      <th className="px-6 py-3">Expected Result</th>
                                      <th className="px-6 py-3 w-20">Ref</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 font-mono text-[13px]">
                                    {tcs.map((tc) => (
                                      <tr key={tc.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4">
                                          <span className={cn(
                                            "font-bold",
                                            tc.id.endsWith('-S') ? "text-red-500" : "text-blue-600"
                                          )}>
                                            {tc.id}
                                          </span>
                                        </td>
                                        <td className="px-6 py-4 max-w-sm font-sans">
                                          <div>
                                            <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{tc.scenario || 'No scenario described'}</p>
                                            <div className="mt-3 space-y-3">
                                              {tc.preconditions && (
                                                <div className="space-y-1">
                                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Pre-conditions:</p>
                                                  <p className="text-[11px] text-gray-500 italic bg-gray-50/50 p-2 rounded-lg border border-gray-100/50">{tc.preconditions}</p>
                                                </div>
                                              )}
                                              {tc.gherkin && (
                                                <div className="space-y-1">
                                                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tight">Gherkin:</p>
                                                  <pre className="text-[10px] text-indigo-600 bg-indigo-50/30 p-2 rounded-lg border border-indigo-100/50 overflow-x-auto">
                                                    {tc.gherkin}
                                                  </pre>
                                                </div>
                                              )}
                                              <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Steps:</p>
                                                <p className="text-[11px] text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100 whitespace-pre-wrap">{tc.steps || 'No steps provided'}</p>
                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 font-sans text-xs text-gray-600">
                                          <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-green-600 uppercase tracking-tight">Expected Result:</p>
                                            <p className="leading-relaxed">{tc.expectedResult || 'No result defined'}</p>
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 font-sans text-[10px] font-bold text-gray-400">{tc.acReference}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Future Roadmap Section */}
                  <section className="bg-white p-8 rounded-[40px] border border-gray-200 mt-12 overflow-hidden relative">
                    <div className="absolute top-0 right-0 -m-8 opacity-10 blur-3xl bg-blue-600 h-64 w-64 rounded-full" />
                    
                    <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                      <GitBranch className="h-6 w-6 text-blue-600" />
                      Future Roadmap Suggestions
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {[
                        { 
                          icon: PlayCircle, 
                          title: "Playwright Automation", 
                          desc: "Implemented: Export executable scripts directly from test cases." 
                        },
                        { 
                          icon: LayoutDashboard, 
                          title: "Visual QA Comparison", 
                          desc: "Compare Mockups vs Implementation for direct diff reviews." 
                        },
                        { 
                          icon: GitBranch, 
                          title: "Logic Dead-End Detection", 
                          desc: "AI identifies orphans or dead-end flows in requirement graphs." 
                        },
                        { 
                          icon: BarChart3, 
                          title: "Traceability Dashboard", 
                          desc: "Real-time coverage metrics for all mapped Acceptance Criteria." 
                        }
                      ].map((item, i) => (
                        <div key={i} className="group p-4 rounded-3xl bg-gray-50 border border-gray-100 hover:bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-600/5 transition-all">
                          <div className="h-10 w-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                            <item.icon className="h-5 w-5" />
                          </div>
                          <h3 className="text-sm font-bold text-gray-900 mb-2">{item.title}</h3>
                          <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                          <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                            Upcoming <ArrowRight className="h-3 w-3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white py-16" id="app-footer">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gray-900 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold tracking-tight">SentryQA</span>
              </div>
              <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                Transforming complex requirements into bulletproof validation strategies through AI-driven adversarial analysis.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Methodology</h4>
              <ul className="space-y-2 text-sm text-gray-600 font-medium">
                <li className="hover:text-blue-600 transition-colors cursor-pointer">The Dirty Dozen</li>
                <li className="hover:text-blue-600 transition-colors cursor-pointer">White-Box Observability</li>
                <li className="hover:text-blue-600 transition-colors cursor-pointer">Strategic Analysis</li>
                <li className="hover:text-blue-600 transition-colors cursor-pointer">WCAG 2.1 Compliance</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ecosystem</h4>
              <ul className="space-y-2 text-sm text-gray-600 font-medium">
                <li className="hover:text-blue-600 transition-colors cursor-pointer">Roadmap</li>
                <li className="hover:text-blue-600 transition-colors cursor-pointer">API Integration</li>
                <li className="hover:text-blue-600 transition-colors cursor-pointer">Security Audits</li>
                <li className="hover:text-blue-600 transition-colors cursor-pointer">Enterprise SLA</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6 text-xs font-bold text-gray-400 uppercase tracking-widest">
              <span className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                System Operational
              </span>
              <span>v1.2.0-Production</span>
            </div>
            <div className="text-xs text-gray-400 font-medium">
              © 2026 SentryQA Architecture. All validation models reserved.
            </div>
          </div>
        </div>
      </footer>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        apiKey={geminiApiKey}
        setApiKey={setGeminiApiKey}
        envOverride={envOverride}
        setEnvOverride={setEnvOverride}
        jiraConfig={jiraConfig}
        setJiraConfig={setJiraConfig}
        onSave={saveSettings}
      />
    </div>
  );
}
