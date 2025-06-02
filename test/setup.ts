import { beforeAll, afterAll } from "vitest";
import dotenv from "dotenv";
import { db } from "~/server/db";

// Load environment variables for testing
dotenv.config({ path: ".env" });

// Ensure we have required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for testing");
}

beforeAll(async () => {
  console.log("Setting up test environment...");

  try {
    // Clean up any existing test data
    await db.team.deleteMany({});
    console.log("Cleaned up existing test data");

    // Create comprehensive test data using Prisma ORM
    console.log("Creating test data...");

    // Create root teams first
    const rootTeam1 = await db.team.create({
      data: {
        name: "Root Team 1",
        parentId: null,
      },
    });

    const rootTeam2 = await db.team.create({
      data: {
        name: "Root Team 2",
        parentId: null,
      },
    });

    // Create second level teams
    const engineering = await db.team.create({
      data: {
        name: "Engineering",
        parentId: rootTeam1.id,
      },
    });

    const marketing = await db.team.create({
      data: {
        name: "Marketing",
        parentId: rootTeam1.id,
      },
    });

    const sales = await db.team.create({
      data: {
        name: "Sales",
        parentId: rootTeam1.id,
      },
    });

    // Create third level teams (Engineering children)
    const frontend = await db.team.create({
      data: {
        name: "Frontend",
        parentId: engineering.id,
      },
    });

    const backend = await db.team.create({
      data: {
        name: "Backend",
        parentId: engineering.id,
      },
    });

    const devops = await db.team.create({
      data: {
        name: "DevOps",
        parentId: engineering.id,
      },
    });

    // Create third level teams (Marketing children)
    const content = await db.team.create({
      data: {
        name: "Content",
        parentId: marketing.id,
      },
    });

    const socialMedia = await db.team.create({
      data: {
        name: "Social Media",
        parentId: marketing.id,
      },
    });

    // Create third level teams (Sales children)
    const enterpriseSales = await db.team.create({
      data: {
        name: "Enterprise Sales",
        parentId: sales.id,
      },
    });

    const smbSales = await db.team.create({
      data: {
        name: "SMB Sales",
        parentId: sales.id,
      },
    });

    // Create fourth level teams (Frontend children)
    await db.team.createMany({
      data: [
        {
          name: "UI/UX",
          parentId: frontend.id,
        },
        {
          name: "React Team",
          parentId: frontend.id,
        },
      ],
    });

    // Create fourth level teams (Backend children)
    await db.team.createMany({
      data: [
        {
          name: "Node.js Team",
          parentId: backend.id,
        },
        {
          name: "Database Team",
          parentId: backend.id,
        },
      ],
    });

    // Create fourth level teams (DevOps children)
    await db.team.createMany({
      data: [
        {
          name: "Infrastructure",
          parentId: devops.id,
        },
        {
          name: "Monitoring",
          parentId: devops.id,
        },
      ],
    });

    // Create fourth level teams (Content children)
    await db.team.createMany({
      data: [
        {
          name: "Blog Team",
          parentId: content.id,
        },
        {
          name: "Video Team",
          parentId: content.id,
        },
      ],
    });

    // Get some teams for fifth level
    const uiUx = await db.team.findFirst({ where: { name: "UI/UX" } });
    const reactTeam = await db.team.findFirst({
      where: { name: "React Team" },
    });
    const nodeTeam = await db.team.findFirst({
      where: { name: "Node.js Team" },
    });
    const infrastructure = await db.team.findFirst({
      where: { name: "Infrastructure" },
    });

    // Create fifth level teams
    if (uiUx) {
      await db.team.create({
        data: {
          name: "Design System",
          parentId: uiUx.id,
        },
      });
    }

    if (reactTeam) {
      await db.team.create({
        data: {
          name: "Mobile Team",
          parentId: reactTeam.id,
        },
      });
    }

    if (nodeTeam) {
      await db.team.create({
        data: {
          name: "API Team",
          parentId: nodeTeam.id,
        },
      });
    }

    if (infrastructure) {
      await db.team.createMany({
        data: [
          {
            name: "Cloud Infrastructure",
            parentId: infrastructure.id,
          },
          {
            name: "Security",
            parentId: infrastructure.id,
          },
        ],
      });
    }

    // Get final count
    const totalTeams = await db.team.count();
    console.log(`Created ${totalTeams} test teams successfully`);
    console.log("Test environment setup completed");
  } catch (error) {
    console.error("Error setting up test environment:", error);
    throw error;
  }
});

afterAll(async () => {
  console.log("Tearing down test environment...");

  try {
    // Clean up test data
    await db.team.deleteMany({});
    console.log("Test data cleaned up");
  } catch (error) {
    console.error("Error during test cleanup:", error);
  } finally {
    await db.$disconnect();
  }
});
