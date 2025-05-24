import { CustomTable } from "./_components/table";

export default async function TablePage() {
  return (
    <main>
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-3xl">Example DataTable</h2>
          <p className="text-sm">
            This is an example data table that supports an nested table to
            display further table data for a condensed approach to showing
            information.
          </p>
        </div>
        <CustomTable />
      </div>
    </main>
  );
}
