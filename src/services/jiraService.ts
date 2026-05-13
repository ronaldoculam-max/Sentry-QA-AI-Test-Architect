import { TestCase } from "../types";

export interface JiraConfig {
  domain: string;
  email: string;
  apiToken: string;
  projectKey: string;
}

export async function exportToJira(config: JiraConfig, testCases: TestCase[]) {
  const response = await fetch("/api/jira/export", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...config,
      testCases,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.details?.errorMessages?.[0] || errorData.error || "Failed to export to Jira");
  }

  return response.json();
}

export async function validateJiraConnection(config: JiraConfig) {
  const response = await fetch("/api/jira/validate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.details?.errorMessages?.[0] || errorData.error || "Connection failed");
  }

  return response.json();
}
