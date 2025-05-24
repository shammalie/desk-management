import { api } from "~/trpc/server";
import TeamTable from "./_components./TeamTable";

export default async function TeamManagementPage({ searchParams }: { searchParams?: Record<string, string> | URLSearchParams }) {
  let filter = '';
  let page = 1;
  let pageSize = 10;

  if (searchParams) {
    if (typeof window !== 'undefined' && searchParams instanceof URLSearchParams) {
      // Should not happen on server, but for safety
      filter = searchParams.get('filter') ?? '';
      page = parseInt(searchParams.get('page') ?? '1', 10);
      pageSize = parseInt(searchParams.get('pageSize') ?? '10', 10);
    } else if (typeof searchParams === 'object' && 'get' in searchParams && typeof searchParams.get === 'function') {
      // URLSearchParams
      filter = searchParams.get('filter') ?? '';
      page = parseInt(searchParams.get('page') ?? '1', 10);
      pageSize = parseInt(searchParams.get('pageSize') ?? '10', 10);
    } else {
      // Record<string, string>
      const params = searchParams as Record<string, string>;
      filter = params.filter ?? '';
      page = parseInt(params.page ?? '1', 10);
      pageSize = parseInt(params.pageSize ?? '10', 10);
    }
  }

  const { teams, total } = await api.team.getTeamsPaginated({ name: filter, page, pageSize });

  return (
    <main className="flex flex-col gap-8 p-4">
      <h1 className="text-2xl font-bold mb-4">Team Management</h1>
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
