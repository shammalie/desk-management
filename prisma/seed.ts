/**
 * This is the entry point for Prisma seeding.
 * Add your seed logic here.
 */

import { db } from "../src/server/db";
import { faker } from "@faker-js/faker/locale/en";

async function main() {
  // Step 1: Generate 10,000 unique random team names
  const TEAM_COUNT = 10000;
  const teamNames = new Set<string>();
  while (teamNames.size < TEAM_COUNT) {
    teamNames.add(faker.company.name());
  }

  // Step 2: Create all teams (no parentId yet)
  const createdTeams = await Promise.all(
    Array.from(teamNames).map((name) => db.team.create({ data: { name } })),
  );

  // Step 3: Randomly assign parentId to some teams (no loops)
  // To avoid loops, only assign as parent a team with a lower index (created before)
  for (let i = 1; i < createdTeams.length; i++) {
    // 50% chance to assign a parent
    if (Math.random() < 0.5) {
      // Only pick from teams created before this one
      const possibleParents = createdTeams.slice(0, i);
      // To avoid degenerate chains, only allow up to 10 children per parent
      const selectedTeam = createdTeams[i];
      if (selectedTeam) {
        const parentCandidates = possibleParents.filter(
          (parent) => parent.id !== selectedTeam.id,
        );
        if (parentCandidates.length > 0) {
          const parentIndex = Math.floor(
            Math.random() * parentCandidates.length,
          );
          const parent = parentCandidates[parentIndex];
          const team = createdTeams[i];
          if (!parent || !team || typeof parent.id === "undefined") {
            continue;
          }
          await db.team.update({
            where: { id: team.id },
            data: { parentId: parent.id },
          });
        }
      }
      // else, leave parentId as null
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void db.$disconnect();
  });
