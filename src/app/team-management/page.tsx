import { api } from "~/trpc/server";
import TeamTable from "./_components./TeamTable";

export default async function TeamManagementPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string>>;
}) {
  let filter = "";
  let page = 1;
  let pageSize = 10;

  // Handle async searchParams in Next.js 15
  const resolvedSearchParams = await searchParams;

  if (resolvedSearchParams) {
    filter = resolvedSearchParams.filter ?? "";
    page = parseInt(resolvedSearchParams.page ?? "1", 10);
    pageSize = parseInt(resolvedSearchParams.pageSize ?? "10", 10);
  }

  const { teams, total } = await api.team.getTeamsPaginated({
    name: filter,
    page,
    pageSize,
  });

  return (
    <main className="flex flex-col gap-8 p-4">
      <h1 className="mb-4 text-2xl font-bold">Team Management</h1>
      <TeamTable
        teams={teams ?? []}
        filter={filter}
        page={page}
        pageSize={pageSize}
        total={total}
      />
    </main>
  );
}
