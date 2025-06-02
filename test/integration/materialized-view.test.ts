import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { db } from "~/server/db";
import {
  createTeamTreeMaterializedViewTest,
  refreshTeamTreeMaterializedViewTest,
  dropTeamTreeMaterializedViewTest,
  getTeamTreeFromMaterializedViewTest,
  getTeamTreeStatisticsTest,
  teamTreeMaterializedViewExistsTest,
} from "../test-data-access";

// Type definitions for test data
interface MaterializedTeamData {
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

interface TeamStatsData {
  total_teams: number | bigint;
  total_root_teams: number | bigint;
  total_leaf_teams: number | bigint;
  max_depth: number | bigint;
  avg_depth: number;
  largest_team_size: number | bigint;
  avg_team_size: number;
  teams_with_10_plus_descendants: number | bigint;
  teams_with_no_descendants: number | bigint;
}

// Helper function to convert BigInt to number for comparisons
function toNumber(value: number | bigint): number {
  return typeof value === "bigint" ? Number(value) : value;
}

describe("Team Materialized View Integration Tests (Test Schema)", () => {
  beforeAll(async () => {
    // Ensure we're using the test schema
    await db.$executeRaw`SET search_path TO test, public;`;
  });

  afterAll(async () => {
    // Tests will be cleaned up by global teardown
    await db.$disconnect();
  });

  beforeEach(async () => {
    // Ensure we're using the test schema for each test
    await db.$executeRaw`SET search_path TO test, public;`;

    // Drop view before each test to ensure clean state
    await dropTeamTreeMaterializedViewTest().catch(() => {
      // Ignore error if view doesn't exist
    });
  });

  describe("teamTreeMaterializedViewExists", () => {
    it("should return false when view does not exist", async () => {
      const exists = await teamTreeMaterializedViewExistsTest();
      expect(exists).toBe(false);
    });

    it("should return true when view exists", async () => {
      await createTeamTreeMaterializedViewTest();
      const exists = await teamTreeMaterializedViewExistsTest();
      expect(exists).toBe(true);
    });
  });

  describe("createTeamTreeMaterializedView", () => {
    it("should create materialized view successfully", async () => {
      await expect(createTeamTreeMaterializedViewTest()).resolves.not.toThrow();

      // Verify view was created
      const exists = await teamTreeMaterializedViewExistsTest();
      expect(exists).toBe(true);
    });

    it("should not throw error when creating view that already exists", async () => {
      await createTeamTreeMaterializedViewTest();
      await expect(createTeamTreeMaterializedViewTest()).resolves.not.toThrow();
    });

    it("should populate view with team data", async () => {
      await createTeamTreeMaterializedViewTest();

      const teams = (await getTeamTreeFromMaterializedViewTest(
        10,
      )) as MaterializedTeamData[];
      expect(Array.isArray(teams)).toBe(true);
      expect(teams.length).toBeGreaterThan(0);

      // Check structure of returned data
      const firstTeam = teams[0];
      expect(firstTeam).toHaveProperty("id");
      expect(firstTeam).toHaveProperty("name");
      expect(firstTeam).toHaveProperty("parentId");
      expect(firstTeam).toHaveProperty("depth");
      expect(firstTeam).toHaveProperty("path");
      expect(firstTeam).toHaveProperty("total_descendant_count");
      expect(firstTeam).toHaveProperty("is_root");
      expect(firstTeam).toHaveProperty("is_leaf");
      expect(firstTeam).toHaveProperty("team_size_category");
    });
  });

  describe("refreshTeamTreeMaterializedView", () => {
    it("should refresh existing materialized view", async () => {
      await createTeamTreeMaterializedViewTest();
      await expect(
        refreshTeamTreeMaterializedViewTest(),
      ).resolves.not.toThrow();
    });

    it("should throw error when refreshing non-existent view", async () => {
      await expect(refreshTeamTreeMaterializedViewTest()).rejects.toThrow();
    });
  });

  describe("dropTeamTreeMaterializedView", () => {
    it("should drop existing materialized view", async () => {
      await createTeamTreeMaterializedViewTest();
      await expect(dropTeamTreeMaterializedViewTest()).resolves.not.toThrow();

      const exists = await teamTreeMaterializedViewExistsTest();
      expect(exists).toBe(false);
    });

    it("should not throw error when dropping non-existent view", async () => {
      await expect(dropTeamTreeMaterializedViewTest()).resolves.not.toThrow();
    });
  });

  describe("getTeamTreeFromMaterializedView", () => {
    beforeEach(async () => {
      await createTeamTreeMaterializedViewTest();
    });

    it("should return all teams when no limit specified", async () => {
      const teams =
        (await getTeamTreeFromMaterializedViewTest()) as MaterializedTeamData[];
      expect(Array.isArray(teams)).toBe(true);
      expect(teams.length).toBeGreaterThan(0);
    });

    it("should respect limit parameter", async () => {
      const limit = 5;
      const teams = (await getTeamTreeFromMaterializedViewTest(
        limit,
      )) as MaterializedTeamData[];
      expect(Array.isArray(teams)).toBe(true);
      expect(teams.length).toBeLessThanOrEqual(limit);
    });

    it("should return teams ordered by descendant count (descending)", async () => {
      const teams = (await getTeamTreeFromMaterializedViewTest(
        10,
      )) as MaterializedTeamData[];

      for (let i = 1; i < teams.length; i++) {
        const current = teams[i];
        const previous = teams[i - 1];
        if (current && previous) {
          expect(toNumber(current.total_descendant_count)).toBeLessThanOrEqual(
            toNumber(previous.total_descendant_count),
          );
        }
      }
    });

    it("should include correct team size categories", async () => {
      const teams = (await getTeamTreeFromMaterializedViewTest(
        20,
      )) as MaterializedTeamData[];

      for (const team of teams) {
        const descendantCount = toNumber(team.total_descendant_count);
        const { team_size_category } = team;

        if (descendantCount > 50) {
          expect(team_size_category).toBe("large");
        } else if (descendantCount > 10) {
          expect(team_size_category).toBe("medium");
        } else {
          expect(team_size_category).toBe("small");
        }
      }
    });

    it("should include hierarchy path information", async () => {
      const teams = (await getTeamTreeFromMaterializedViewTest(
        10,
      )) as MaterializedTeamData[];

      for (const team of teams) {
        expect(team).toHaveProperty("path");
        expect(team).toHaveProperty("path_names");
        expect(team).toHaveProperty("depth");

        // Path should be an array
        expect(Array.isArray(team.path)).toBe(true);
        expect(team.path.length).toBeGreaterThan(0);

        // Depth should match path length - 1 (0-indexed)
        expect(team.depth).toBe(team.path.length - 1);

        // Root teams should have depth 0
        if (team.is_root) {
          expect(team.depth).toBe(0);
          expect(team.parentId).toBeNull();
        }
      }
    });

    it("should properly identify root and leaf teams", async () => {
      const teams =
        (await getTeamTreeFromMaterializedViewTest()) as MaterializedTeamData[];

      const rootTeams = teams.filter((team) => team.is_root);
      const leafTeams = teams.filter((team) => team.is_leaf);

      expect(rootTeams.length).toBeGreaterThan(0);
      expect(leafTeams.length).toBeGreaterThan(0);

      // Root teams should have no parent
      for (const rootTeam of rootTeams) {
        expect(rootTeam.parentId).toBeNull();
        expect(rootTeam.depth).toBe(0);
      }
    });
  });

  describe("getTeamTreeStatistics", () => {
    beforeEach(async () => {
      await createTeamTreeMaterializedViewTest();
    });

    it("should return comprehensive statistics", async () => {
      const stats = (await getTeamTreeStatisticsTest()) as TeamStatsData[];
      expect(Array.isArray(stats)).toBe(true);
      expect(stats.length).toBe(1);

      const statsRecord = stats[0];
      expect(statsRecord).toHaveProperty("total_teams");
      expect(statsRecord).toHaveProperty("total_root_teams");
      expect(statsRecord).toHaveProperty("total_leaf_teams");
      expect(statsRecord).toHaveProperty("max_depth");
      expect(statsRecord).toHaveProperty("avg_depth");
      expect(statsRecord).toHaveProperty("largest_team_size");
      expect(statsRecord).toHaveProperty("avg_team_size");
      expect(statsRecord).toHaveProperty("teams_with_10_plus_descendants");
      expect(statsRecord).toHaveProperty("teams_with_no_descendants");
    });

    it("should return sensible statistics values", async () => {
      const stats = (await getTeamTreeStatisticsTest()) as TeamStatsData[];
      const statsRecord = stats[0];

      if (!statsRecord) {
        throw new Error("No statistics data returned");
      }

      // Total teams should be positive
      expect(toNumber(statsRecord.total_teams)).toBeGreaterThan(0);

      // Root teams should be less than or equal to total teams
      expect(toNumber(statsRecord.total_root_teams)).toBeGreaterThan(0);
      expect(toNumber(statsRecord.total_root_teams)).toBeLessThanOrEqual(
        toNumber(statsRecord.total_teams),
      );

      // Leaf teams should be less than or equal to total teams
      expect(toNumber(statsRecord.total_leaf_teams)).toBeGreaterThan(0);
      expect(toNumber(statsRecord.total_leaf_teams)).toBeLessThanOrEqual(
        toNumber(statsRecord.total_teams),
      );

      // Max depth should be non-negative
      expect(toNumber(statsRecord.max_depth)).toBeGreaterThanOrEqual(0);

      // Average depth should be non-negative
      expect(Number(statsRecord.avg_depth)).toBeGreaterThanOrEqual(0);

      // Largest team size should be non-negative
      expect(toNumber(statsRecord.largest_team_size)).toBeGreaterThanOrEqual(0);

      // Average team size should be non-negative
      expect(Number(statsRecord.avg_team_size)).toBeGreaterThanOrEqual(0);
    });
  });

  describe("materialized view data integrity", () => {
    beforeEach(async () => {
      await createTeamTreeMaterializedViewTest();
    });

    it("should maintain referential integrity in paths", async () => {
      const teams =
        (await getTeamTreeFromMaterializedViewTest()) as MaterializedTeamData[];
      const teamMap = new Map();

      // Build team map
      for (const team of teams) {
        teamMap.set(team.id, team);
      }

      // Verify path integrity
      for (const team of teams) {
        for (const pathId of team.path) {
          expect(teamMap.has(pathId)).toBe(true);
        }

        // The team itself should be the last element in its path
        expect(team.path[team.path.length - 1]).toBe(team.id);
      }
    });

    it("should correctly calculate descendant counts", async () => {
      const teams =
        (await getTeamTreeFromMaterializedViewTest()) as MaterializedTeamData[];

      // For each team, verify descendant count
      for (const team of teams) {
        const descendants = teams.filter(
          (t) => t.path.includes(team.id) && t.id !== team.id,
        );

        expect(toNumber(team.total_descendant_count)).toBe(descendants.length);
      }
    });

    it("should have consistent parent-child relationships", async () => {
      const teams =
        (await getTeamTreeFromMaterializedViewTest()) as MaterializedTeamData[];

      for (const team of teams) {
        if (team.parentId) {
          // Parent should exist in the dataset
          const parent = teams.find((t) => t.id === team.parentId);
          expect(parent).toBeDefined();

          // Team should be in parent's descendants
          if (parent) {
            const parentDescendants = teams.filter(
              (t) => t.path.includes(parent.id) && t.id !== parent.id,
            );
            expect(parentDescendants.some((d) => d.id === team.id)).toBe(true);
          }
        }
      }
    });
  });

  describe("error handling", () => {
    it("should handle invalid database operations gracefully", async () => {
      // Try to get data from non-existent view
      await expect(getTeamTreeFromMaterializedViewTest()).rejects.toThrow();
    });

    it("should handle view creation when view already exists", async () => {
      // Create view first
      await createTeamTreeMaterializedViewTest();

      // Creating again should not throw (using IF NOT EXISTS)
      await expect(createTeamTreeMaterializedViewTest()).resolves.not.toThrow();
    });
  });

  describe("performance characteristics", () => {
    beforeEach(async () => {
      await createTeamTreeMaterializedViewTest();
    });

    it("should retrieve data quickly", async () => {
      const startTime = Date.now();
      const teams = (await getTeamTreeFromMaterializedViewTest(
        10,
      )) as MaterializedTeamData[];
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(teams.length).toBeGreaterThan(0);
    });

    it("should handle large result sets efficiently", async () => {
      const startTime = Date.now();
      const teams =
        (await getTeamTreeFromMaterializedViewTest()) as MaterializedTeamData[];
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      expect(teams.length).toBeGreaterThan(0);
    });
  });
});
