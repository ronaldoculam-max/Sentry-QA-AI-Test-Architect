import React from 'react';
import { motion } from 'motion/react';
import { Info, CheckCircle2, Download, FileText, ChevronRight, ExternalLink, Link as LinkIcon } from 'lucide-react';
import { Source } from '../types';
import { exportSourcesCSV } from '../services/exportService';

interface SourcesSectionProps {
  sources?: Source[];
}

export const SourcesSection: React.FC<SourcesSectionProps> = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  const isUrl = (str?: string) => {
    if (!str) return false;
    try {
      new URL(str);
      return true;
    } catch (_) {
      return str.startsWith('http');
    }
  };

  return (
    <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="h-6 w-6 text-blue-500" />
          <h2 className="text-xl font-bold">Analyzed Sources & References</h2>
        </div>
        <button 
          onClick={() => exportSourcesCSV(sources)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-all text-xs font-bold active:scale-95"
        >
          <Download className="h-3.5 w-3.5" />
          Export Sources (CSV)
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.map((source, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group bg-white rounded-3xl border border-gray-100 p-5 shadow-sm hover:border-blue-200 hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="absolute top-0 right-0 p-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  source.relevance === 'High' ? 'bg-green-50 text-green-600' :
                  source.relevance === 'Medium' ? 'bg-amber-50 text-amber-600' :
                  'bg-gray-50 text-gray-400'
                }`}>
                  {source.relevance} Relevance
                </span>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 shrink-0 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="space-y-1 pr-12">
                  <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{source.name}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{source.type}</p>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-2xl bg-gray-50 border border-gray-100 group-hover:bg-blue-50/50 group-hover:border-blue-100 transition-colors">
                <p className="text-xs text-gray-600 leading-relaxed italic line-clamp-3">
                  "{source.description}"
                </p>
              </div>

              {source.link && (
                <div className="mt-3">
                  {isUrl(source.link) ? (
                    <a 
                      href={source.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-[10px] font-bold hover:bg-blue-100 transition-colors border border-blue-100"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Original Source
                    </a>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 text-[10px] font-bold border border-gray-200">
                      <LinkIcon className="h-3 w-3" />
                      Ref: {source.link}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="h-3 w-3" />
              Verified for Test Coverage
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </div>
        <p className="text-[10px] text-gray-500 leading-relaxed">
          The AI has cross-referenced these <span className="font-bold text-gray-900">{sources.length} sources</span> to ensure that all functional requirements, visual designs, and technical specifications are covered in the generated test strategy.
        </p>
      </div>
    </section>
  );
};
