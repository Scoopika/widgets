import { turso } from "@/utils/db";
import generateSecret from "@/utils/secret";
import { Endpoint, Scoopika } from "@scoopika/scoopika";
import { Widget } from "@scoopika/types";
import type { NextApiRequest, NextApiResponse } from "next";

const endpoints: Record<string, Endpoint> = {};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const quey = req.query;
  const id = quey?.id;

  if (typeof id !== "string") {
    return res.status(400).json({ success: false, error: "Invalid request" });
  }

  if (endpoints[id]) {
    const endpoint = endpoints[id];

    return endpoint.handleRequest({
      request: req.body,
      stream: (s) => res.write(s),
      end: () => res.end(),
    });
  }

  const { rows } = await turso.execute({
    sql: "SELECT * FROM Widget WHERE id=?",
    args: [id],
  });

  if (rows.length < 1) {
    return res.status(404).json({
      success: false,
      error: "Widget not found",
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

  return endpoint.handleRequest({
    request: req.body,
    stream: (s) => res.write(s),
    end: () => res.end(),
  });
}
