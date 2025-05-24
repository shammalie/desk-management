import { z } from "zod";

export const TeamWithRelationsSchema = z.object({
  id: z.number(),
  name: z.string(),
  parent: z
    .object({
      id: z.number(),
      name: z.string(),
    })
    .nullable(),
  children: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
    }),
  ),
  parentCount: z.number(),
  childCount: z.number(),
});

export type TeamWithRelations = z.infer<typeof TeamWithRelationsSchema>;

// Recursive schema for full team tree
export const TeamTreeSchema: z.ZodType<{
  id: number;
  name: string;
  parent: null | { id: number; name: string };
  children: TeamTree[]; // children will be typed recursively below
}> = z.lazy(() =>
  z.object({
    id: z.number(),
    name: z.string(),
    parent: z.object({ id: z.number(), name: z.string() }).nullable(),
    children: z.array(TeamTreeSchema),
  }),
);

export type TeamTree = z.infer<typeof TeamTreeSchema>;
