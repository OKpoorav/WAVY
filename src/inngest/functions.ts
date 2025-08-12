import { success } from "zod";
import { inngest } from "./client";
import {   gemini, createAgent } from "@inngest/agent-kit";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event }) => {
    const codeAgent = createAgent({
      name: "codeAgent",
      system: "You are an expert next.js developer.  You write readable and maintainable code you write simple next.js write simple react and next.js snippets.",
      model: gemini({ model: "gemini-2.0-flash",  }),
    });

    // Run the agent with an input.  This automatically uses steps
    // to call your AI model.
   const { output } = await codeAgent.run(
  `Write the following snippet: ${event.data.value}`,
);
    
    return {output}
  }
);


