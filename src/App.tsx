import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Shield,
  ShieldAlert, 
  LayoutDashboard, 
  ArrowRight,
  Code,
  Eye,
  GitBranch,
  BarChart3,
  Accessibility,
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
  Settings,
  Key,
  Save
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, HeadingLevel, WidthType } from 'docx';
import { Header } from './components/Header';
import { analyzeRequirements } from './services/qaService';
import { QAResult, Attachment } from './types';
import Mermaid from './components/Mermaid';
import { cn } from './lib/utils';

export default function App() {
  const [requirements, setRequirements] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<QAResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('sentryqa_gemini_api_key');
    if (savedKey) {
      setGeminiApiKey(savedKey);
    }
  }, []);

  const saveApiKey = (key: string) => {
    localStorage.setItem('sentryqa_gemini_api_key', key);
    setGeminiApiKey(key);
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

  const downloadFullReport = () => {
    if (!result) return;
    const dataStr = JSON.stringify(result, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentryqa_report_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    if (!result) return;
    const csv = [
      ['TC ID', 'Feature', 'Scenario Group', 'Category', 'Scenario', 'Pre-conditions', 'Steps', 'Gherkin', 'Expected Result', 'AC Reference'],
      ...result.testCases.map(tc => [
        `"${tc.id || ''}"`, 
        `"${tc.feature || 'General'}"`, 
        `"${tc.scenarioGroup || 'Default Flow'}"`, 
        `"${tc.category || 'Functional'}"`, 
        `"${tc.scenario || ''}"`, 
        `"${tc.preconditions || ''}"`, 
        `"${tc.steps || ''}"`, 
        `"${tc.gherkin || ''}"`, 
        `"${tc.expectedResult || ''}"`, 
        `"${tc.acReference || ''}"`
      ])
    ].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentryqa_test_cases_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPlaywright = () => {
    if (!result) return;
    
    let script = `import { test, expect } from '@playwright/test';\n\n`;
    script += `/**\n * SentryQA Automated Playwright Script\n`;
    script += ` * Generated on: ${new Date().toLocaleString()}\n */\n\n`;

    const grouped = groupTestCases(result.testCases);

    Object.entries(grouped).forEach(([feature, scenarios]) => {
      script += `test.describe('${feature}', () => {\n\n`;
      
      Object.entries(scenarios).forEach(([scenarioName, tcs]) => {
        tcs.forEach(tc => {
          script += `  /**\n   * ${tc.id}: ${tc.scenario}\n`;
          if (tc.gherkin) script += `   * Gherkin: ${tc.gherkin.replace(/\n/g, '\n   * ')}\n`;
          script += `   * Expected: ${tc.expectedResult}\n   */\n`;
          script += `  test('${tc.id} - ${tc.scenario.replace(/'/g, "\\'")}', async ({ page }) => {\n`;
          script += `    // Pre-condition: ${tc.preconditions || 'N/A'}\n`;
          
          const steps = tc.steps.split('\n').filter(s => s.trim());
          steps.forEach(step => {
            script += `    // Step: ${step.trim()}\n`;
          });
          
          script += `    // Expect: ${tc.expectedResult}\n`;
          script += `    // await expect(page.locator('body')).toBeVisible(); // Placeholder validation\n`;
          script += `  });\n\n`;
        });
      });

      script += `});\n\n`;
    });

    const blob = new Blob([script], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentryqa_playwright_${new Date().toISOString().split('T')[0]}.spec.ts`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const groupTestCases = (testCases: QAResult['testCases']) => {
    if (!testCases || !Array.isArray(testCases)) return {};
    return testCases.reduce((acc, tc) => {
      const feature = tc.feature || 'General';
      const scenario = tc.scenarioGroup || 'Default Flow';
      
      if (!acc[feature]) acc[feature] = {};
      if (!acc[feature][scenario]) acc[feature][scenario] = [];
      
      acc[feature][scenario].push(tc);
      return acc;
    }, {} as Record<string, Record<string, typeof testCases>>);
  };

  const exportMarkdown = () => {
    if (!result) return;
    let md = `# SentryQA Validation Strategy Report\n\n`;
    md += `**Generated on:** ${new Date().toLocaleString()}\n\n`;
    
    md += `## Phase 1: Strategic Analysis\n\n`;
    md += `### Agile Test Plan\n`;
    md += `- **Scope In:** ${result.analysis.testPlan?.scope?.in?.join(', ') || 'N/A'}\n`;
    md += `- **Scope Out:** ${result.analysis.testPlan?.scope?.out?.join(', ') || 'N/A'}\n`;
    md += `- **Definition of Done:** ${result.analysis.testPlan?.definitionOfDone || 'N/A'}\n\n`;
    
    md += `### Technical Risks\n`;
    result.analysis.testPlan?.risks?.forEach(risk => {
      md += `- **${risk.title}:** ${risk.description}\n`;
    });
    md += `\n`;
    
    md += `### Validation Strategy\n`;
    Object.entries(result.analysis.strategy || {}).forEach(([key, val]) => {
      md += `- **${key.toUpperCase()}:** ${val}\n`;
    });
    md += `\n`;
    
    md += `## Phase 2: Adversarial Design\n\n`;
    md += `### The Dirty Dozen\n`;
    result.adversarial?.dirtyDozen?.forEach(item => {
      md += `#### ${item.type}\n`;
      item.cases?.forEach(c => md += `- ${c}\n`);
      md += `\n`;
    });
    
    md += `## Phase 3: Formal Documentation\n\n`;
    const grouped = groupTestCases(result.testCases);
    Object.entries(grouped).forEach(([feature, scenarios]) => {
      md += `### Feature: ${feature}\n\n`;
      Object.entries(scenarios).forEach(([scenario, tcs]) => {
        md += `#### Scenario: ${scenario}\n\n`;
        tcs.forEach(tc => {
          md += `**Test Case ${tc.id}: ${tc.scenario}**\n`;
          md += `- **Category:** ${tc.category}\n`;
          md += `- **Pre-conditions:** ${tc.preconditions || 'None'}\n`;
          if (tc.gherkin) md += `- **Gherkin:**\n  \`\`\`gherkin\n  ${tc.gherkin.replace(/\n/g, '\n  ')}\n  \`\`\`\n`;
          md += `- **Steps:**\n  ${tc.steps.replace(/\n/g, '\n  ')}\n`;
          md += `- **Expected Result:** ${tc.expectedResult}\n`;
          md += `- **AC Reference:** ${tc.acReference}\n\n`;
        });
      });
    });
    
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentryqa_report_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(20);
    doc.text("SentryQA Validation Strategy", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    // Phase 1
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text("Phase 1: Strategic Analysis", 14, 45);
    
    doc.setFontSize(12);
    doc.text("Agile Test Plan", 14, 55);
    doc.setFontSize(10);
    doc.text(`Scope In: ${result.analysis.testPlan?.scope?.in?.join(', ') || 'N/A'}`, 14, 62, { maxWidth: pageWidth - 28 });
    doc.text(`Scope Out: ${result.analysis.testPlan?.scope?.out?.join(', ') || 'N/A'}`, 14, 70, { maxWidth: pageWidth - 28 });
    
    // Technical Risks
    doc.setFontSize(12);
    doc.text("Technical Risks", 14, 85);
    const riskData = (result.analysis.testPlan?.risks || []).map(r => [r.title, r.description]);
    autoTable(doc, {
      startY: 90,
      head: [['Risk', 'Description']],
      body: riskData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }
    });

    // Phase 3 - Test Cases (on new page)
    doc.addPage();
    doc.setFontSize(16);
    doc.text("Phase 3: Formal Documentation", 14, 22);
    
    let currentY = 32;
    const grouped = groupTestCases(result.testCases);
    Object.entries(grouped).forEach(([feature, scenarios]) => {
      doc.setFontSize(14);
      doc.setTextColor(50, 50, 50);
      doc.text(`Feature: ${feature}`, 14, currentY);
      currentY += 10;

      Object.entries(scenarios).forEach(([scenario, tcs]) => {
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text(`Scenario: ${scenario}`, 14, currentY);
        currentY += 5;

        const tcRows = tcs.map(tc => [
          tc.id,
          tc.category,
          tc.scenario,
          tc.gherkin || tc.expectedResult
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [['ID', 'Category', 'Scenario', 'Gherkin / Result']],
          body: tcRows,
          styles: { fontSize: 8 },
          margin: { left: 14, right: 14 },
          didDrawPage: (data) => {
            currentY = data.cursor?.y || 0;
          }
        });
        currentY += 15;
        
        if (currentY > 250) {
          doc.addPage();
          currentY = 22;
        }
      });
    });

    doc.save(`sentryqa_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportDOCX = async () => {
    if (!result) return;
    
    const sections = [];

    // Title Section
    sections.push({
      properties: {},
      children: [
        new Paragraph({
          text: "SentryQA Validation Strategy Report",
          heading: HeadingLevel.TITLE,
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Generated on: ${new Date().toLocaleString()}`,
              italics: true,
            }),
          ],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          text: "Phase 1: Strategic Analysis",
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          text: "Agile Test Plan",
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Scope In: ", bold: true }),
            new TextRun(result.analysis.testPlan?.scope?.in?.join(', ') || 'N/A'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Scope Out: ", bold: true }),
            new TextRun(result.analysis.testPlan?.scope?.out?.join(', ') || 'N/A'),
          ],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          text: "Phase 3: Formal Documentation",
          heading: HeadingLevel.HEADING_1,
        }),
      ],
    });

    // Test Cases Table
    const tableRows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "ID", bold: true, font: "Courier New" })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Feature", bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Category", bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Scenario", bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Expected Result", bold: true })] })] }),
        ],
      }),
    ];

    result.testCases.forEach(tc => {
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: tc.id, font: "Courier New" })] })] }),
            new TableCell({ children: [new Paragraph({ text: tc.feature || 'General' })] }),
            new TableCell({ children: [new Paragraph({ text: tc.category })] }),
            new TableCell({ children: [new Paragraph({ text: tc.scenario })] }),
            new TableCell({ children: [new Paragraph({ text: tc.expectedResult })] }),
          ],
        })
      );
    });

    const doc = new Document({
      sections: [
        {
          children: [
            ...sections[0].children,
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: tableRows,
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentryqa_report_${new Date().toISOString().split('T')[0]}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAnalyze = async () => {
    if (!requirements.trim() && attachments.length === 0) return;
    
    setIsAnalyzing(true);
    setError(null);
    try {
      const data = await analyzeRequirements(requirements, attachments, geminiApiKey);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
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
            </div>

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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
                        <BarChart3 className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Validation Strategy</h2>
                        <p className="text-sm text-gray-500">Decomposed into 3 strategic phases</p>
                      </div>
                    </div>
                    
                    <div className="relative group">
                      <button 
                        className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all shadow-sm font-bold text-sm"
                      >
                        <Download className="h-5 w-5 text-blue-600" />
                        Export Report
                        <ChevronDown className="h-4 w-4 text-gray-400 group-hover:rotate-180 transition-transform" />
                      </button>
                      
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-gray-200 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                        <div className="p-2 space-y-1">
                          <button 
                            onClick={downloadFullReport}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 text-left text-sm font-medium text-gray-700 transition-colors"
                          >
                            <FileJson className="h-4 w-4 text-amber-500" />
                            Full Data (JSON)
                          </button>
                          <button 
                            onClick={exportPDF}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 text-left text-sm font-medium text-gray-700 transition-colors"
                          >
                            <FileType className="h-4 w-4 text-red-500" />
                            Strategy (PDF)
                          </button>
                          <button 
                            onClick={exportDOCX}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 text-left text-sm font-medium text-gray-700 transition-colors"
                          >
                            <FileText className="h-4 w-4 text-blue-500" />
                            Formal Doc (DOCX)
                          </button>
                          <button 
                            onClick={exportMarkdown}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 text-left text-sm font-medium text-gray-700 transition-colors"
                          >
                            <FileCode className="h-4 w-4 text-indigo-500" />
                            Markdown (MD)
                          </button>
                          <button 
                            onClick={exportPlaywright}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 text-left text-sm font-medium text-gray-700 transition-colors"
                          >
                            <PlayCircle className="h-4 w-4 text-purple-500" />
                            Playwright (.ts)
                          </button>
                          <div className="h-px bg-gray-100 my-1 mx-2" />
                          <button 
                            onClick={exportCSV}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 text-left text-sm font-medium text-gray-700 transition-colors"
                          >
                            <Send className="h-4 w-4 text-green-500" />
                            Test Cases (CSV)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phase 1: Strategic Analysis */}
                  <section id="analysis" className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                      <h2 className="text-2xl font-bold">Phase 1: Strategic Analysis</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-bold text-blue-600 uppercase mb-4">Agile Test Plan</h3>
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs font-bold text-gray-400 mb-1 tracking-wide">SCOPE IN</p>
                            <div className="flex flex-wrap gap-2">
                              {result.analysis.testPlan?.scope?.in?.map((item, i) => (
                                <span key={i} className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded uppercase border border-green-100">{item}</span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-400 mb-1 tracking-wide">SCOPE OUT</p>
                            <div className="flex flex-wrap gap-2">
                              {result.analysis.testPlan?.scope?.out?.map((item, i) => (
                                <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase border border-gray-200">{item}</span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-400 mb-1 tracking-wide uppercase">Definition of Done</p>
                            <p className="text-sm text-gray-600 leading-relaxed italic border-l-2 border-blue-500 pl-3">{result.analysis.testPlan?.definitionOfDone || 'Not specified'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-bold text-orange-600 uppercase mb-4">Technical Risks</h3>
                        <div className="space-y-4">
                          {result.analysis.testPlan?.risks?.map((risk, i) => (
                            <div key={i} className="flex gap-3">
                              <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
                              <div>
                                <p className="text-sm font-bold text-gray-900">{risk.title || 'Risk'}</p>
                                <p className="text-xs text-gray-500">{risk.description || 'No details'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                      <h3 className="text-sm font-bold text-purple-600 uppercase mb-4">Validation Strategy</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Object.entries(result.analysis.strategy || {}).map(([key, val]) => (
                          <div key={key}>
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wide">{key}</h4>
                            <p className="text-sm text-gray-600">{val || 'Strategy not defined'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

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
                  <section id="adversarial" className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldAlert className="h-6 w-6 text-red-600" />
                      <h2 className="text-2xl font-bold">Phase 2: Adversarial Design</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="bg-gray-900 text-white p-6 rounded-3xl overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                          <ShieldAlert className="h-24 w-24" />
                        </div>
                        <h3 className="text-sm font-bold text-red-400 uppercase mb-6 tracking-widest relative z-10">The Dirty Dozen: Payload-First TDD</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 relative z-10">
                          {result.adversarial?.dirtyDozen?.map((item, i) => (
                            <div key={i} className="space-y-2">
                              <p className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <span className="h-1 w-4 bg-red-500 rounded-full" />
                                {item.type || 'Test Category'}
                              </p>
                              <ul className="space-y-1">
                                {item.cases?.map((c, j) => (
                                  <li key={j} className="text-xs text-gray-400 flex gap-2">
                                    <span className="text-red-500">•</span> {c}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest">Observability Requirements</h3>
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase">White-Box Validation</span>
                        </div>
                        <div className="space-y-4">
                          {result.adversarial?.observability?.map((item, i) => (
                            <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">UI Interaction</p>
                                <p className="text-xs font-medium text-gray-700">{item.uiTest || 'Test Scenario'}</p>
                              </div>
                              <div className="border-l border-gray-200 pl-4">
                                <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">System State Verification</p>
                                <p className="text-xs font-medium text-blue-900 flex items-center gap-2">
                                  <Code className="h-3 w-3" />
                                  {item.validation || 'No validation steps defined'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

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
                              onClick={downloadFullReport}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 text-left text-xs font-medium text-gray-700 transition-colors"
                            >
                              <FileJson className="h-4 w-4 text-amber-500" />
                              Full Data (JSON)
                            </button>
                            <button 
                              onClick={exportPDF}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 text-left text-xs font-medium text-gray-700 transition-colors"
                            >
                              <FileType className="h-4 w-4 text-red-500" />
                              Strategy (PDF)
                            </button>
                            <button 
                              onClick={exportDOCX}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 text-left text-xs font-medium text-gray-700 transition-colors"
                            >
                              <FileText className="h-4 w-4 text-blue-500" />
                              Formal Doc (DOCX)
                            </button>
                            <button 
                              onClick={exportMarkdown}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 text-left text-xs font-medium text-gray-700 transition-colors"
                            >
                              <FileCode className="h-4 w-4 text-indigo-500" />
                              Markdown (MD)
                            </button>
                            <button 
                              onClick={exportPlaywright}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 text-left text-xs font-medium text-gray-700 transition-colors"
                            >
                              <PlayCircle className="h-4 w-4 text-purple-500" />
                              Playwright (.ts)
                            </button>
                            <div className="h-px bg-gray-100 my-1 mx-2" />
                            <button 
                              onClick={exportCSV}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 text-left text-xs font-medium text-gray-700 transition-colors"
                            >
                              <Send className="h-4 w-4 text-green-500" />
                              Test Cases (CSV)
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      {Object.entries(groupTestCases(result.testCases)).map(([featureName, scenarios]) => (
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
                                      <th className="px-6 py-3 w-28">Category</th>
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
                                        <td className="px-6 py-4">
                                          <span className={cn(
                                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                            tc.category.toLowerCase() === 'negative' ? "bg-red-50 text-red-600" :
                                            tc.category.toLowerCase() === 'edge' ? "bg-amber-50 text-amber-600" :
                                            "bg-blue-50 text-blue-600"
                                          )}>
                                            {tc.category}
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

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
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
                  onClick={() => setIsSettingsOpen(false)}
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
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
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
                  onClick={() => setIsSettingsOpen(false)}
                  className="flex-1 h-11 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => saveApiKey(geminiApiKey)}
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
    </div>
  );
}
