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
