import React from 'react';
import { ShieldAlert, Code } from 'lucide-react';
import { AdversarialDesign } from '../types';

interface InternalProps {
  adversarial: AdversarialDesign;
}

export const AdversarialDesignSection: React.FC<InternalProps> = ({ adversarial }) => {
  return (
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
            {adversarial?.dirtyDozen?.map((item, i) => (
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
            {adversarial?.observability?.map((item, i) => (
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
  );
};
