import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { StrategicAnalysis } from '../types';

interface InternalProps {
  analysis: StrategicAnalysis;
}

export const StrategicAnalysisSection: React.FC<InternalProps> = ({ analysis }) => {
  return (
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
                {analysis.testPlan?.scope?.in?.map((item, i) => (
                  <span key={i} className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded uppercase border border-green-100">{item}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 mb-1 tracking-wide">SCOPE OUT</p>
              <div className="flex flex-wrap gap-2">
                {analysis.testPlan?.scope?.out?.map((item, i) => (
                  <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase border border-gray-200">{item}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 mb-1 tracking-wide uppercase">Definition of Done</p>
              <p className="text-sm text-gray-600 leading-relaxed italic border-l-2 border-blue-500 pl-3">{analysis.testPlan?.definitionOfDone || 'Not specified'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-bold text-orange-600 uppercase mb-4">Technical Risks</h3>
          <div className="space-y-4">
            {analysis.testPlan?.risks?.map((risk, i) => (
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
          {Object.entries(analysis.strategy || {}).map(([key, val]) => (
            <div key={key}>
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wide">{key}</h4>
              <p className="text-sm text-gray-600">{val || 'Strategy not defined'}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
