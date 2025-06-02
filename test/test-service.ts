import { db } from "~/server/db";
import {
  createTeamTreeMaterializedViewTest,
  refreshTeamTreeMaterializedViewTest,
  teamTreeMaterializedViewExistsTest,
  getTeamTreeFromMaterializedViewTest,
} from "./test-data-access";

// Type definitions for test service functions
interface TeamHierarchyNode {
  id: number;
  name: string;
  parentId: number | null;
  children: TeamHierarchyNode[];
}

interface TeamFullHierarchyNode {
  id: number;
  name: string;
  parent: TeamFullHierarchyNode | null;
  children: TeamFullHierarchyNode[];
  parentCount: number;
  childCount: number;
}

// Type for materialized view results
interface MaterializedViewResult {
  id: number;
  name: string;
  parentId: number | null;
  root_id: number;
  root_name: string;
  depth: number;
  path: number[];
  path_names: string;
  total_descendant_count: number | bigint;
  is_root: boolean;
  path_length: number;
  is_leaf: boolean;
  team_size_category: string;
}

// Type for Prisma Team with nested relations
interface TeamWithChildren {
  id: number;
  name: string;
  parentId: number | null;
  children?: TeamWithChildren[];
}

// Type for basic team data
interface BasicTeamData {
  id: number;
  name: string;
  parentId: number | null;
}

/**
 * Test-specific service functions using Prisma ORM
 */

/**
 * Initialize the team materialized view
 */
export async function initializeTeamMaterializedViewTest() {
  await createTeamTreeMaterializedViewTest();
}

/**
 * Update the team materialized view
 */
export async function updateTeamMaterializedViewTest() {
  const exists = await teamTreeMaterializedViewExistsTest();
  if (exists) {
    await refreshTeamTreeMaterializedViewTest();
  } else {
    await createTeamTreeMaterializedViewTest();
  }
}

/**
 * Get team hierarchy using materialized view
 */
export async function getTeamHierarchyFastTest(): Promise<TeamHierarchyNode[]> {
  // Get all teams from materialized view
  const teams =
    (await getTeamTreeFromMaterializedViewTest()) as MaterializedViewResult[];

  // Build team map for efficient lookups
  const teamMap = new Map<number, TeamHierarchyNode>();

  // Initialize all teams
  teams.forEach((team) => {
    teamMap.set(team.id, {
      id: team.id,
      name: team.name,
      parentId: team.parentId,
      children: [],
    });
  });

  // Build hierarchy
  const rootTeams: TeamHierarchyNode[] = [];

  teams.forEach((team) => {
    const teamNode = teamMap.get(team.id)!;

    if (team.parentId === null) {
      rootTeams.push(teamNode);
    } else {
      const parent = teamMap.get(team.parentId);
      if (parent) {
        parent.children.push(teamNode);
      }
    }
  });

  return rootTeams;
}

/**
 * Get team hierarchy using traditional Prisma ORM approach
 */
export async function getTeamHierarchyTest(): Promise<TeamHierarchyNode[]> {
  // Get all teams with their relationships
  const allTeams = await db.team.findMany({
    include: {
      children: {
        include: {
          children: {
            include: {
              children: {
                include: {
                  children: true, // Support up to 5 levels deep
                },
              },
            },
          },
        },
      },
    },
    where: {
      parentId: null, // Start with root teams
    },
    orderBy: {
      name: "asc",
    },
  });

  // Convert Prisma result to our interface
  function convertToHierarchyNode(team: TeamWithChildren): TeamHierarchyNode {
    return {
      id: team.id,
      name: team.name,
      parentId: team.parentId,
      children: team.children ? team.children.map(convertToHierarchyNode) : [],
    };
  }

  return allTeams.map(convertToHierarchyNode);
}

/**
 * Get full team hierarchy for a specific team using materialized view
 */
export async function getTeamFullHierarchyFastTest(
  teamName: string,
): Promise<TeamFullHierarchyNode[]> {
  if (!teamName || teamName.trim() === "") {
    return [];
  }

  // Find the target team first using ORM
  const targetTeam = await db.team.findFirst({
    where: {
      name: teamName,
    },
  });

  if (!targetTeam) {
    return [];
  }

  // Get all teams that are ancestors or descendants of the target team
  // This is a simplified approach using the materialized view
  const result = await db.$queryRaw<MaterializedViewResult[]>`
    WITH target_team AS (
      SELECT id, name, "parentId", path
      FROM team_tree_view
      WHERE name = ${teamName}
      LIMIT 1
    ),
    related_teams AS (
      SELECT DISTINCT tv.*
      FROM team_tree_view tv, target_team tt
      WHERE 
        -- Include target team
        tv.id = tt.id
        OR
        -- Include ancestors (teams in target's path)
        tv.id = ANY(tt.path)
        OR
        -- Include descendants (teams that have target in their path)
        tt.id = ANY(tv.path)
    )
    SELECT 
      rt.*
    FROM related_teams rt
    ORDER BY rt.depth, rt.name;
  `;

  if (result.length === 0) {
    return [];
  }

  // Build team map
  const teamMap = new Map<number, TeamFullHierarchyNode>();

  result.forEach((team) => {
    teamMap.set(team.id, {
      id: team.id,
      name: team.name,
      parent: null,
      children: [],
      parentCount: 0,
      childCount: 0,
    });
  });

  // Set up relationships
  result.forEach((team) => {
    const teamNode = teamMap.get(team.id)!;

    if (team.parentId && teamMap.has(team.parentId)) {
      const parent = teamMap.get(team.parentId)!;
      teamNode.parent = parent;
      parent.children.push(teamNode);
    }
  });

  // Calculate counts
  teamMap.forEach((team) => {
    team.childCount = team.children.length;
    team.parentCount = team.parent ? 1 : 0;
  });

  // Return root teams of the filtered hierarchy
  return Array.from(teamMap.values()).filter(
    (team) => !team.parent || !teamMap.has(team.parent.id),
  );
}

/**
 * Get full team hierarchy using traditional Prisma ORM approach
 */
export async function getTeamFullHierarchyTest(
  teamName: string,
): Promise<TeamFullHierarchyNode[]> {
  if (!teamName || teamName.trim() === "") {
    return [];
  }

  // Find the target team
  const targetTeam = await db.team.findFirst({
    where: {
      name: teamName,
    },
  });

  if (!targetTeam) {
    return [];
  }

  // Get ancestors by traversing up the hierarchy
  const ancestors: BasicTeamData[] = [];
  let currentTeam = targetTeam;

  while (currentTeam.parentId) {
    const parent = await db.team.findUnique({
      where: { id: currentTeam.parentId },
    });
    if (parent) {
      ancestors.unshift(parent); // Add to beginning
      currentTeam = parent;
    } else {
      break;
    }
  }

  // Get descendants using recursive fetch
  async function getDescendants(teamId: number): Promise<BasicTeamData[]> {
    const children = await db.team.findMany({
      where: { parentId: teamId },
    });

    const allDescendants = [...children];

    for (const child of children) {
      const childDescendants = await getDescendants(child.id);
      allDescendants.push(...childDescendants);
    }

    return allDescendants;
  }

  const descendants = await getDescendants(targetTeam.id);

  // Combine all related teams
  const allTeams: BasicTeamData[] = [...ancestors, targetTeam, ...descendants];

  // Build hierarchy (similar to fast version but with ORM data)
  const teamMap = new Map<number, TeamFullHierarchyNode>();

  allTeams.forEach((team) => {
    teamMap.set(team.id, {
      id: team.id,
      name: team.name,
      parent: null,
      children: [],
      parentCount: 0,
      childCount: 0,
    });
  });

  allTeams.forEach((team) => {
    const teamNode = teamMap.get(team.id)!;

    if (team.parentId && teamMap.has(team.parentId)) {
      const parent = teamMap.get(team.parentId)!;
      teamNode.parent = parent;
      parent.children.push(teamNode);
    }
  });

  teamMap.forEach((team) => {
    team.childCount = team.children.length;
    team.parentCount = team.parent ? 1 : 0;
  });

  return Array.from(teamMap.values()).filter(
    (team) => !team.parent || !teamMap.has(team.parent.id),
  );
}
