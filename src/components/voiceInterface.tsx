"use client";

import { Button } from "@nextui-org/react";
import { Agent, Client } from "@scoopika/client";
import { useVoiceChatState } from "@scoopika/react";
import { AgentData, Widget } from "@scoopika/types";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { FaChevronLeft, FaPause, FaPlay } from "react-icons/fa6";
import { MdContentCopy } from "react-icons/md";
import Powered from "@/components/powered";
import { PlanType } from "@/utils/plan";
import { IoIosClose, IoMdClose } from "react-icons/io";
import { LuImagePlus } from "react-icons/lu";
import { FaExternalLinkAlt, FaMicrophone } from "react-icons/fa";
import { TbKeyboardHide } from "react-icons/tb";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { RiSendPlane2Fill } from "react-icons/ri";
import { z } from "zod";

interface Props {
  client: Client;
  agent: Agent;
  widget: Widget;
  session: string;
  agentData: AgentData;
  setSession: (v: string | undefined) => any;
  plan: PlanType;
}

const MarkdownRenderer = ({ content }: { content: string }) => {
  return (
    <ReactMarkdown
      className="max-w-[100vw] overflow-hidden flex flex-col whitespace-pre-wrap break-word"
      components={{
        code({ node, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          return match ? (
            <div className="relative group">
              <SyntaxHighlighter
                style={atomDark as any}
                language={match[1]}
                PreTag="div"
                {...(props as any)}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
              <Button
                isIconOnly
                startContent={<MdContentCopy />}
                variant="flat"
                className="backdrop-blur absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all"
                onPress={() => navigator.clipboard.writeText(String(children))}
              />
            </div>
          ) : (
            <code className="pl-1 pr-1 text-xs bg-accent/30 border rounded-md">
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default function VoiceChatInterface({
  client,
  agent,
  widget,
  session,
  setSession,
  plan,
}: Props) {
  const {
    loading,
    generating,
    newRequest,
    status,
    voicePlaying,
    agentVoicePaused,
    voiceRecorder,
    recorderState,
    recognizedText,
    pauseAgentVoice,
    resumeAgentVoice,
    messages,
    updateRecognizedText
  } = useVoiceChatState(client, agent, {
    session_id: session,
    agent_voice: {
      audio: "agent-voice-audio",
      canvas: "agent-voice-canvas",
      wave_color: widget.waveColor,
    },
  });

  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<boolean>(false);
  const [images, setImages] = useState<string[]>([]);
  const [recorderOpen, setRecorderOpen] = useState<boolean>(false);
  const [actions, setActions] = useState<Widget["actions"]>([]);

  console.log(messages);

  const addActions = () => {
    widget.actions.forEach(action => {
      agent.addClientAction({
        name: action.id,
        description: `Display a button '${action.title}'`,
        parameters: z.object({}),
        execute: () => {
          setActions([action])
        }
      });
    })
  }

  useEffect(() => {
    if (voiceRecorder) {
      voiceRecorder.addVisualizer("user-voice-canvas", widget.waveColor);
    }

    if ((widget.actions || []).length > 0) {
      addActions();
    }

    return () => {
      if (voiceRecorder) {
        try {
          voiceRecorder.stop();
        } catch { } // no need for anything here
      }
    };
  }, [voiceRecorder]);

  const run = async () => {
    if (message.length < 1) return;

    try {
      newRequest({
        inputs: { message, images: images.length > 0 ? images : undefined },
      });
    } catch {
      setError(true);
    }

    setMessage("");
  };

  const runAudio = async () => {
    try {
      setRecorderOpen(false);
      newRequest({
        inputs: { message, images: images.length > 0 ? images : undefined }
      });
    } catch (err) {
      console.error(err);
    }

    setMessage("");
  };

  const startRecorder = () => {
    if (!voiceRecorder) {
      return;
    }

    voiceRecorder.start();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e?.target?.files || []);
    const imageFiles = files.map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imageFiles)
      .then((imagePreviews) => setImages((prev) => [...prev, ...imagePreviews]))
      .catch((_error) => setError(true));
  };

  return (
    <div className="w-screen flex flex-col overflow-hidden">
      <Button
        size="sm"
        variant="light"
        isIconOnly
        startContent={<FaChevronLeft />}
        onPress={() => setSession(undefined)}
        className="fixed top-2 left-2 z-30"
      />

      {plan !== "scale" && <Powered className="mt-4" />}

      <div className="flex flex-col gap-5 p-7 max-w-screen pb-24 overflow-hidden max-w-screen">
        <div className="p-10 w-full flex items-center justify-center">
          <canvas id="agent-voice-canvas" />
        </div>
        <audio id="agent-voice-audio" />
        <div className="flex flex-col items-center justify-center gap-3">
          {voicePlaying && !agentVoicePaused && (
            <Button
              size="sm"
              variant="flat"
              onPress={() => pauseAgentVoice()}
              startContent={<FaPause />}
            >
              Pause agent
            </Button>
          )}
          {voicePlaying && agentVoicePaused && (
            <Button
              size="sm"
              variant="flat"
              onPress={() => resumeAgentVoice()}
              startContent={<FaPlay />}
            >
              Resume agent
            </Button>
          )}
          {status && (
            <div className="text-xs opacity-70 animate-pulse">{status}</div>
          )}
        </div>
        <div className="w-full flex items-center justify-center md:pl-10 md:pr-10">
          {recognizedText}
        </div>

        <div className="w-full flex flex-col items-center justify-center">
          {actions.map((action, index) => (
            <a key={`action-${index}`} href={action.link} target={action.target} className="text-sm p-2 pl-3 pr-3 rounded-xl font-semibold max-w-max flex items-center gap-3" style={{
              background: widget.primaryColor,
              color: widget.primaryTextColor
            }}>
              {action.title}
              <FaExternalLinkAlt />
            </a>
          ))}
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
            We faced an error, try again later {":("}
          </div>
        )}

        <div id="bottom-div"></div>
      </div>
      <div
        className="fixed bottom-0 left-0 p-3 flex flex-col w-screen"
        style={{
          backgroundColor: widget.bgColor,
        }}
      >
        {images.length > 0 && (
          <div className="flex items-center p-2 gap-2 ">
            {images.map((image, index) => (
              <div
                key={`imagepreview-${index}`}
                className="w-12 h-12 relative group"
              >
                <img
                  src={image}
                  className="w-12 h-12 bg-accent rounded-xl object-cover border-1 relative"
                />
                <Button
                  size="sm"
                  variant="flat"
                  isIconOnly
                  startContent={<IoIosClose size={18} />}
                  onPress={() =>
                    setImages((prev) => prev.filter((i) => i !== image))
                  }
                  className="w-full h-full backdrop-blur absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-all"
                />
              </div>
            ))}
          </div>
        )}
        <div className="p-1 flex flex-col transition-all">
          <div className="flex items-center gap-3">
            {widget.vision === "y" && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onInput={handleImageChange}
                  id="file-input"
                  className="hidden"
                />
                <label htmlFor="file-input">
                  <Button
                    size="sm"
                    isIconOnly
                    variant="flat"
                    startContent={<LuImagePlus size={16} />}
                    onPress={() => {
                      const elm = document.getElementById("file-input");
                      if (elm) elm.click();
                    }}
                  />
                </label>
              </>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  isIconOnly
                  variant="flat"
                  startContent={<TbKeyboardHide size={16} />}
                />
              </PopoverTrigger>
              <PopoverContent>
                <input
                  className="outline-0 bg-transparent w-full text-sm"
                  placeholder="Your message..."
                  autoFocus
                  value={message}
                  onInput={(e) => setMessage(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") run();
                  }}
                />
              </PopoverContent>
            </Popover>
            <div className="w-full"></div>
            <canvas
              id="user-voice-canvas"
              width="50px"
              height="30px"
              className={`${recorderOpen ? "block" : "hidden"}`}
            />
            {!recorderOpen ? (
              <Button
                size="sm"
                isIconOnly
                variant="light"
                startContent={<FaMicrophone size={16} />}
                className="relative"
                style={{
                  color: widget.primaryColor
                }}
                isDisabled={loading || generating}
                onPress={() => {
                  setRecorderOpen(true);
                  startRecorder();
                  pauseAgentVoice();
                }}
              />
            ) : (
              <>
                <Button
                  size="sm"
                  isIconOnly
                  variant="light"
                  startContent={<IoMdClose size={16} />}
                  onPress={() => {
                    setRecorderOpen(false);
                    if (voiceRecorder) voiceRecorder.cancel();
                    updateRecognizedText("");
                  }}
                />
                <Button
                  size="sm"
                  isIconOnly
                  variant="light"
                  startContent={
                    recorderState === "paused" ? (
                      <FaPlay size={16} />
                    ) : (
                      <FaPause size={16} />
                    )
                  }
                  onPress={() => {
                    if (!voiceRecorder) return;

                    if (recorderState === "paused") {
                      pauseAgentVoice();
                      voiceRecorder.resume();
                    } else {
                      voiceRecorder.pause();
                    }
                  }}
                />
              </>
            )}
            <Button
              size="sm"
              isIconOnly
              variant="light"
              style={{
                color: widget.primaryColor
              }}
              startContent={
                !loading && !generating && <RiSendPlane2Fill size={16} />
              }
              isLoading={loading || generating}
              onPress={() => {
                runAudio();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
