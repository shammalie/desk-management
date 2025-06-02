import Link from "next/link";
import { notFound } from "next/navigation";
import TeamHierarchyFlow from "./_components/TeamHierarchyFlow";
import { api } from "~/trpc/server";
import { type TeamTree } from "~/server/schemas/team";
import { Button } from "~/components/ui/common/button";
import { ArrowLeft } from "lucide-react";

interface TeamPageProps {
  params: Promise<{ slug: string }>;
}

export default async function TeamManagementTeamPage({
  params,
}: TeamPageProps) {
  const { slug } = await params;
  if (typeof slug !== "string" || !slug.trim()) {
    notFound();
    return null;
  }
  const teamName = decodeURIComponent(slug);
  const treeResult = await api.team.getTeamFullHierarchy({ name: teamName });
  const tree = Array.isArray(treeResult) ? treeResult : [];
  if (!tree.length) {
    notFound();
    return null;
  }
  const highlightedTeam = tree
    .flatMap(function flatten(t): TeamTree[] {
      return [t, ...(t.children ? t.children.flatMap(flatten) : [])];
    })
    .find((t) => t.name === teamName);
  return (
    <main className="flex h-full max-w-full flex-col">
      <div className="mb-4 flex w-full flex-col items-start">
        <Link href="/team-management" className="mb-2 inline-block">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Team Management</span>
          </Button>
        </Link>
      </div>
      <h1 className="mb-4 text-2xl font-bold">{decodeURIComponent(slug)}</h1>
      <div className="h-full w-full">
        <TeamHierarchyFlow
          tree={tree}
          highlightedTeamId={highlightedTeam ? String(highlightedTeam.id) : ""}
        />
      </div>
    </main>
  );
}
