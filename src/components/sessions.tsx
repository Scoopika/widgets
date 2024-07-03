"use client";

import { Client } from "@scoopika/client";
import { UserRunHistory, Widget } from "@scoopika/types";
import { useEffect, useState } from "react";
import Loading from "./loading";
import { HiChatAlt2 } from "react-icons/hi";
import { FaChevronRight } from "react-icons/fa6";
import Empty from "@/components/empty";
import { Button } from "@nextui-org/react";
import { PlanType } from "@/utils/plan";
import Powered from "@/components/powered";

interface Props {
  client: Client;
  userId: string;
  widget: Widget;
  setSession: (id: string) => any;
  plan: PlanType;
}

interface DisplaySession {
  title: string;
  id: string;
}

export default function Sessions({
  client,
  userId,
  widget,
  setSession,
  plan
}: Props) {
  const [loading, setLoading] = useState<boolean>(true);
  const [sessions, setSessions] = useState<DisplaySession[]>([]);
  const [newLoading, setNewLoading] = useState<boolean>(false);

  const loadSessions = async () => {
    setLoading(true);
    const ids = await client.store.listUserSessions(userId);
    const displaySessions: DisplaySession[] = [];

    for await (const id of ids) {
      const message = (await client.store.getSessionMessages(id))[0];
      if (!message) continue;

      displaySessions.push({
        id,
        title: (message as UserRunHistory).request.message || "Previous chat",
      });
    }

    setSessions(displaySessions);
    setLoading(false);
  };

  const newSession = async () => {
    if (newLoading) return;
    setNewLoading(true);
    try {
      const ses = await client.store.newSession({
        user_id: userId,
      });
      setSession(ses.id);
    } finally {
      setNewLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  if (loading) {
    return <Loading color={widget.textColor} />;
  }

  return (
    <div className="p-6">
      <div className="font-semibold mb-3">Your chats</div>

      {sessions.length < 1 ? (
        <Empty
          widget={widget}
          icon={<HiChatAlt2 size={22} />}
          title="You have no chats yet"
          description="Start your first chat with AI now!"
        >
          <Button
            size="sm"
            variant={widget.theme}
            style={{
              backgroundColor: widget.primaryColor,
              color: widget.primaryTextColor,
            }}
            className="font-semibold"
            endContent={<FaChevronRight />}
            onPress={newSession}
            isLoading={newLoading}
          >
            Start new chat
          </Button>
        </Empty>
      ) : (
        <div className="w-full flex flex-col gap-3 pb-24">
          <div className="fixed md:relative w-full bottom-0 left-0 p-3 md:p-0 md:pt-3">
            <Button
              size="sm"
              variant={widget.theme}
              style={{
                backgroundColor: widget.primaryColor,
                color: widget.primaryTextColor,
              }}
              className="font-semibold w-full"
              endContent={<FaChevronRight />}
              onPress={newSession}
              isLoading={newLoading}
            >
              Start new chat
            </Button>
          </div>
          {sessions.map((ses) => (
            <Button
              key={`session-item-${ses.id}`}
              variant={widget.theme}
              size="sm"
              onPress={() => setSession(ses.id)}
            >
              <div className="truncate w-full text-start">{ses.title}</div>
            </Button>
          ))}
        </div>
      )}
      {plan !== "scale" && (
        <Powered />
      )}
    </div>
  );
}
