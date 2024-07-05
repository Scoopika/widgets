import { turso } from "@/utils/db";
import generateSecret from "@/utils/secret";
import { Endpoint, Scoopika } from "@scoopika/scoopika";
import { Widget } from "@scoopika/types";
import { NextRequest, NextResponse } from "next/server";

const endpoints: Record<string, Endpoint> = {};

export async function POST(req: NextRequest, res: NextResponse) {
  const paths = req.url.split("/");
  const id = paths[paths.length - 1];
  const body = await req.json();

  if (typeof id !== "string") {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      {
        status: 400,
      }
    );
  }

  if (endpoints[id]) {
    const endpoint = endpoints[id];

    const stream = new ReadableStream({
      start(controller) {
        endpoint.handleRequest({
          request: body,
          stream: (s) => controller.enqueue(s),
          end: () => controller.close(),
        });
      },
    });

    return new NextResponse(stream);
  }

  const { rows } = await turso.execute({
    sql: "SELECT * FROM Widget WHERE id=?",
    args: [id],
  });

  if (rows.length < 1) {
    return NextResponse.json({
      success: false,
      error: "Widget not found",
    }, {
        status: 404
    });
  }

  const widget = rows[0] as unknown as Widget;
  const secret = await generateSecret();
  const tokenRes = await fetch(`${process.env.SCOOPIKA_SOURCE}/private/token`, {
    method: "POST",
    headers: {
      Authorization: secret,
    },
    body: JSON.stringify({
      userId: widget.userId,
      expiresIn: "1d",
    }),
  });
  const { token } = await tokenRes.json();

  const scoopika = new Scoopika({
    token,
    store: widget.store,
    beta_allow_knowledge: true,
  });

  const endpoint = new Endpoint({
    scoopika,
    agents: [widget.agentId],
  });
  endpoints[id] = endpoint;

  const stream = new ReadableStream({
    start(controller) {
      endpoint.handleRequest({
        request: body,
        stream: (s) => controller.enqueue(s),
        end: () => controller.close(),
      });
    },
  });

  return new NextResponse(stream);
}
