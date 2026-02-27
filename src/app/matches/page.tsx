import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MatchesPage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-6 text-2xl font-semibold">Matches</h1>
      <Card>
        <CardHeader>
          <CardTitle>Match history</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Record and review your matches, scores, and learnings (Phase 3).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
