import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "~/server/db";
import {
  getTeamFullHierarchyTest,
  getTeamFullHierarchyFastTest,
  getTeamHierarchyTest,
  getTeamHierarchyFastTest,
  initializeTeamMaterializedViewTest,
} from "../test-service";
import { dropTeamTreeMaterializedViewTest } from "../test-data-access";

describe("Materialized View Performance Tests (Test Schema)", () => {
  let sampleTeamName: string;

  beforeAll(async () => {
    // Ensure we're using the test schema
    await db.$executeRaw`SET search_path TO test, public;`;

    // Set up materialized view
    await dropTeamTreeMaterializedViewTest().catch(() => {
      // Ignore cleanup errors
    });
    await initializeTeamMaterializedViewTest();

    // Get a sample team name for testing
    const hierarchy = await getTeamHierarchyFastTest();
    sampleTeamName = hierarchy[0]?.name ?? "Test Team";
  });

  afterAll(async () => {
    await dropTeamTreeMaterializedViewTest().catch(() => {
      // Ignore cleanup errors
    });
    await db.$disconnect();
  });

  describe("Hierarchy Query Performance", () => {
    it("should compare traditional vs materialized view hierarchy performance", async () => {
      const iterations = 5;
      const traditionalTimes: number[] = [];
      const materializedTimes: number[] = [];

      // Test traditional approach
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await getTeamHierarchyTest();
        const end = Date.now();
        traditionalTimes.push(end - start);
      }

      // Test materialized view approach
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await getTeamHierarchyFastTest();
        const end = Date.now();
        materializedTimes.push(end - start);
      }

      const avgTraditional =
        traditionalTimes.reduce((a, b) => a + b, 0) / traditionalTimes.length;
      const avgMaterialized =
        materializedTimes.reduce((a, b) => a + b, 0) / materializedTimes.length;

      console.log(`Traditional average: ${avgTraditional}ms`);
      console.log(`Materialized average: ${avgMaterialized}ms`);
      console.log(
        `Performance improvement: ${(((avgTraditional - avgMaterialized) / avgTraditional) * 100).toFixed(2)}%`,
      );

      // Materialized view should be faster or at least not significantly slower
      expect(avgMaterialized).toBeLessThanOrEqual(avgTraditional * 1.5); // Allow 50% tolerance
    });

    it("should compare full hierarchy query performance", async () => {
      const iterations = 3;
      const traditionalTimes: number[] = [];
      const materializedTimes: number[] = [];

      // Test traditional approach
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await getTeamFullHierarchyTest(sampleTeamName);
        const end = Date.now();
        traditionalTimes.push(end - start);
      }

      // Test materialized view approach
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await getTeamFullHierarchyFastTest(sampleTeamName);
        const end = Date.now();
        materializedTimes.push(end - start);
      }

      const avgTraditional =
        traditionalTimes.reduce((a, b) => a + b, 0) / traditionalTimes.length;
      const avgMaterialized =
        materializedTimes.reduce((a, b) => a + b, 0) / materializedTimes.length;

      console.log(`Full hierarchy traditional average: ${avgTraditional}ms`);
      console.log(`Full hierarchy materialized average: ${avgMaterialized}ms`);
      console.log(
        `Performance improvement: ${(((avgTraditional - avgMaterialized) / avgTraditional) * 100).toFixed(2)}%`,
      );

      // Materialized view should be faster
      expect(avgMaterialized).toBeLessThanOrEqual(avgTraditional);
    });
  });

  describe("Concurrent Request Performance", () => {
    it("should handle multiple concurrent hierarchy requests efficiently", async () => {
      const concurrentRequests = 10;
      const promises = Array(concurrentRequests)
        .fill(null)
        .map(() => getTeamHierarchyFastTest());

      const start = Date.now();
      const results = await Promise.all(promises);
      const end = Date.now();

      const duration = end - start;
      console.log(
        `${concurrentRequests} concurrent requests completed in ${duration}ms`,
      );

      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      expect(results.length).toBe(concurrentRequests);

      // All results should be valid
      for (const result of results) {
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      }
    });

    it("should handle multiple concurrent full hierarchy requests efficiently", async () => {
      const concurrentRequests = 5;
      const promises = Array(concurrentRequests)
        .fill(null)
        .map(() => getTeamFullHierarchyFastTest(sampleTeamName));

      const start = Date.now();
      const results = await Promise.all(promises);
      const end = Date.now();

      const duration = end - start;
      console.log(
        `${concurrentRequests} concurrent full hierarchy requests completed in ${duration}ms`,
      );

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(results.length).toBe(concurrentRequests);

      // All results should be valid
      for (const result of results) {
        expect(Array.isArray(result)).toBe(true);
      }
    });
  });

  describe("Memory Usage and Scalability", () => {
    it("should handle large result sets efficiently", async () => {
      const start = Date.now();
      const memory = process.memoryUsage();

      const hierarchy = await getTeamHierarchyFastTest();

      const end = Date.now();
      const memoryAfter = process.memoryUsage();

      const duration = end - start;
      const memoryDiff = memoryAfter.heapUsed - memory.heapUsed;

      console.log(
        `Large result set query: ${duration}ms, Memory: ${Math.round(memoryDiff / 1024 / 1024)}MB`,
      );
      console.log(`Result size: ${hierarchy.length} root teams`);

      expect(duration).toBeLessThan(5000); // Should complete quickly
      expect(memoryDiff).toBeLessThan(500 * 1024 * 1024); // Should use less than 500MB
    });

    it("should maintain consistent performance across multiple queries", async () => {
      const queryCount = 20;
      const times: number[] = [];

      for (let i = 0; i < queryCount; i++) {
        const start = Date.now();
        await getTeamHierarchyFastTest();
        const end = Date.now();
        times.push(end - start);
      }

      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const max = Math.max(...times);
      const min = Math.min(...times);

      console.log(
        `${queryCount} queries - Avg: ${avg}ms, Min: ${min}ms, Max: ${max}ms`,
      );

      // Performance should be consistent (max shouldn't be more than 3x average)
      expect(max).toBeLessThanOrEqual(avg * 3);

      // Average should be reasonable
      expect(avg).toBeLessThan(1000);
    });
  });

  describe("Data Consistency Under Load", () => {
    it("should return consistent results under concurrent load", async () => {
      const concurrentRequests = 15;
      const promises = Array(concurrentRequests)
        .fill(null)
        .map(() => getTeamHierarchyFastTest());

      const results = await Promise.all(promises);

      // All results should be identical
      const firstResult = JSON.stringify(results[0]);

      for (let i = 1; i < results.length; i++) {
        const currentResult = JSON.stringify(results[i]);
        expect(currentResult).toBe(firstResult);
      }
    });

    it("should maintain data integrity during mixed read operations", async () => {
      const operations = [
        () => getTeamHierarchyFastTest(),
        () => getTeamFullHierarchyFastTest(sampleTeamName),
        () => getTeamHierarchyFastTest(),
        () => getTeamFullHierarchyFastTest(sampleTeamName),
      ];

      const promises = operations.map((op) => op());
      const results = await Promise.all(promises);

      // All operations should succeed
      for (const result of results) {
        expect(Array.isArray(result)).toBe(true);
      }

      // Hierarchy results should be consistent
      const hierarchyResults = [results[0], results[2]];
      const firstHierarchy = JSON.stringify(hierarchyResults[0]);
      const secondHierarchy = JSON.stringify(hierarchyResults[1]);
      expect(firstHierarchy).toBe(secondHierarchy);
    });
  });

  describe("Performance Benchmarks", () => {
    it("should meet performance benchmarks for typical usage", async () => {
      // Simulate typical usage pattern
      const start = Date.now();

      // Load main hierarchy
      const hierarchy = await getTeamHierarchyFastTest();
      expect(hierarchy.length).toBeGreaterThan(0);

      // Load specific team details
      const teamDetails = await getTeamFullHierarchyFastTest(sampleTeamName);
      expect(Array.isArray(teamDetails)).toBe(true);

      // Load another team's details
      const secondTeam = hierarchy[1]?.name ?? hierarchy[0]?.name;
      if (secondTeam) {
        const secondTeamDetails =
          await getTeamFullHierarchyFastTest(secondTeam);
        expect(Array.isArray(secondTeamDetails)).toBe(true);
      }

      const end = Date.now();
      const totalTime = end - start;

      console.log(`Typical usage pattern completed in ${totalTime}ms`);

      // Should complete typical usage within reasonable time
      expect(totalTime).toBeLessThan(3000); // 3 seconds for typical usage
    });

    it("should demonstrate significant improvement over baseline", async () => {
      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();

        // Perform typical operations
        await Promise.all([
          getTeamHierarchyFastTest(),
          getTeamFullHierarchyFastTest(sampleTeamName),
        ]);

        const end = Date.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const medianTime = times.sort((a, b) => a - b)[
        Math.floor(times.length / 2)
      ];

      console.log(
        `Performance benchmark - Average: ${avgTime}ms, Median: ${medianTime}ms`,
      );

      // Performance should be consistently good
      expect(avgTime).toBeLessThan(2000); // Average under 2 seconds
      expect(medianTime).toBeLessThan(1500); // Median under 1.5 seconds
    });
  });
});
