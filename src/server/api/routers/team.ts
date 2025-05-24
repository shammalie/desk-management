import { publicProcedure, createTRPCRouter } from "../trpc";
import * as teamService from "../../service/team.service";
import { z } from "zod";

export const teamRouter = createTRPCRouter({
  getTeamCount: publicProcedure.query(async () => {
    return teamService.getTeamCount();
  }),
  getTeamsWithRelations: publicProcedure
    .input(z.object({ name: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return teamService.getTeamsWithRelations(input?.name);
    }),
  getTeamHierarchy: publicProcedure.query(async () => {
    return teamService.getTeamHierarchy();
  }),
  getTeamFullHierarchy: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ input }) => {
      return teamService.getTeamFullHierarchy(input.name);
    }),
  getTeamsPaginated: publicProcedure
    .input(
      z.object({
        name: z.string().optional(),
        page: z.number(),
        pageSize: z.number(),
      }),
    )
    .query(async ({ input }) => {
      return teamService.getTeamsPaginated(
        input.name,
        input.page,
        input.pageSize,
      );
    }),
});
