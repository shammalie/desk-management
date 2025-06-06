import { db } from "../db";

export async function getAllTeams() {
  return db.team.findMany({
    include: {
      children: true,
      parent: true,
    },
  });
}

export async function getTeamCount() {
  return db.team.count();
}

/**
 * Creates a materialized view for team hierarchy with metadata
 *
 * @description Creates a materialized view that includes:
 * - Team hierarchy paths
 * - Total descendant count for each team
 * - Depth level in the hierarchy
 * - Root team information
 *
 * @returns Promise<void>
 */
export async function createTeamTreeMaterializedView() {
  await db.$executeRaw`
    CREATE MATERIALIZED VIEW IF NOT EXISTS team_tree_view AS
    WITH RECURSIVE team_hierarchy AS (
      -- Base case: Root teams (teams with no parent)
      SELECT 
        id,
        name,
        "parentId",
        id as root_id,
        name as root_name,
        0 as depth,
        ARRAY[id] as path,
        name::text as path_names
      FROM "Team" 
      WHERE "parentId" IS NULL
      
      UNION ALL
      
      -- Recursive case: Child teams
      SELECT 
        t.id,
        t.name,
        t."parentId",
        th.root_id,
        th.root_name,
        th.depth + 1,
        th.path || t.id,
        th.path_names || ' → ' || t.name
      FROM "Team" t
      INNER JOIN team_hierarchy th ON t."parentId" = th.id
    ),
    team_counts AS (
      -- Calculate total descendant count for each team
      SELECT 
        t1.id,
        COUNT(t2.id) - 1 as descendant_count  -- Subtract 1 to exclude self
      FROM team_hierarchy t1
      LEFT JOIN team_hierarchy t2 ON t1.id = ANY(t2.path)
      GROUP BY t1.id
    )
    SELECT 
      th.id,
      th.name,
      th."parentId",
      th.root_id,
      th.root_name,
      th.depth,
      th.path,
      th.path_names,
      COALESCE(tc.descendant_count, 0) as total_descendant_count,
      -- Additional metadata
      CASE 
        WHEN th."parentId" IS NULL THEN true 
        ELSE false 
      END as is_root,
      array_length(th.path, 1) as path_length,
      CASE 
        WHEN NOT EXISTS (
          SELECT 1 FROM "Team" WHERE "parentId" = th.id
        ) THEN true 
        ELSE false 
      END as is_leaf
    FROM team_hierarchy th
    LEFT JOIN team_counts tc ON th.id = tc.id
    ORDER BY tc.descendant_count DESC NULLS LAST, th.name ASC;
  `;
}

/**
 * Refreshes the team tree materialized view
 *
 * @description Refreshes the materialized view to reflect current data.
 * Should be called after team hierarchy changes.
 *
 * @returns Promise<void>
 */
export async function refreshTeamTreeMaterializedView() {
  await db.$executeRaw`REFRESH MATERIALIZED VIEW team_tree_view;`;
}

/**
 * Drops the team tree materialized view
 *
 * @description Removes the materialized view. Useful for cleanup or schema changes.
 *
 * @returns Promise<void>
 */
export async function dropTeamTreeMaterializedView() {
  await db.$executeRaw`DROP MATERIALIZED VIEW IF EXISTS team_tree_view;`;
}

/**
 * Gets team hierarchy data from the materialized view
 *
 * @description Retrieves team tree data with metadata, ordered by descendant count.
 * The materialized view must be created first using createTeamTreeMaterializedView().
 *
 * @param limit - Optional limit for number of results
 * @returns Promise with team hierarchy data including metadata
 */
export async function getTeamTreeFromMaterializedView(limit?: number) {
  if (limit) {
    return db.$queryRaw`
      SELECT 
        id,
        name,
        "parentId",
        root_id,
        root_name,
        depth,
        path,
        path_names,
        total_descendant_count,
        is_root,
        path_length,
        is_leaf,
        -- Additional calculated fields
        CASE 
          WHEN total_descendant_count > 50 THEN 'large'
          WHEN total_descendant_count > 10 THEN 'medium'
          ELSE 'small'
        END as team_size_category
      FROM team_tree_view
      ORDER BY total_descendant_count DESC, name ASC
      LIMIT ${limit}
    `;
  } else {
    return db.$queryRaw`
      SELECT 
        id,
        name,
        "parentId",
        root_id,
        root_name,
        depth,
        path,
        path_names,
        total_descendant_count,
        is_root,
        path_length,
        is_leaf,
        -- Additional calculated fields
        CASE 
          WHEN total_descendant_count > 50 THEN 'large'
          WHEN total_descendant_count > 10 THEN 'medium'
          ELSE 'small'
        END as team_size_category
      FROM team_tree_view
      ORDER BY total_descendant_count DESC, name ASC
    `;
  }
}

/**
 * Gets team tree statistics from the materialized view
 *
 * @description Provides aggregate statistics about the team hierarchy.
 *
 * @returns Promise with team tree statistics
 */
export async function getTeamTreeStatistics() {
  return db.$queryRaw`
    SELECT 
      COUNT(*) as total_teams,
      COUNT(*) FILTER (WHERE is_root = true) as total_root_teams,
      COUNT(*) FILTER (WHERE is_leaf = true) as total_leaf_teams,
      MAX(depth) as max_depth,
      AVG(depth)::NUMERIC(5,2) as avg_depth,
      MAX(total_descendant_count) as largest_team_size,
      AVG(total_descendant_count)::NUMERIC(10,2) as avg_team_size,
      COUNT(*) FILTER (WHERE total_descendant_count > 10) as teams_with_10_plus_descendants,
      COUNT(*) FILTER (WHERE total_descendant_count = 0) as teams_with_no_descendants
    FROM team_tree_view;
  `;
}

/**
 * Checks if the team tree materialized view exists
 *
 * @description Checks whether the materialized view has been created.
 * Useful for conditional view management.
 *
 * @returns Promise<boolean> - True if the view exists, false otherwise
 */
export async function teamTreeMaterializedViewExists(): Promise<boolean> {
  try {
    const result = await db.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM pg_matviews 
        WHERE schemaname = 'public' 
        AND matviewname = 'team_tree_view'
      ) as exists;
    `;

    return (result as { exists: boolean }[])[0]?.exists ?? false;
  } catch (error) {
    return false;
  }
}
