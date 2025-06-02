import { db } from "../db";
import { Prisma } from "@prisma/client";
import {
  type TeamWithRelations,
  type TeamHierarchyNode,
  type TeamTree,
} from "../schemas/team";
import {
  createTeamTreeMaterializedView,
  refreshTeamTreeMaterializedView,
  getTeamTreeFromMaterializedView,
  getTeamTreeStatistics,
  teamTreeMaterializedViewExists,
} from "../data-access/team.data-access";

// Define Prisma result types
type TeamWithChildrenQuery = Prisma.TeamGetPayload<{
  include: { children: true };
}>;

type TeamWithFullRelationsQuery = Prisma.TeamGetPayload<{
  include: { parent: true; children: true };
}>;

// Type for materialized view data
interface MaterializedTeamData {
  id: number;
  name: string;
  parentId: number | null;
  root_id: number;
  root_name: string;
  depth: number;
  path: number[];
  path_names: string;
  total_descendant_count: number;
  is_root: boolean;
  path_length: number;
  is_leaf: boolean;
  team_size_category: string;
}

export async function getTeamCount(): Promise<number> {
  return db.team.count();
}

export async function getTeamsWithRelations(
  name?: string,
): Promise<TeamWithRelations[]> {
  const teams = await db.team.findMany({
    where: name ? { name } : undefined,
    include: {
      children: true,
      parent: true,
    },
  });
  return teams.map((team) => ({
    ...team,
    parentCount: team.parent ? 1 : 0,
    childCount: team.children.length,
  }));
}

/**
 * Initializes the materialized view for team hierarchy
 * @description Creates the materialized view and populates it with current data.
 * Can be called explicitly during application startup or after data changes.
 */
export async function initializeTeamMaterializedView(): Promise<void> {
  await createTeamTreeMaterializedView();
}

/**
 * Refreshes the materialized view with current data
 * @description Updates the materialized view to reflect recent changes.
 * Should be called after team hierarchy modifications.
 */
export async function updateTeamMaterializedView(): Promise<void> {
  const viewExists = await teamTreeMaterializedViewExists();

  if (viewExists) {
    await refreshTeamTreeMaterializedView();
  } else {
    await createTeamTreeMaterializedView();
  }
}

/**
 * Gets team hierarchy using the materialized view for optimal performance
 * @description Fast hierarchy retrieval using pre-computed team tree data
 */
export async function getTeamHierarchyFast(): Promise<TeamHierarchyNode[]> {
  await updateTeamMaterializedView();

  const materializedTeams =
    (await getTeamTreeFromMaterializedView()) as MaterializedTeamData[];

  // Convert materialized view data to TeamHierarchyNode format
  const teamMap = new Map<number, TeamHierarchyNode>();

  // First pass: create all nodes
  for (const team of materializedTeams) {
    const hierarchyNode: TeamHierarchyNode = {
      id: team.id,
      name: team.name,
      parentId: team.parentId,
      children: [],
    };
    teamMap.set(team.id, hierarchyNode);
  }

  // Second pass: build parent-child relationships
  const rootTeams: TeamHierarchyNode[] = [];
  for (const team of materializedTeams) {
    if (team.parentId && teamMap.has(team.parentId)) {
      const parent = teamMap.get(team.parentId);
      const child = teamMap.get(team.id);
      if (parent && child) {
        parent.children.push(child);
      }
    } else {
      const rootTeam = teamMap.get(team.id);
      if (rootTeam) {
        rootTeams.push(rootTeam);
      }
    }
  }

  return rootTeams;
}

/**
 * Gets full team hierarchy for a specific team using materialized view
 * @param name - The team name to build hierarchy around
 * @description Fast hierarchy retrieval with focus on a specific team and its relations
 */
export async function getTeamFullHierarchyFast(
  name: string,
): Promise<TeamTree[]> {
  await updateTeamMaterializedView();

  const materializedTeams =
    (await getTeamTreeFromMaterializedView()) as MaterializedTeamData[];

  // Find the selected team by name
  const selected = materializedTeams.find(
    (team: MaterializedTeamData) => team.name === name,
  );
  if (!selected) return [];

  // Build a map for quick lookup
  const teamMap = new Map<number, MaterializedTeamData>();
  materializedTeams.forEach((team: MaterializedTeamData) =>
    teamMap.set(team.id, team),
  );

  // Get all teams in the selected team's path (ancestors and descendants)
  const relevantTeamIds = new Set<number>();

  // Add all teams from the selected team's path
  if (selected.path) {
    selected.path.forEach((id: number) => relevantTeamIds.add(id));
  }

  // Add all descendants of the selected team
  for (const team of materializedTeams) {
    if (team.path?.includes(selected.id)) {
      relevantTeamIds.add(team.id);
    }
  }

  // Filter to only relevant teams
  const relevantTeams = materializedTeams.filter((team: MaterializedTeamData) =>
    relevantTeamIds.has(team.id),
  );

  // Build children relationships
  const childrenMap = new Map<number, MaterializedTeamData[]>();
  relevantTeams.forEach((team: MaterializedTeamData) => {
    if (team.parentId && relevantTeamIds.has(team.parentId)) {
      if (!childrenMap.has(team.parentId)) {
        childrenMap.set(team.parentId, []);
      }
      childrenMap.get(team.parentId)!.push(team);
    }
  });

  // Build tree structure
  function buildTree(team: MaterializedTeamData): TeamTree {
    const children = childrenMap.get(team.id) ?? [];
    const parentInfo =
      team.parentId && relevantTeamIds.has(team.parentId)
        ? teamMap.get(team.parentId)
        : null;

    return {
      id: team.id,
      name: team.name,
      parent: parentInfo ? { id: parentInfo.id, name: parentInfo.name } : null,
      children: children.map(buildTree),
      parentCount: parentInfo ? 1 : 0,
      childCount: children.length,
    };
  }

  // Find root teams (teams with no parent or whose parent is not in relevantIds)
  const roots = relevantTeams.filter(
    (team: MaterializedTeamData) =>
      !team.parentId || !relevantTeamIds.has(team.parentId),
  );

  return roots.map(buildTree);
}

export async function getTeamsPaginated(
  name: string | undefined,
  page: number,
  pageSize: number,
): Promise<{ teams: TeamWithRelations[]; total: number }> {
  const where = name
    ? { name: { contains: name, mode: Prisma.QueryMode.insensitive } }
    : {};
  const [teams, total] = await Promise.all([
    db.team.findMany({
      where,
      include: {
        children: true,
        parent: true,
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: "asc" },
    }),
    db.team.count({ where }),
  ]);
  return {
    teams: teams.map((team) => ({
      ...team,
      parentCount: team.parent ? 1 : 0,
      childCount: team.children.length,
    })),
    total,
  };
}

export async function getTeamHierarchy(): Promise<TeamHierarchyNode[]> {
  const teams = await db.team.findMany({
    include: {
      children: true,
    },
  });

  // Build hierarchy tree
  const teamMap = new Map<number, TeamHierarchyNode>();
  teams.forEach((team: TeamWithChildrenQuery) => {
    const hierarchyNode: TeamHierarchyNode = {
      id: team.id,
      name: team.name,
      parentId: team.parentId,
      children: [],
    };
    teamMap.set(team.id, hierarchyNode);
  });

  const rootTeams: TeamHierarchyNode[] = [];
  teams.forEach((team: TeamWithChildrenQuery) => {
    if (team.parentId && teamMap.has(team.parentId)) {
      const parent = teamMap.get(team.parentId);
      const child = teamMap.get(team.id);
      if (parent && child) {
        parent.children.push(child);
      }
    } else {
      const rootTeam = teamMap.get(team.id);
      if (rootTeam) {
        rootTeams.push(rootTeam);
      }
    }
  });
  return rootTeams;
}

export async function getTeamFullHierarchy(name: string): Promise<TeamTree[]> {
  // Fetch all teams with parent and children
  const teams = await db.team.findMany({
    include: {
      parent: true,
      children: true,
    },
  });

  // Build a map for quick lookup
  const teamMap = new Map<number, TeamWithFullRelationsQuery>();
  teams.forEach((team: TeamWithFullRelationsQuery) =>
    teamMap.set(team.id, team),
  );

  // Find the selected team by name
  const selected = teams.find((team) => team.name === name);
  if (!selected) return [];

  // Recursively mark all ancestors
  const ancestorIds = new Set<number>();
  function markAncestors(team: TeamWithFullRelationsQuery | undefined): void {
    if (!team || ancestorIds.has(team.id)) return;
    ancestorIds.add(team.id);
    if (team.parent) markAncestors(teamMap.get(team.parent.id));
  }
  markAncestors(selected);

  // Recursively mark all descendants
  const descendantIds = new Set<number>();
  function markDescendants(team: TeamWithFullRelationsQuery | undefined): void {
    if (!team || descendantIds.has(team.id)) return;
    descendantIds.add(team.id);
    team.children.forEach((child) => markDescendants(teamMap.get(child.id)));
  }
  markDescendants(selected);

  // The set of all relevant team ids
  const relevantIds = new Set<number>([
    ...Array.from(ancestorIds),
    ...Array.from(descendantIds),
  ]);

  // Build a tree of all relevant teams
  function buildTree(team: TeamWithFullRelationsQuery): TeamTree | null {
    if (!team || !relevantIds.has(team.id)) return null;
    return {
      id: team.id,
      name: team.name,
      parent: team.parent
        ? { id: team.parent.id, name: team.parent.name }
        : null,
      children: team.children
        .map((child) => {
          const childTeam = teamMap.get(child.id);
          return childTeam ? buildTree(childTeam) : null;
        })
        .filter((child): child is TeamTree => child !== null),
      parentCount: team.parent ? 1 : 0,
      childCount: team.children.length,
    };
  }

  // Find all root ancestors (teams with no parent or whose parent is not in relevantIds)
  const roots = teams.filter(
    (team) =>
      relevantIds.has(team.id) &&
      (!team.parent || !relevantIds.has(team.parent.id)),
  );
  return roots.map(buildTree).filter((tree): tree is TeamTree => tree !== null);
}
