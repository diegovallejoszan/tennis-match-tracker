import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PreparePage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-6 text-2xl font-semibold">Prepare</h1>
      <Card>
        <CardHeader>
          <CardTitle>Match preparation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Select an opponent and get an AI-generated game plan (Phase 5).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
