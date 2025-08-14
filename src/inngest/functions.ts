import {z} from "zod";
import { inngest } from "./client";
import {   openai, createAgent, createTool, createNetwork } from "@inngest/agent-kit";
import {Sandbox} from "@e2b/code-interpreter"
import { getSandbox, lastAssistantTextMessageContent } from "./utils";
import { PROMPT } from "@/prompt";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event,step }) => {
    const sandboxId = await step.run("get-sandbox-id",async ()=>{
      const sandbox = await Sandbox.create("vibe-nextjs-test-32")
      return sandbox.sandboxId
    })
    const TerminalTool =  createTool({
          name:"terminal",
          description:"Use the terminal for running the commands",
          parameters:z.object({
            command:z.string(),
          })  ,
          handler: async({command},{step})=>{
            return await step?.run("terminal", async()=>{
              const buffers = {stdout:"",stderr:""}

              try {
                const sandbox = await getSandbox(sandboxId)
                const result = await sandbox.commands.run(command,{
                  onStdout:(data:string)=>{
                    buffers .stdout+=data
                  },
                  onStderr:(data:string)=>{
                    buffers.stderr+=data;
                  }
                })
                return result.stdout;
              } catch (e) {
                console.error(
                  `command failed:${e} \n stdout: ${buffers.stdout} \n stderr: ${buffers.stderr}  `
                );
                
                
              }
            })
          }
        })
        const createOrUpdateFiles = createTool({
          name:"createOrUpdateFiles",
          description:"Create or update files in sandbox",
          parameters:z.object({
            files:z.array(
              z.object({
                path:z.string(),
                content:z.string()
              }) 
            )
          }) ,
          handler:async (
            {files},{step,network}
          ) =>{
            const newFiles = step?.run("createOrUpdateFiles",async()=>{
              try {
                const updatedFiles = network.state.data.files||{}
                const sandbox = await getSandbox(sandboxId)
                for(const file of files){
                  await sandbox.files.write(file.path,file.content)
                  updatedFiles[file.path]= file.content 
                  
                }
                return updatedFiles;
              } catch (error) {
                return "Error: "+ error;
                
              }
            })
            if(typeof newFiles ==="object" ){
              network.state.data.files = newFiles
            }
 
          }

        })
    const readFiles = createTool({
      name:"readFiles",
      description:"Read the files in the sand box",
      parameters: z.object({
        files:z.array(z.string())
      }) ,
      handler: async ({files},{step}) => {
        return await step?.run("readFiles",async ()=>{
          try {
            const sandbox = await getSandbox(sandboxId)
            const contents = [];
            for(const file of files){
              const content = await sandbox.files.read(file);
              contents.push({path:file,content})
            }
            return JSON.stringify(contents);
            
          } catch (error) {
            return "Error: " + error
            
          }
        })
      }
    })
    const codeAgent = createAgent({
      name: "codeAgent",
      description:"an expert coding agent", 
      system: PROMPT,
      model: openai({ model: "gpt-4.1",
        defaultParameters:{
          temperature:0.1
        }
        
        }),
      tools:[TerminalTool,createOrUpdateFiles,readFiles],
      lifecycle:{
        onResponse: async ({result,network})=>{
          const lastAssitantMessageText = 
          lastAssistantTextMessageContent(result)
          if (lastAssitantMessageText && network) {
            if(lastAssitantMessageText.includes("<task_summary>")){
              network.state.data.summary = lastAssitantMessageText
            }
          }
          return result
        }
      }

    });
    const network = createNetwork({
      name:"codind-agent-network",
      agents:[codeAgent],
      maxIter:15,
      router:async({network})=>{
        const summary = network.state.data.summary
        if(summary){
          return
        }
        return codeAgent
      }
    })

    // Run the agent with an input.  This automatically uses steps
    // to call your AI model.
   const result = await network.run(event.data.value)
const sandboxUrl = await step.run("get-sandbox-url",async ()=>{
  const sandbox = await getSandbox(sandboxId)
  const host =  sandbox.getHost(3000)
  return  `https://${host}`
})
    



    return {
      url:sandboxUrl,
      title:"Fragemnet",
      files:result.state.data.files,
      summary: result.state.data.summary



    }
  }
  
);


