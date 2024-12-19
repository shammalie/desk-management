import Flow from "~/components/ui/react-flow/flow";

export default async function Home() {
  return (
    <main className="h-full w-full">
      <Flow canEdit />
    </main>
  );
}
