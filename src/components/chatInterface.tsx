"use client";

import { Button } from "@nextui-org/react";
import { Agent, Client, VoiceRecorder } from "@scoopika/client";
import { useChatState } from "@scoopika/react";
import { AgentData, Widget } from "@scoopika/types";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import AgentAvatar from "./avatar";
import { FaChevronLeft, FaPause, FaPlay } from "react-icons/fa6";
import { MdContentCopy } from "react-icons/md";
import Powered from "@/components/powered";
import { PlanType } from "@/utils/plan";
import { IoIosClose, IoMdClose } from "react-icons/io";
import { LuImagePlus } from "react-icons/lu";
import { FaMicrophone } from "react-icons/fa";
import { RiSendPlane2Fill } from "react-icons/ri";

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

const UserMsg = ({ text, images }: { text: string; images: string[] }) => {
  return (
    <div className="flex w-full justify-end gap-4 lg:p-4">
      <div className="p-4 rounded-t-md rounded-b-2xl bg-accent dark:bg-accent/30 text-sm">
        {images.length > 0 && (
          <div className="flex items-center gap-4 mb-4">
            {images.map((image, index) => (
              <img
                key={`imgusermsg-${text}-${index}`}
                src={image}
                className="w-14 h-14 rounded-xl hover:opacity-80 transition-all cursor-pointer"
              />
            ))}
          </div>
        )}
        <MarkdownRenderer content={text} />
      </div>
    </div>
  );
};

export default function ChatInterface({
  client,
  agent,
  widget,
  session,
  agentData,
  setSession,
  plan,
}: Props) {
  const scroll = () => {
    const elm = document.getElementById("bottom-div");
    if (elm) elm.scrollIntoView({ block: "end" });
  };

  const {
    loading,
    generating,
    newRequest,
    messages,
    streamPlaceholder,
    status,
  } = useChatState(client, agent, {
    scroll,
    session_id: session,
  });
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<boolean>(false);
  const [images, setImages] = useState<string[]>([]);
  const [recorderOpen, setRecorderOpen] = useState<boolean>(false);
  const [recorder, setRecorder] = useState<VoiceRecorder>();
  const [recorderState, setRecorderState] = useState<
    "stopped" | "paused" | "recording"
  >("stopped");

  useEffect(() => {
    scroll();

    return () => {
      if (recorder) {
        recorder.stop();
      }
    };
  }, []);

  const run = async () => {
    if (message.length < 1) return;

    try {
      newRequest({ inputs: { message, images } });
    } catch {
      setError(true);
    }

    setMessage("");
  };

  const runAudio = async () => {
    if (!recorder) return;

    try {
      const audioInput = (await recorder.asRunInput()) || {};
      newRequest({ inputs: { ...audioInput, images } });
    } catch {} // no need to do anything for now

    setMessage("");
  };

  const startRecorder = () => {
    if (!recorder) {
      const newRecorder = new VoiceRecorder({
        onStateChange: (s) => setRecorderState(s),
      });

      newRecorder.start();
      setRecorder(newRecorder);

      setTimeout(() => {
        newRecorder.addVisualizer("user-voice-canvas", widget.waveColor);
      }, 500);

      return;
    }

    recorder?.start();
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
    <div className="flex flex-col">
      <div
        className="sticky top-0 left-0 w-full p-3 pl-5 pr-5 border-b-1 flex items-center bg-background z-20"
        style={{
          backgroundColor: widget.bgColor,
        }}
      >
        <Button
          size="sm"
          variant="light"
          isIconOnly
          startContent={<FaChevronLeft />}
          onPress={() => setSession(undefined)}
          className="mr-3"
        />
        <AgentAvatar agentData={agentData} />
        <div className="ml-2 flex flex-col gap-1 transition-all">
          <div className="text-sm">{agentData.name}</div>
          {status && <div className="text-xs opacity-80">{status}</div>}
        </div>
      </div>

      {plan !== "scale" && <Powered className="mt-4" />}

      <div className="flex flex-col gap-5 p-7 max-w-screen pb-24 overflow-hidden max-w-screen">
        {messages.map((msg, index) => {
          if (msg.role === "agent")
            return (
              <div
                key={`msg-${index}`}
                className="text-sm w-full flex flex-col min-w-0"
              >
                <MarkdownRenderer content={msg.response.content} />
              </div>
            );

          return (
            <UserMsg
              key={`msg-${index}`}
              text={msg.request.message || ""}
              images={msg.request.images || []}
            />
          );
        })}

        {streamPlaceholder && (
          <div className="text-sm">
            <MarkdownRenderer content={streamPlaceholder.response.content} />{" "}
            <span className="w-3 h-3 bg-foreground rounded-full"></span>
          </div>
        )}

        {loading &&
          (!streamPlaceholder ||
            streamPlaceholder.response.content.length < 1) && (
            <div className="text-xs text-primary animate-pulse">
              Thinking...
            </div>
          )}

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
            We faced an error, try again later {":("}
          </div>
        )}

        <div id="bottom-div"></div>
      </div>
      <div
        className="fixed bottom-0 left-0 p-3 flex flex-col w-full"
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
            <canvas
              id="user-voice-canvas"
              width="50px"
              height="30px"
              className={`${recorderOpen ? "block" : "hidden"}`}
            />
            {widget.vision === "n" && (
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
            {!recorderOpen ? (
              <>
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

                <Button
                  size="sm"
                  isIconOnly
                  variant="light"
                  startContent={<FaMicrophone size={16} />}
                  className="text-red-600"
                  isDisabled={loading || generating}
                  onPress={() => {
                    setRecorderOpen(true);
                    startRecorder();
                  }}
                />
              </>
            ) : (
              <>
                <div className="w-full"></div>
                <Button
                  size="sm"
                  isIconOnly
                  variant="light"
                  startContent={<IoMdClose size={16} />}
                  onPress={() => {
                    setRecorderOpen(false);
                    if (recorder) recorder.stop();
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
                    if (!recorder) return;

                    if (recorder.isPaused) {
                      recorder.resume();
                    } else {
                      recorder.pause();
                    }
                  }}
                />
              </>
            )}
            <Button
              size="sm"
              isIconOnly
              variant="light"
              startContent={
                !loading && !generating && <RiSendPlane2Fill size={16} />
              }
              isLoading={loading || generating}
              onPress={() => {
                if (recorderOpen && recorder) {
                  recorder.pause();
                  setRecorderOpen(false);
                  runAudio();
                } else {
                  run();
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
