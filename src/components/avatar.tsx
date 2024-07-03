import { AgentData } from "@scoopika/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Props {
  agentData: AgentData;
}

export default function AgentAvatar({ agentData }: Props) {
  return (
    <Avatar>
      <AvatarImage src={agentData.avatar} />
      <AvatarFallback>{agentData.name.substring(0, 2)}</AvatarFallback>
    </Avatar>
  );
}
