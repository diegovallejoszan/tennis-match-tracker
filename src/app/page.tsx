import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-3xl font-bold">Tennis Match Tracker</h1>
        <p className="mb-8 text-muted-foreground">
          Learning-first tennis match tracking. Phase 0 baseline is ready.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">
                Overview and stats (Phase 4).
              </p>
              <Button asChild variant="secondary" size="sm">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Players</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">
                Manage opponents and partners (Phase 2).
              </p>
              <Button asChild variant="secondary" size="sm">
                <Link href="/players">Go to Players</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Matches</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">
                Record and review matches (Phase 3).
              </p>
              <Button asChild variant="secondary" size="sm">
                <Link href="/matches">Go to Matches</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Prepare</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">
                AI game plans (Phase 5).
              </p>
              <Button asChild variant="secondary" size="sm">
                <Link href="/prepare">Go to Prepare</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
