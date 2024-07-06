"use client";

import { Agent, Client } from "@scoopika/client";
import { AgentData, Widget } from "@scoopika/types";
import { useEffect, useState } from "react";
import Container from "./container";
import Sessions from "./sessions";
import ChatInterface from "./chatInterface";
import Loading from "./loading";
import { PlanType } from "@/utils/plan";
import VoiceChatInterface from "./voiceInterface";

interface Props {
  userId: string;
  widget: Widget;
  plan: PlanType;
}

export default function Chat({ userId, widget, plan }: Props) {
  const client = new Client(`/api/scoopika/${widget.id}`);
  const agent = new Agent(widget.agentId, client);
  const [session, setSession] = useState<string | undefined>(undefined);
  const [agentData, setAgentData] = useState<AgentData | null>(null);

  const loadAgent = async () => {
    const data = await agent.load();
    setAgentData(data);
  }

  useEffect(() => {
    if (!agentData) loadAgent();
  }, []);

  if (!agentData) {
    return <Container widget={widget}>
      <div className="p-6">
      <Loading color={widget.primaryColor} />
      </div>
    </Container>
  }

  if (!session) {
    return (
      <Container widget={widget}>
        <Sessions
          client={client}
          widget={widget}
          userId={userId}
          setSession={setSession}
          plan={plan}
        />
      </Container>
    );
  }

  if (widget.type === "chat") {
    return (
      <Container widget={widget}>
        <ChatInterface
          plan={plan}
          agentData={agentData}
          client={client}
          agent={agent}
          widget={widget}
          session={session}
          setSession={setSession}
        />
      </Container>
    );
  }

  return (
    <Container widget={widget}>
      <VoiceChatInterface
        plan={plan}
        agentData={agentData}
        client={client}
        agent={agent}
        widget={widget}
        session={session}
        setSession={setSession}
      />
    </Container>
  );
  
}
