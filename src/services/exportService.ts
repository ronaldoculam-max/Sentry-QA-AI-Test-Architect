import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, WidthType } from 'docx';
import { QAResult, TestCase, Source } from '../types';

export const downloadFullReport = (result: QAResult) => {
  const dataStr = JSON.stringify(result, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sentryqa_report_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportCSV = (result: QAResult) => {
  const csv = [
    ['TC ID', 'Feature', 'Scenario Group', 'Scenario', 'Pre-conditions', 'Steps', 'Gherkin', 'Expected Result', 'AC Reference'],
    ...result.testCases.map(tc => [
      `"${tc.id || ''}"`, 
      `"${tc.feature || 'General'}"`, 
      `"${tc.scenarioGroup || 'Default Flow'}"`, 
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

export const groupTestCases = (testCases: TestCase[]) => {
  if (!testCases || !Array.isArray(testCases)) return {};
  return testCases.reduce((acc, tc) => {
    const feature = tc.feature || 'General';
    const scenario = tc.scenarioGroup || 'Default Flow';
    
    if (!acc[feature]) acc[feature] = {};
    if (!acc[feature][scenario]) acc[feature][scenario] = [];
    
    acc[feature][scenario].push(tc);
    return acc;
  }, {} as Record<string, Record<string, TestCase[]>>);
};

export const exportMarkdown = (result: QAResult) => {
  let md = `# SentryQA Validation Strategy Report\n\n`;
  md += `**Generated on:** ${new Date().toLocaleString()}\n\n`;

  if (result.sources && result.sources.length > 0) {
    md += `## Sources & References\n`;
    result.sources.forEach(source => {
      md += `### ${source.name} (${source.type})\n`;
      md += `- **Relevance:** ${source.relevance}\n`;
      md += `- **Extracted Info:** ${source.description}\n\n`;
    });
    md += `\n`;
  }
  
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

export const exportPDF = (result: QAResult) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Title
  doc.setFontSize(22);
  doc.setTextColor(30, 58, 138); // blue-900
  doc.text("SentryQA Validation Strategy", 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
  
  let currentY = 40;

  if (result.sources && result.sources.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text("Sources & References", 14, currentY);
    currentY += 8;
    
    const sourceData = result.sources.map(s => [s.name, s.type, s.relevance, s.description, s.link || '']);
    autoTable(doc, {
      startY: currentY,
      head: [['Source', 'Type', 'Relevance', 'Extracted Description', 'Reference/Link']],
      body: sourceData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 },
      didDrawPage: (data) => {
        currentY = data.cursor?.y || 0;
      }
    });
    currentY += 10;
  }

  // Phase 1
  doc.setFontSize(16);
  doc.setTextColor(30, 58, 138);
  doc.text("Phase 1: Strategic Analysis", 14, currentY);
  currentY += 10;
  
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text("Agile Test Plan", 14, currentY);
  currentY += 8;
  
  doc.setFontSize(10);
  const scopeInText = `Scope In: ${result.analysis.testPlan?.scope?.in?.join(', ') || 'N/A'}`;
  const splitScopeIn = doc.splitTextToSize(scopeInText, pageWidth - 28);
  doc.text(splitScopeIn, 14, currentY);
  currentY += splitScopeIn.length * 5 + 2;

  const scopeOutText = `Scope Out: ${result.analysis.testPlan?.scope?.out?.join(', ') || 'N/A'}`;
  const splitScopeOut = doc.splitTextToSize(scopeOutText, pageWidth - 28);
  doc.text(splitScopeOut, 14, currentY);
  currentY += splitScopeOut.length * 5 + 5;
  
  // Technical Risks
  doc.setFontSize(12);
  doc.text("Technical Risks", 14, currentY);
  currentY += 5;
  const riskData = (result.analysis.testPlan?.risks || []).map(r => [r.title, r.description]);
  autoTable(doc, {
    startY: currentY,
    head: [['Risk', 'Description']],
    body: riskData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    didDrawPage: (data) => {
      currentY = data.cursor?.y || 0;
    }
  });
  currentY += 15;

  // Phase 2: Adversarial Design
  if (currentY > 230) {
    doc.addPage();
    currentY = 22;
  }
  doc.setFontSize(16);
  doc.setTextColor(30, 58, 138);
  doc.text("Phase 2: Adversarial Design", 14, currentY);
  currentY += 10;

  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text("The Dirty Dozen", 14, currentY);
  currentY += 5;

  const dirtyDozenData = (result.adversarial?.dirtyDozen || []).flatMap(item => 
    item.cases.map((c, i) => [i === 0 ? item.type : '', c])
  );

  autoTable(doc, {
    startY: currentY,
    head: [['Category', 'Test Case']],
    body: dirtyDozenData,
    theme: 'grid',
    headStyles: { fillColor: [220, 38, 38] }, // red-600
    didDrawPage: (data) => {
      currentY = data.cursor?.y || 0;
    }
  });
  currentY += 15;

  // Phase 3 - Test Cases (on new page)
  doc.addPage();
  doc.setFontSize(16);
  doc.setTextColor(30, 58, 138);
  doc.text("Phase 3: Formal Documentation", 14, 22);
  currentY = 32;

  const grouped = groupTestCases(result.testCases);
  Object.entries(grouped).forEach(([feature, scenarios]) => {
    Object.entries(scenarios).forEach(([scenario, tcs]) => {
      if (currentY > 250) {
        doc.addPage();
        currentY = 22;
      }

      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`Feature: ${feature} | Scenario: ${scenario}`, 14, currentY);
      currentY += 5;

      const tcRows = tcs.map(tc => [
        tc.id,
        tc.steps,
        tc.expectedResult
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['ID', 'Steps', 'Expected Result']],
        body: tcRows,
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 60 },
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          currentY = (data.cursor?.y || 0) + 15;
        }
      });
    });
  });

  doc.save(`sentryqa_report_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportDOCX = async (result: QAResult) => {
  const sections = [];

  // Title Section
  sections.push({
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
      ...(result.sources ? [
        new Paragraph({ text: "Sources & References", heading: HeadingLevel.HEADING_2 }),
        ...result.sources.map(s => new Paragraph({ 
          children: [
            new TextRun({ text: `${s.name} (${s.type}) - Relevance: ${s.relevance}`, bold: true }),
            ...(s.link ? [new TextRun({ text: `\nReference: ${s.link}`, italics: true })] : []),
            new TextRun({ text: `\n${s.description}` })
          ],
          bullet: { level: 0 }
        })),
        new Paragraph({ text: "" }),
      ] : []),
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
        text: "Phase 2: Adversarial Design",
        heading: HeadingLevel.HEADING_1,
      }),
      ... (result.adversarial?.dirtyDozen || []).flatMap(item => [
        new Paragraph({ text: item.type, heading: HeadingLevel.HEADING_3 }),
        ...item.cases.map(c => new Paragraph({ text: `• ${c}`, bullet: { level: 0 } }))
      ]),
      new Paragraph({ text: "" }),
      new Paragraph({
        text: "Phase 3: Formal Documentation",
        heading: HeadingLevel.HEADING_1,
      }),
    ],
  });

  const tableRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "ID", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Scenario", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Expected Result", bold: true })] })] }),
      ],
    }),
  ];

  result.testCases.forEach(tc => {
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: tc.id })] }),
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

export const exportSourcesCSV = (sources: Source[]) => {
  if (!sources || sources.length === 0) return;
  const csv = [
    ['Source Name', 'Type', 'Relevance', 'Description', 'Link/Ref'],
    ...sources.map(s => [
      `"${s.name || ''}"`,
      `"${s.type || ''}"`,
      `"${s.relevance || ''}"`,
      `"${s.description || ''}"`,
      `"${s.link || ''}"`
    ])
  ].map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sentryqa_sources_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportPlaywright = (result: QAResult) => {
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
