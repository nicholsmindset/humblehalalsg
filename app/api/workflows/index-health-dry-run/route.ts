import { NextResponse } from "next/server";
import { getRun, start } from "workflow/api";
import { authorizeCron } from "@/lib/cron";
import { indexHealthDryRunWorkflow } from "@/workflows/index-health-dry-run";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.humblehalal.com";
  const run = await start(indexHealthDryRunWorkflow, [baseUrl]);
  return NextResponse.json(
    { ok: true, mode: "dry-run", runId: run.runId },
    { status: 202 },
  );
}

export async function GET(req: Request) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const runId = new URL(req.url).searchParams.get("runId");
  if (!runId) {
    return NextResponse.json({ ok: false, error: "runId is required" }, { status: 400 });
  }

  const run = getRun(runId);
  if (!(await run.exists)) {
    return NextResponse.json({ ok: false, error: "Workflow run not found" }, { status: 404 });
  }

  const status = await run.status;
  const result = status === "completed" ? await run.returnValue : null;
  return NextResponse.json({ ok: true, runId, status, result });
}
