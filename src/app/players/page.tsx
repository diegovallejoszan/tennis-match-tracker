import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlayersPage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-6 text-2xl font-semibold">Players</h1>
      <Card>
        <CardHeader>
          <CardTitle>Opponents & partners</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Add and manage players you face on the court (Phase 2).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
