import { NextResponse } from "next/server";
import { buildHelloResponse, helloResponseSchema } from "@/lib/hello";

export async function GET(): Promise<NextResponse> {
  const payload = helloResponseSchema.parse(buildHelloResponse());
  return NextResponse.json(payload, { status: 200 });
}
