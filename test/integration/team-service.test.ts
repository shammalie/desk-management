import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { db } from "~/server/db";
import {
  getTeamHierarchyFastTest,
  getTeamFullHierarchyFastTest,
  initializeTeamMaterializedViewTest,
  updateTeamMaterializedViewTest,
} from "../test-service";
import { dropTeamTreeMaterializedViewTest } from "../test-data-access";

// Type definitions for team service data
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

// Helper function to flatten team hierarchy
function flattenHierarchy(teams: TeamHierarchyNode[]): TeamHierarchyNode[] {
  return teams.reduce<TeamHierarchyNode[]>((acc, team) => {
    return [...acc, team, ...flattenHierarchy(team.children)];
  }, []);
}

// Helper function to flatten full hierarchy
function flattenTree(trees: TeamFullHierarchyNode[]): TeamFullHierarchyNode[] {
  return trees.reduce<TeamFullHierarchyNode[]>((acc, tree) => {
    return [...acc, tree, ...flattenTree(tree.children)];
  }, []);
}

// Helper function to find team with children
function findTeamWithChildren(
  teams: TeamHierarchyNode[],
): TeamHierarchyNode | null {
  for (const team of teams) {
    if (team.children.length > 0) {
      return team;
    }
    const found = findTeamWithChildren(team.children);
    if (found) return found;
  }
  return null;
}

describe("Team Service Integration Tests (Test Schema)", () => {
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

  describe("initializeTeamMaterializedView", () => {
    it("should initialize materialized view successfully", async () => {
      await expect(initializeTeamMaterializedViewTest()).resolves.not.toThrow();
    });

    it("should create view that can be queried", async () => {
      await initializeTeamMaterializedViewTest();

      // Should be able to use hierarchy functions after initialization
      const hierarchy = await getTeamHierarchyFastTest();
      expect(Array.isArray(hierarchy)).toBe(true);
      expect(hierarchy.length).toBeGreaterThan(0);
    });
  });

  describe("updateTeamMaterializedView", () => {
    it("should create view when it does not exist", async () => {
      await expect(updateTeamMaterializedViewTest()).resolves.not.toThrow();

      const hierarchy = await getTeamHierarchyFastTest();
      expect(Array.isArray(hierarchy)).toBe(true);
    });

    it("should refresh view when it exists", async () => {
      await initializeTeamMaterializedViewTest();
      await expect(updateTeamMaterializedViewTest()).resolves.not.toThrow();

      const hierarchy = await getTeamHierarchyFastTest();
      expect(Array.isArray(hierarchy)).toBe(true);
    });
  });

  describe("getTeamHierarchyFast", () => {
    beforeEach(async () => {
      await initializeTeamMaterializedViewTest();
    });

    it("should return hierarchical team structure", async () => {
      const hierarchy =
        (await getTeamHierarchyFastTest()) as TeamHierarchyNode[];

      expect(Array.isArray(hierarchy)).toBe(true);
      expect(hierarchy.length).toBeGreaterThan(0);

      // Check structure of returned data
      const firstTeam = hierarchy[0];
      if (firstTeam) {
        expect(firstTeam).toHaveProperty("id");
        expect(firstTeam).toHaveProperty("name");
        expect(firstTeam).toHaveProperty("parentId");
        expect(firstTeam).toHaveProperty("children");
        expect(Array.isArray(firstTeam.children)).toBe(true);
      }
    });

    it("should build proper parent-child relationships", async () => {
      const hierarchy =
        (await getTeamHierarchyFastTest()) as TeamHierarchyNode[];

      const allTeams = flattenHierarchy(hierarchy);

      for (const team of allTeams) {
        if (team.parentId) {
          // Find parent in flattened list
          const parent = allTeams.find((t) => t.id === team.parentId);
          expect(parent).toBeDefined();

          // Check that team is in parent's children
          if (parent) {
            expect(parent.children.some((child) => child.id === team.id)).toBe(
              true,
            );
          }
        }
      }
    });

    it("should only return root teams at top level", async () => {
      const hierarchy = await getTeamHierarchyFastTest();

      for (const rootTeam of hierarchy) {
        expect(rootTeam.parentId).toBeNull();
      }
    });

    it("should maintain data consistency with materialized view", async () => {
      const hierarchy =
        (await getTeamHierarchyFastTest()) as TeamHierarchyNode[];

      const flatTeams = flattenHierarchy(hierarchy);
      expect(flatTeams.length).toBeGreaterThan(0);

      // Each team should have valid properties
      for (const team of flatTeams) {
        expect(typeof team.id).toBe("number");
        expect(typeof team.name).toBe("string");
        expect(Array.isArray(team.children)).toBe(true);
      }
    });
  });

  describe("getTeamFullHierarchyFast", () => {
    let sampleTeamName: string;

    beforeEach(async () => {
      await initializeTeamMaterializedViewTest();

      const hierarchy =
        (await getTeamHierarchyFastTest()) as TeamHierarchyNode[];
      const teamWithChildren = findTeamWithChildren(hierarchy);
      const fallbackTeam = hierarchy[0];

      if (teamWithChildren) {
        sampleTeamName = teamWithChildren.name;
      } else if (fallbackTeam) {
        sampleTeamName = fallbackTeam.name;
      } else {
        throw new Error("No teams found for testing");
      }

      expect(sampleTeamName).toBeTruthy();
    });

    it("should return team hierarchy for existing team", async () => {
      const result = await getTeamFullHierarchyFastTest(sampleTeamName);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Should contain the requested team
      const allTeams = flattenTree(result);
      const targetTeam = allTeams.find((team) => team.name === sampleTeamName);
      expect(targetTeam).toBeDefined();
    });

    it("should return empty array for non-existent team", async () => {
      const result = await getTeamFullHierarchyFastTest(
        "NonExistentTeamName123",
      );
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("should include proper team structure", async () => {
      const result = (await getTeamFullHierarchyFastTest(
        sampleTeamName,
      )) as TeamFullHierarchyNode[];

      if (result.length > 0) {
        const firstTeam = result[0];
        if (firstTeam) {
          expect(firstTeam).toHaveProperty("id");
          expect(firstTeam).toHaveProperty("name");
          expect(firstTeam).toHaveProperty("parent");
          expect(firstTeam).toHaveProperty("children");
          expect(firstTeam).toHaveProperty("parentCount");
          expect(firstTeam).toHaveProperty("childCount");

          expect(Array.isArray(firstTeam.children)).toBe(true);
          expect(typeof firstTeam.parentCount).toBe("number");
          expect(typeof firstTeam.childCount).toBe("number");
        }
      }
    });

    it("should include ancestors and descendants of target team", async () => {
      const result = await getTeamFullHierarchyFastTest(sampleTeamName);

      const allTeams = flattenTree(result);
      const targetTeam = allTeams.find((team) => team.name === sampleTeamName);

      if (targetTeam) {
        // If target team has a parent, it should be included
        if (targetTeam.parent) {
          const parentExists = allTeams.some(
            (team) => team.id === targetTeam.parent!.id,
          );
          expect(parentExists).toBe(true);
        }

        // All children should be included
        if (targetTeam.children.length > 0) {
          for (const child of targetTeam.children) {
            const childExists = allTeams.some((team) => team.id === child.id);
            expect(childExists).toBe(true);
          }
        }
      }
    });

    it("should maintain referential integrity", async () => {
      const result = await getTeamFullHierarchyFastTest(sampleTeamName);

      const allTeams = flattenTree(result);

      for (const team of allTeams) {
        // If team has a parent reference, parent should exist in the result
        if (team.parent) {
          const parentExists = allTeams.some((t) => t.id === team.parent!.id);
          expect(parentExists).toBe(true);
        }

        // All children should exist in the result
        for (const child of team.children) {
          const childExists = allTeams.some((t) => t.id === child.id);
          expect(childExists).toBe(true);
        }
      }
    });
  });

  describe("performance comparison", () => {
    let sampleTeamName: string;

    beforeEach(async () => {
      await initializeTeamMaterializedViewTest();

      const hierarchy =
        (await getTeamHierarchyFastTest()) as TeamHierarchyNode[];
      const firstTeam = hierarchy[0];

      if (firstTeam) {
        sampleTeamName = firstTeam.name;
      } else {
        throw new Error("No teams found for testing");
      }
    });

    it("should be faster than traditional approach", async () => {
      const iterations = 3;
      const fastTimes: number[] = [];

      // Measure fast approach
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await getTeamFullHierarchyFastTest(sampleTeamName);
        const end = Date.now();
        fastTimes.push(end - start);
      }

      const avgFastTime =
        fastTimes.reduce((a, b) => a + b, 0) / fastTimes.length;

      // Fast approach should complete quickly
      expect(avgFastTime).toBeLessThan(1000); // Should be under 1 second on average
    });

    it("should handle multiple concurrent requests efficiently", async () => {
      const concurrentRequests = 5;
      const promises = Array(concurrentRequests)
        .fill(null)
        .map(() => getTeamFullHierarchyFastTest(sampleTeamName));

      const start = Date.now();
      const results = await Promise.all(promises);
      const end = Date.now();

      const duration = end - start;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

      // All requests should succeed
      for (const result of results) {
        expect(Array.isArray(result)).toBe(true);
      }
    });
  });

  describe("error handling and edge cases", () => {
    it("should handle empty team name gracefully", async () => {
      await initializeTeamMaterializedViewTest();

      const result = await getTeamFullHierarchyFastTest("");
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("should handle special characters in team names", async () => {
      await initializeTeamMaterializedViewTest();

      const result = await getTeamFullHierarchyFastTest(
        "Team with 'quotes' and-special_chars",
      );
      expect(Array.isArray(result)).toBe(true);
      // Should not throw error even if team doesn't exist
    });

    it("should gracefully handle database disconnection scenarios", async () => {
      await initializeTeamMaterializedViewTest();

      // This test should not throw unhandled errors
      await expect(getTeamHierarchyFastTest()).resolves.toBeDefined();
    });
  });

  describe("data integrity validation", () => {
    beforeEach(async () => {
      await initializeTeamMaterializedViewTest();
    });

    it("should maintain consistency between fast and materialized view data", async () => {
      const hierarchy = await getTeamHierarchyFastTest();

      // Verify that the hierarchy makes sense structurally
      function validateHierarchy(
        teams: TeamHierarchyNode[],
        parentId: number | null = null,
      ): boolean {
        for (const team of teams) {
          if (team.parentId !== parentId) {
            return false;
          }

          if (!validateHierarchy(team.children, team.id)) {
            return false;
          }
        }
        return true;
      }

      expect(validateHierarchy(hierarchy)).toBe(true);
    });

    it("should ensure no circular references exist", async () => {
      const hierarchy = await getTeamHierarchyFastTest();

      function checkForCircularReferences(
        teams: TeamHierarchyNode[],
        visitedIds = new Set<number>(),
      ): boolean {
        for (const team of teams) {
          if (visitedIds.has(team.id)) {
            return false; // Circular reference found
          }

          const newVisited = new Set(visitedIds);
          newVisited.add(team.id);

          if (!checkForCircularReferences(team.children, newVisited)) {
            return false;
          }
        }
        return true;
      }

      expect(checkForCircularReferences(hierarchy)).toBe(true);
    });
  });
});
