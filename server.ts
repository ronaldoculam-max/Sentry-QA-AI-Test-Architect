import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Jira Proxy
  app.post("/api/jira/export", async (req, res) => {
    const { domain, email, apiToken, projectKey, testCases } = req.body;

    if (!domain || !email || !apiToken || !projectKey || !testCases) {
      return res.status(400).json({ error: "Missing required Jira configuration or test cases." });
    }

    try {
      const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");
      const results = [];

      for (const tc of testCases) {
        // Create an issue (Task) for each test case
        // In a real scenario, you might want to use a specific Issue Type like "Test Case" if available
        const payload = {
          fields: {
            project: { key: projectKey },
            summary: `[QA] ${tc.scenario}`,
            description: {
              type: "doc",
              version: 1,
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: `Feature: ${tc.feature}` }]
                },
                {
                  type: "paragraph",
                  content: [{ type: "text", text: `Scenario Group: ${tc.scenarioGroup}` }]
                },
                {
                  type: "paragraph",
                  content: [{ type: "text", text: `Pre-conditions: ${tc.preconditions}` }]
                },
                {
                  type: "paragraph",
                  content: [{ type: "text", text: `Steps:` }]
                },
                {
                  type: "paragraph",
                  content: [{ type: "text", text: tc.steps }]
                },
                {
                  type: "paragraph",
                  content: [{ type: "text", text: `Expected Result: ${tc.expectedResult}` }]
                }
              ]
            },
            issuetype: { name: "Task" } // Default to Task, user can customize
          }
        };

        const response = await axios.post(
          `https://${domain}.atlassian.net/rest/api/3/issue`,
          payload,
          {
            headers: {
              Authorization: `Basic ${auth}`,
              "Content-Type": "application/json",
              Accept: "application/json"
            }
          }
        );
        results.push(response.data);
      }

      res.json({ success: true, issues: results });
    } catch (error: any) {
      console.error("Jira Export Error:", error.response?.data || error.message);
      res.status(error.response?.status || 500).json({ 
        error: "Failed to export to Jira", 
        details: error.response?.data || error.message 
      });
    }
  });

  // API Route: Jira Validation
  app.post("/api/jira/validate", async (req, res) => {
    const { domain, email, apiToken, projectKey } = req.body;

    if (!domain || !email || !apiToken || !projectKey) {
      return res.status(400).json({ error: "Missing required Jira configuration." });
    }

    try {
      const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");
      
      // Fetch project details to validate connection and key
      const response = await axios.get(
        `https://${domain}.atlassian.net/rest/api/3/project/${projectKey}`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            Accept: "application/json"
          }
        }
      );

      res.json({ 
        success: true, 
        project: {
          id: response.data.id,
          name: response.data.name,
          key: response.data.key
        } 
      });
    } catch (error: any) {
      console.error("Jira Validation Error:", error.response?.data || error.message);
      res.status(error.response?.status || 500).json({ 
        error: "Failed to validate Jira connection", 
        details: error.response?.data || error.message 
      });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
