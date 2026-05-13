export interface TestCase {
  id: string;
  feature: string;
  scenarioGroup: string;
  scenario: string;
  preconditions: string;
  steps: string;
  gherkin?: string;
  expectedResult: string;
  acReference: string;
}

export interface Attachment {
  name: string;
  mimeType: string;
  data: string; // base64
}

export interface StrategicAnalysis {
  testPlan: {
    scope: {
      in: string[];
      out: string[];
    };
    risks: {
      title: string;
      description: string;
    }[];
    definitionOfDone: string;
  };
  strategy: {
    integration: string;
    security: string;
    accessibility: string;
  };
}

export interface AdversarialDesign {
  dirtyDozen: {
    type: string;
    cases: string[];
  }[];
  observability: {
    uiTest: string;
    validation: string;
  }[];
}

export interface Source {
  name: string;
  type: string;
  description: string;
  relevance: 'High' | 'Medium' | 'Low';
  link?: string;
}

export interface QAResult {
  analysis: StrategicAnalysis;
  adversarial: AdversarialDesign;
  testCases: TestCase[];
  mermaidFlowchart?: string;
  sources?: Source[];
}

export interface JiraConfig {
  domain: string;
  email: string;
  apiToken: string;
  projectKey: string;
}
