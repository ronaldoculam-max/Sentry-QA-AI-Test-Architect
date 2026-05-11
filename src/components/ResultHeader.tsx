import React from 'react';
import { BarChart3, Download, ChevronDown, FileJson, FileType, FileText, FileCode, PlayCircle, Send } from 'lucide-react';
import { QAResult } from '../types';
import * as ExportService from '../services/exportService';

interface ResultHeaderProps {
  result: QAResult;
}

export const ResultHeader: React.FC<ResultHeaderProps> = ({ result }) => {
  return (
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
              onClick={() => ExportService.downloadFullReport(result)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 text-left text-sm font-medium text-gray-700 transition-colors"
            >
              <FileJson className="h-4 w-4 text-amber-500" />
              Full Data (JSON)
            </button>
            <button 
              onClick={() => ExportService.exportPDF(result)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 text-left text-sm font-medium text-gray-700 transition-colors"
            >
              <FileType className="h-4 w-4 text-red-500" />
              Strategy (PDF)
            </button>
            <button 
              onClick={() => ExportService.exportDOCX(result)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 text-left text-sm font-medium text-gray-700 transition-colors"
            >
              <FileText className="h-4 w-4 text-blue-500" />
              Formal Doc (DOCX)
            </button>
            <button 
              onClick={() => ExportService.exportMarkdown(result)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 text-left text-sm font-medium text-gray-700 transition-colors"
            >
              <FileCode className="h-4 w-4 text-indigo-500" />
              Markdown (MD)
            </button>
            <button 
              onClick={() => ExportService.exportPlaywright(result)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 text-left text-sm font-medium text-gray-700 transition-colors"
            >
              <PlayCircle className="h-4 w-4 text-purple-500" />
              Playwright (.ts)
            </button>
            <div className="h-px bg-gray-100 my-1 mx-2" />
            <button 
              onClick={() => ExportService.exportCSV(result)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 text-left text-sm font-medium text-gray-700 transition-colors"
            >
              <Send className="h-4 w-4 text-green-500" />
              Test Cases (CSV)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
