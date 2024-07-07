import { turso } from "@/utils/db";
import generateSecret from "@/utils/secret";
import { Endpoint, Scoopika } from "@scoopika/scoopika";
import { Widget } from "@scoopika/types";
import { NextApiRequest, NextApiResponse } from "next";

const endpoints: Record<string, Endpoint> = {};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;
    const body = req.body;

    if (typeof id !== "string") {
        return res.status(400).json(
            { success: false, error: "Invalid request" }
        );
    }

    if (endpoints[id]) {
        const endpoint = endpoints[id];

        res.setHeader("Content-Type", "text/plain");
        res.setHeader("Transfer-Encoding", "chunked");

        await endpoint.handleRequest({
            request: body,
            stream: (s) => res.write(s),
            end: () => res.end(),
        });
    }

    const { rows } = await turso.execute({
        sql: "SELECT * FROM Widget WHERE id=?",
        args: [id],
    });

    if (rows.length < 1) {
        return res.status(400).json({
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

    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Transfer-Encoding", "chunked");

    await endpoint.handleRequest({
        request: body,
        stream: (s) => res.write(s),
        end: () => res.end(),
    });
}
