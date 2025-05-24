import { db } from "../db";
import { Prisma } from "@prisma/client";

export async function getTeamCount() {
  return db.team.count();
}

export async function getTeamsWithRelations(name?: string) {
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

export async function getTeamHierarchy() {
  const teams = await db.team.findMany({
    include: {
      children: true,
    },
  });
  // Build hierarchy tree
  const teamMap = new Map();
  teams.forEach((team) => teamMap.set(team.id, { ...team, children: [] }));
  let rootTeams: any[] = [];
  teams.forEach((team) => {
    if (team.parentId && teamMap.has(team.parentId)) {
      teamMap.get(team.parentId).children.push(teamMap.get(team.id));
    } else {
      rootTeams.push(teamMap.get(team.id));
    }
  });
  return rootTeams;
}

export async function getTeamFullHierarchy(name: string) {
  // Fetch all teams with parent and children
  const teams = await db.team.findMany({
    include: {
      parent: true,
      children: true,
    },
  });
  // Build a map for quick lookup
  const teamMap = new Map<number, any>();
  teams.forEach((team) => teamMap.set(team.id, { ...team }));

  // Find the selected team by name
  const selected = teams.find((team) => team.name === name);
  if (!selected) return [];

  // Recursively mark all ancestors
  const ancestorIds = new Set<number>();
  function markAncestors(team: any) {
    if (!team || ancestorIds.has(team.id)) return;
    ancestorIds.add(team.id);
    if (team.parent) markAncestors(teamMap.get(team.parent.id));
  }
  markAncestors(selected);

  // Recursively mark all descendants
  const descendantIds = new Set<number>();
  function markDescendants(team: any) {
    if (!team || descendantIds.has(team.id)) return;
    descendantIds.add(team.id);
    (team.children || []).forEach((child: any) =>
      markDescendants(teamMap.get(child.id)),
    );
  }
  markDescendants(selected);

  // The set of all relevant team ids
  const relevantIds = new Set<number>([...ancestorIds, ...descendantIds]);

  // Build a tree of all relevant teams
  function buildTree(team: any): any {
    if (!team || !relevantIds.has(team.id)) return null;
    return {
      id: team.id,
      name: team.name,
      parent: team.parent
        ? { id: team.parent.id, name: team.parent.name }
        : null,
      children: (team.children || [])
        .map((child: any) => buildTree(teamMap.get(child.id)))
        .filter(Boolean),
      parentCount: team.parent ? 1 : 0,
      childCount: (team.children || []).length,
    };
  }

  // Find all root ancestors (teams with no parent or whose parent is not in relevantIds)
  const roots = teams.filter(
    (team) =>
      relevantIds.has(team.id) &&
      (!team.parent || !relevantIds.has(team.parent.id)),
  );
  return roots.map(buildTree).filter(Boolean);
}

export async function getTeamsPaginated(
  name: string | undefined,
  page: number,
  pageSize: number,
) {
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
