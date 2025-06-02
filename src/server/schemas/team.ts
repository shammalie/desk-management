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

// Define the TeamTree type explicitly to avoid recursive inference issues
export interface TeamTree {
  id: number;
  name: string;
  parent: { id: number; name: string } | null;
  children: TeamTree[];
  parentCount: number;
  childCount: number;
}

// Define the TeamHierarchyNode type explicitly
export interface TeamHierarchyNode {
  id: number;
  name: string;
  parentId: number | null;
  children: TeamHierarchyNode[];
}

// Schema for basic team data from database
export const TeamBasicSchema = z.object({
  id: z.number(),
  name: z.string(),
  parentId: z.number().nullable(),
});

export type TeamBasic = z.infer<typeof TeamBasicSchema>;

// Schema for team with parent relation
export const TeamWithParentSchema = z.object({
  id: z.number(),
  name: z.string(),
  parentId: z.number().nullable(),
  parent: z
    .object({
      id: z.number(),
      name: z.string(),
    })
    .nullable(),
});

export type TeamWithParent = z.infer<typeof TeamWithParentSchema>;

// Schema for team with children relation
export const TeamWithChildrenSchema = z.object({
  id: z.number(),
  name: z.string(),
  parentId: z.number().nullable(),
  children: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
    }),
  ),
});

export type TeamWithChildren = z.infer<typeof TeamWithChildrenSchema>;

// Schema for team with both parent and children relations
export const TeamWithFullRelationsSchema = z.object({
  id: z.number(),
  name: z.string(),
  parentId: z.number().nullable(),
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
});

export type TeamWithFullRelations = z.infer<typeof TeamWithFullRelationsSchema>;
