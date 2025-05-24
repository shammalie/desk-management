import Link from 'next/link';
import { notFound } from 'next/navigation';
import TeamHierarchyFlow from './_components/TeamHierarchyFlow';
import { api } from '~/trpc/server';
import { type TeamTree } from '~/server/schemas/team';
import { Button } from '~/components/ui/common/button';
import { ArrowLeft } from 'lucide-react';

interface TeamPageProps {
    params: { slug: string };
}

export default async function TeamManagementTeamPage({ params }: TeamPageProps) {
    const { slug } = params;
    if (typeof slug !== 'string' || !slug.trim()) {
        notFound();
        return null;
    }
    const teamName = decodeURIComponent(slug);
    const treeResult = await api.team.getTeamFullHierarchy({ name: teamName });
    const tree = Array.isArray(treeResult) ? treeResult as TeamTree[] : [];
    if (!tree.length) {
        notFound();
        return null;
    }
    const highlightedTeam = tree.flatMap(function flatten(t): TeamTree[] {
        return [t, ...(t.children ? t.children.flatMap(flatten) : [])];
    }).find(t => t.name === teamName);
    return (
        <main className="flex flex-col max-w-full h-full">
            <div className="w-full flex flex-col items-start mb-4">
                <Link href="/team-management" className="inline-block mb-2">
                    <Button variant="outline">
                        <ArrowLeft className="w-4 h-4" />
                        <span>
                            Back to Team Management
                        </span>
                    </Button>
                </Link>
            </div>
            <h1 className="text-2xl font-bold mb-4">{decodeURIComponent(slug)}</h1>
            <div className="w-full h-full">
                <TeamHierarchyFlow tree={tree} highlightedTeamId={highlightedTeam ? String(highlightedTeam.id) : ''} />
            </div>
        </main >
    );
} 