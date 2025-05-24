import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/common/card';
import type { TeamWithRelations } from '~/server/schemas/team';

interface OverviewProps {
    teams: TeamWithRelations[];
}

export default function Overview({ teams }: OverviewProps) {
    const totalTeams = teams.length;
    const totalParentCount = teams.reduce((sum, t) => sum + t.parentCount, 0);
    const totalChildCount = teams.reduce((sum, t) => sum + t.childCount, 0);

    return (
        <div className="flex flex-row gap-4 mb-4">
            <Card className="flex-1">
                <CardHeader>
                    <CardTitle>Total Teams</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold mb-1">{totalTeams}</div>
                    <div className="text-muted-foreground text-sm">Number of teams in the system</div>
                </CardContent>
            </Card>
            <Card className="flex-1">
                <CardHeader>
                    <CardTitle>Total Parent Relationships</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold mb-1">{totalParentCount}</div>
                    <div className="text-muted-foreground text-sm">Sum of all teams with a parent</div>
                </CardContent>
            </Card>
            <Card className="flex-1">
                <CardHeader>
                    <CardTitle>Total Child Relationships</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold mb-1">{totalChildCount}</div>
                    <div className="text-muted-foreground text-sm">Sum of all child team relationships</div>
                </CardContent>
            </Card>
        </div>
    );
} 