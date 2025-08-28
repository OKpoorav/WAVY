import { z } from "zod";
import { inngest } from "./client";
import {
  openai,
  createAgent,
  createTool,
  createNetwork,
  type Tool,
  type Message,
  createState,
} from "@inngest/agent-kit";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";
import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from "@/prompt";
import prisma from "@/lib/db";

interface AgentState {
  summary: string;
  files: { [path: string]: string };
}

export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("vibe-nextjs-test-32");
      await sandbox.setTimeout(60_000 * 10 * 3);
      return sandbox.sandboxId;
    });
    const previousMessages = await step.run(
      "get-previous-messages",
      async () => {
        const formattedMessages: Message[] = [];
        const messages = await prisma.message.findMany({
          where: {
            projectId: event.data.projectId,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        });
        for (const message of messages) {
          formattedMessages.push({
            type: "text",
            role: message.role === "ASSITANT" ? "assistant" : "user",
            content: message.content,
          });
        }
        return formattedMessages.reverse();
      },
    );
    const state = createState<AgentState>(
      {
        summary: "",
        files: {},
      },
      {
        messages: previousMessages,
      },
    );
    const TerminalTool = createTool({
      name: "terminal",
      description: "Use the terminal for running the commands",
      parameters: z.object({
        command: z.string(),
      }),
      handler: async ({ command }, { step }) => {
        return await step?.run("terminal", async () => {
          const buffers = { stdout: "", stderr: "" };

          try {
            const sandbox = await getSandbox(sandboxId);
            const result = await sandbox.commands.run(command, {
              onStdout: (data: string) => {
                buffers.stdout += data;
              },
              onStderr: (data: string) => {
                buffers.stderr += data;
              },
            });
            return result.stdout;
          } catch (e) {
            console.error(
              `command failed:${e} \n stdout: ${buffers.stdout} \n stderr: ${buffers.stderr}  `,
            );
          }
        });
      },
    });
    const createOrUpdateFiles = createTool({
      name: "createOrUpdateFiles",
      description: "Create or update files in sandbox",
      parameters: z.object({
        files: z.array(
          z.object({
            path: z.string(),
            content: z.string(),
          }),
        ),
      }),
      handler: async (
        { files },
        { step, network }: Tool.Options<AgentState>,
      ) => {
        const newFiles = await step?.run("createOrUpdateFiles", async () => {
          try {
            const updatedFiles = network.state.data.files || {};
            const sandbox = await getSandbox(sandboxId);
            for (const file of files) {
              await sandbox.files.write(file.path, file.content);
              updatedFiles[file.path] = file.content;
            }
            return updatedFiles;
          } catch (error) {
            return "Error: " + error;
          }
        });
        if (typeof newFiles === "object") {
          network.state.data.files = newFiles;
        }
      },
    });
    const readFiles = createTool({
      name: "readFiles",
      description: "Read the files in the sand box",
      parameters: z.object({
        files: z.array(z.string()),
      }),
      handler: async ({ files }, { step }) => {
        return await step?.run("readFiles", async () => {
          try {
            const sandbox = await getSandbox(sandboxId);
            const contents = [];
            for (const file of files) {
              const content = await sandbox.files.read(file);
              contents.push({ path: file, content });
            }
            return JSON.stringify(contents);
          } catch (error) {
            return "Error: " + error;
          }
        });
      },
    });
    const codeAgent = createAgent<AgentState>({
      name: "codeAgent",
      description: "an expert coding agent",
      system: PROMPT,
      model: openai({
        model: "gpt-4.1",
        defaultParameters: {
          temperature: 0.1,
        },
      }),
      tools: [TerminalTool, createOrUpdateFiles, readFiles],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssitantMessageText =
            lastAssistantTextMessageContent(result);
          if (lastAssitantMessageText && network) {
            if (lastAssitantMessageText.includes("<task_summary>")) {
              network.state.data.summary = lastAssitantMessageText;
            }
          }
          return result;
        },
      },
    });
    const network = createNetwork<AgentState>({
      name: "codind-agent-network",
      agents: [codeAgent],
      maxIter: 15,
      defaultState: state,
      router: async ({ network }) => {
        const summary = network.state.data.summary;
        if (summary) {
          return;
        }
        return codeAgent;
      },
    });

    const result = await network.run(event.data.value, { state });
    const fragmentTitleGenerator = createAgent({
      name: "fragmentTitleGenerator",
      description: "a fragmentTitleGenerator",
      system: FRAGMENT_TITLE_PROMPT,
      model: openai({
        model: "gpt-4o",
      }),
    });
    const ResponseGenerator = createAgent({
      name: "ResponseGenerator",
      description: "a ResponseGenerator",
      system: RESPONSE_PROMPT,
      model: openai({
        model: "gpt-4o",
      }),
    });
    const { output: FragmentTitleOutput } = await fragmentTitleGenerator.run(
      result.state.data.summary,
    );
    const { output: ResponseOutput } = await ResponseGenerator.run(
      result.state.data.summary,
    );

    const generateFragmentTitle = () => {
      if (FragmentTitleOutput[0].type !== "text") {
        return "Fragment";
      }
      if (Array.isArray(FragmentTitleOutput[0].content)) {
        return FragmentTitleOutput[0].content.join("");
      }
      return FragmentTitleOutput[0].content;
    };
    const generateResponse = () => {
      if (ResponseOutput[0].type !== "text") {
        return "Here you go";
      }
      if (Array.isArray(ResponseOutput[0].content)) {
        return ResponseOutput[0].content.join("");
      }
      return ResponseOutput[0].content;
    };
    const isError =
      !result.state.data.summary ||
      Object.keys(result.state.data.files || {}).length === 0;

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    await step.run("save-result", async () => {
      if (isError) {
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Something went wrong please try again later",
            role: "ASSITANT",
            type: "ERROR",
          },
        });
      }
      return await prisma.message.create({
        data: {
          projectId: event.data.projectId,
          content: generateResponse(),
          role: "ASSITANT",
          type: "RESULT",
          fragment: {
            create: {
              sandboxUrl: sandboxUrl,
              title: generateFragmentTitle(),
              files: result.state.data.files,
            },
          },
        },
      });
    });
    return {
      url: sandboxUrl,
      title: "Fragemnet",
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  },
);
