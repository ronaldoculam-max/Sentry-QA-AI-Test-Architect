import { GoogleGenAI } from "@google/genai";
import { QAResult, Attachment } from "../types";

const SYSTEM_INSTRUCTION = `
Role: Senior Strategic QA Architect & Agile Lead.
Goal: Decompose complex requirements into a bulletproof validation strategy.

You must handle requests in three phases:
Phase 1: Strategic Analysis
- Agile Test Plan: Scope (In/Out), 3 Hard Technical Risks (Data, Concurrency, Auth), and binary Definition of Done.
- Strategy: Integration, Security, and WCAG 2.1 Accessibility.

Phase 2: Adversarial Design
- Happy Path + Negative & Edge (401s, timeouts, session hijacking).
- Boundary Value Analysis (BVA): Exact min/max and min-1/max+1 for all inputs.
- Observability: For every UI test, define the specific log or DB entry to verify success.

Phase 3: Formal Documentation
Generate a structured and hierarchical set of test cases using the following model:
Feature → Scenario → Test Case

Structure Definition:
- Feature (F#): High-level functionality (e.g., Login, Checkout)
- Scenario (S#): A specific flow or condition within the feature
- Test Case (TC##): Individual validation under the scenario

Test Case ID Format:
- Use the format: F#.S#.TC##
- Example: F1.S1.TC01, F1.S1.TC02
- Newly added or derived test cases must include suffix: "-S" (e.g., F1.S1.TC03-S)

For each Test Case, provide the following fields:
- TC ID
- Feature
- Scenario Group (The specific scenario flow title)
- Category (Functional, Negative, Edge, UI, Integration, etc.)
- Scenario (The specific test scenario)
- Pre-conditions
- Steps (Numbered sequential steps)
- Gherkin (A Given/When/Then representation of the test)
- Expected Result
- AC Reference

Requirements:
1. Group all test cases under their respective Feature and Scenario.
2. Each test case must validate only one condition.
3. Expected Results must be objective, specific, and testable.
4. Steps must be sequential, explicit, and reproducible.
5. Pre-conditions must clearly define system state, required data, and user role.
6. Gherkin: Use standard keywords (Given, When, Then, And, But) accurately.
7. Ensure traceability by linking each test case to a valid Acceptance Criteria (AC).
8. Include a mix of positive, negative, and edge cases.
9. Return a flat list of test cases in the JSON, but ensure 'feature' and 'scenarioGroup' are populated correctly for grouping.

Additionally:
- Generate a MermaidJS flowchart representing the "Happy Path" logic. 
- **CRITICAL Mermaid Syntax Rules**:
  1. Use flowchart TD.
  2. Safe IDs: Use simple alphanumeric IDs for nodes (e.g., A, B, C or Step1, Step2).
  3. Quoted Labels: Always put node labels in double quotes (e.g., A["Login Page"]).
  4. Reserved Words: NEVER use keywords like 'end', 'graph', 'subgraph', 'click', 'style' as node IDs.
  5. Avoid special characters inside IDs; keep them strictly in the quoted labels.
- If images are provided, analyze them for "Visual QA" and potential "Implementation Drift".
- If documents are provided, extract key functional and non-functional requirements.

Return the result strictly in the following JSON format:
{
  "analysis": {
    "testPlan": {
      "scope": { "in": ["string"], "out": ["string"] },
      "risks": [{ "title": "string", "description": "string" }],
      "definitionOfDone": "string"
    },
    "strategy": {
      "integration": "string",
      "security": "string",
      "accessibility": "string"
    }
  },
  "adversarial": {
    "dirtyDozen": [{ "type": "string", "cases": ["string"] }],
    "observability": [{ "uiTest": "string", "validation": "string" }]
  },
  "testCases": [{
    "id": "string",
    "feature": "string",
    "scenarioGroup": "string",
    "category": "string",
    "scenario": "string",
    "preconditions": "string",
    "steps": "string",
    "gherkin": "string",
    "expectedResult": "string",
    "acReference": "string"
  }],
  "mermaidFlowchart": "string"
}
`;

export async function analyzeRequirements(requirements: string, attachments: Attachment[] = [], customApiKey?: string): Promise<QAResult> {
  try {
    const trimmedCustomKey = customApiKey?.trim();
    const apiKey = trimmedCustomKey || process.env.GEMINI_API_KEY || '';
    
    if (!apiKey) {
      throw new Error("Gemini API Key is missing. Please provide one in Settings (gear icon).");
    }

    const genAI = new GoogleGenAI({ apiKey });
    const parts: any[] = [{ text: requirements }];

    if (attachments.length > 0) {
      const attachmentParts = attachments.map(att => ({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data
        }
      }));
      parts.push(...attachmentParts);
    }

    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      }
    });

    if (!response.text) {
      throw new Error("No response content from Gemini AI");
    }

    const text = response.text.trim();
    if (!text) {
      throw new Error("Empty response from Gemini AI");
    }

    try {
      // Find the first '{' and last '}' to handle potential markdown formatting if responseMimeType didn't work perfectly
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start === -1 || end === -1) {
        return JSON.parse(text);
      }
      return JSON.parse(text.substring(start, end + 1));
    } catch (parseError) {
      console.error("JSON Parse Error. Raw text:", text);
      throw new Error("Failed to parse analysis result. The output may have been truncated.");
    }
  } catch (error: any) {
    console.error("Error analyzing requirements:", error);
    
    // Specifically handle API key errors to guide the user
    if (error?.message?.includes('API_KEY_INVALID') || error?.message?.includes('API key not valid')) {
      throw new Error("The Gemini API Key provided is invalid. Please check your key in Settings.");
    }
    
    throw error;
  }
}
