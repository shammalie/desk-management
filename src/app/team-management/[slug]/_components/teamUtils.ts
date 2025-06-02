import type { TeamTree } from "~/server/schemas/team";

/**
 * Flattens a hierarchical team tree into a flat array
 *
 * @description Recursively traverses a team tree structure and returns
 * all teams in a single flat array. Useful for converting hierarchical
 * data to a format suitable for ReactFlow processing.
 *
 * @param tree - Array of team tree nodes to flatten
 * @param acc - Accumulator array for recursive calls (optional)
 * @returns Flat array containing all teams from the tree
 */
export function flattenTree(
  tree: TeamTree[],
  acc: TeamTree[] = [],
): TeamTree[] {
  for (const node of tree) {
    acc.push(node);
    if (node.children.length > 0) {
      flattenTree(node.children, acc);
    }
  }
  return acc;
}

/**
 * Recursively collects all parent teams of a given team
 *
 * @description Traverses up the team hierarchy to collect all parent teams.
 * Useful for determining which teams should be visible when filtering
 * or highlighting specific teams.
 *
 * @param team - Starting team to collect parents for
 * @param acc - Set to accumulate parent IDs (prevents duplicates)
 * @param teamMap - Map for efficient team lookups by ID
 */
export function collectParents(
  team: TeamTree,
  acc: Set<string>,
  teamMap: Map<string, TeamTree>,
): void {
  if (team.parent && !acc.has(String(team.parent.id))) {
    acc.add(String(team.parent.id));
    const parent = teamMap.get(String(team.parent.id));
    if (parent) {
      collectParents(parent, acc, teamMap);
    }
  }
}

/**
 * Recursively collects all child teams of a given team
 *
 * @description Traverses down the team hierarchy to collect all descendant teams.
 * Useful for determining which teams should be visible when filtering
 * or highlighting specific teams.
 *
 * @param team - Starting team to collect children for
 * @param acc - Set to accumulate child IDs (prevents duplicates)
 * @param teamMap - Map for efficient team lookups by ID
 */
export function collectChildren(
  team: TeamTree,
  acc: Set<string>,
  teamMap: Map<string, TeamTree>,
): void {
  for (const child of team.children) {
    if (!acc.has(String(child.id))) {
      acc.add(String(child.id));
      const childTeam = teamMap.get(String(child.id));
      if (childTeam) {
        collectChildren(childTeam, acc, teamMap);
      }
    }
  }
}

/**
 * Builds a map of team ID to team object for efficient lookups
 *
 * @description Creates a Map for O(1) lookups of teams by their ID.
 * This is more efficient than repeatedly searching through arrays
 * when working with team hierarchies.
 *
 * @param teams - Array of teams to create map from
 * @returns Map with team ID as key and team object as value
 */
export function buildTeamMap(teams: TeamTree[]): Map<string, TeamTree> {
  const map = new Map<string, TeamTree>();
  for (const team of teams) {
    map.set(String(team.id), team);
  }
  return map;
}

/**
 * Determines which teams should be visible based on highlighting/filtering
 *
 * @description When teams are highlighted, shows the highlighted teams plus
 * all their parents and children. When no teams are highlighted, shows all teams.
 *
 * @param teams - All available teams
 * @param highlightedTeamIds - Array of team IDs that are currently highlighted
 * @param teamMap - Map for efficient team lookups
 * @returns Array of team IDs that should be visible
 */
export function getExpandedTeamIds(
  teams: TeamTree[],
  highlightedTeamIds: string[],
  teamMap: Map<string, TeamTree>,
): string[] {
  if (!highlightedTeamIds || highlightedTeamIds.length === 0) {
    return teams.map((team) => String(team.id));
  }

  const visibleIds = new Set<string>();

  for (const id of highlightedTeamIds) {
    visibleIds.add(id);
    const team = teamMap.get(id);
    if (team) {
      collectParents(team, visibleIds, teamMap);
      collectChildren(team, visibleIds, teamMap);
    }
  }

  return Array.from(visibleIds);
}
