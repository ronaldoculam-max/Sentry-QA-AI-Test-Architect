import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { AlertCircle } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#eff6ff',
    primaryTextColor: '#1e40af',
    primaryBorderColor: '#bfdbfe',
    lineColor: '#60a5fa',
    secondaryColor: '#f8fafc',
    tertiaryColor: '#ffffff',
    fontSize: '14px',
    fontFamily: 'Inter',
  },
  securityLevel: 'loose',
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
  },
});

interface MermaidProps {
  chart: string;
}

const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderChart = async () => {
      if (ref.current && chart) {
        try {
          setError(null);
          // Reset container
          ref.current.innerHTML = `<div class="mermaid-inner">${chart}</div>`;
          const element = ref.current.querySelector('.mermaid-inner') as HTMLElement;
          if (element) {
            await mermaid.run({
              nodes: [element],
            });
          }
        } catch (err) {
          console.error('Mermaid render error:', err);
          setError(chart);
        }
      }
    };

    renderChart();
  }, [chart]);

  if (error) {
    return (
      <div className="mermaid-container overflow-auto bg-white p-6 rounded-3xl border border-gray-100 shadow-inner min-h-[200px] flex items-center justify-center">
        <div className="p-6 text-center space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-gray-900 text-sm">Flowchart Visualization Failed</p>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">The generated logic diagram has syntax errors. You can still view the test cases and strategy above.</p>
          </div>
          <button 
            onClick={() => navigator.clipboard.writeText(error)}
            className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-wider"
          >
            Copy Diagram Code
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="mermaid-container overflow-auto bg-white p-6 rounded-3xl border border-gray-100 shadow-inner min-h-[200px] flex items-center justify-center" 
      ref={ref}
    />
  );
};

export default Mermaid;
