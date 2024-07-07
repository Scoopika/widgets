import Chat from "@/components/chat";
import { turso } from "@/utils/db";
import readPlan from "@/utils/plan";
import { Widget } from "@scoopika/types";

interface Props {
  params: {
    id: string;
  };
  searchParams: {
    userId?: string;
    session_id?: string;
  };
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function WidgetPage({ params, searchParams }: Props) {
  const { id } = params;
  const { rows } = await turso.execute({
    sql: "SELECT * FROM Widget WHERE id=?",
    args: [id],
  });

  if (rows.length < 1)
    return (
      <div className="w-[100vw] h-[100vh] flex items-center justify-center">
        <div className="text-red-500">ERROR: Widget not found!</div>
      </div>
    );

  const widget = rows[0] as unknown as {
    id: string;
    userId: string;
    payload: string;
  };

  const widgetData = JSON.parse(widget.payload) as Widget;

  const user = (
    await await turso.execute({
      sql: "SELECT * FROM User WHERE id=?",
      args: [widget.userId],
    })
  ).rows[0] as unknown as { plan: string };

  const plan = readPlan(user.plan);

  if (plan !== "free") {
    return <div className="w-[100vw] h-[100vh] flex items-center justify-center">
      <div className="text-sm">You {"can't"} run widgets on the free plan!</div>
    </div>
  }

  return (
    <Chat
      widget={widgetData}
      userId={searchParams?.userId || `${crypto.randomUUID()}`}
      session_id={searchParams?.session_id}
      plan={plan}
    />
  );
}
