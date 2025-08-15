import { projectsRouter } from '@/modules/projects/server/procedures';
import {  createTRPCRouter } from '../init';
export const appRouter = createTRPCRouter({
  projects:projectsRouter
});
// export type definition of API
export type AppRouter = typeof appRouter;
