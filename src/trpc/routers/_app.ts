import { projectsRouter } from "@/modules/projects/server/procedures";
import { createTRPCRouter } from "../init";
import { messageRouter } from "@/modules/messages/server/procedures";
import { subscriptionRouter } from "@/modules/subscription/server/procedures";
import { usageRouter } from "@/modules/usage/server/procedure";
export const appRouter = createTRPCRouter({
  projects: projectsRouter,
  messages: messageRouter,
  subscriptions: subscriptionRouter,
  usage: usageRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
