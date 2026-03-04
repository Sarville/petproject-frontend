import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const { searchParams } = new URL(request.url);

  const externalPath = path.join("/");
  const query = searchParams.toString();
  const externalUrl = `https://artsearch.io/api/${externalPath}${query ? `?${query}` : ""}`;

  try {
    const response = await fetch(externalUrl, {
      headers: {
        Authorization: `Bearer ${process.env.ARTSEARCH_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Upstream responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "External API error" },
      { status: 418 }
    );
  }
}
