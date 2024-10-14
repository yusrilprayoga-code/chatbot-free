/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateChat } from "@/app/api/chat";
import { readStreamableValue } from "ai/rsc";
import {
  Bot,
  Moon,
  Send,
  Sun,
  User,
  X,
  Plus,
  MessageSquare,
  Menu,
  Dot,
  CircleDot,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Textarea } from "@/components/ui/textarea";
import FormattedMessage from "./formattedMessage";
import { Message } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from "./ui/separator";

type Props = {
  onGenerate: (value: string) => void;
  isComposing?: boolean;
};

type ChatSession = {
  id: string;
  name: string;
  messages: Message[];
};

const AIChatbotWithSidebar = (props: Props) => {
  const [chatSessions, setChatSessions] = React.useState<ChatSession[]>([
    { id: "1", name: "New Chat", messages: [] },
  ]);
  const [currentSessionId, setCurrentSessionId] = React.useState("1");
  const [input, setInput] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [shouldStop, setShouldStop] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const { theme, setTheme } = useTheme();

  const currentSession =
    chatSessions.find((session) => session.id === currentSessionId) ||
    chatSessions[0];

  const handleSend = async () => {
    if (input.trim() === "" || isGenerating) return;

    const userMessage: Message = { role: "user", content: input };
    updateCurrentSession((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
    }));
    setInput("");
    setIsGenerating(true);
    setShouldStop(false);

    try {
      const { output } = await generateChat("", input);
      let botResponse = "";

      updateCurrentSession((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          { role: "bot", content: "", fullContent: "" },
        ],
      }));

      for await (const delta of readStreamableValue(output)) {
        if (shouldStop) break;
        if (delta) {
          botResponse += delta;
          updateCurrentSession((prev) => {
            const newMessages = [...prev.messages];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === "bot") {
              lastMessage.fullContent = botResponse;
            }
            return { ...prev, messages: newMessages };
          });
          props.onGenerate(delta);
        }
      }

      if (botResponse.trim() === "") {
        throw new Error("No content generated");
      }

      props.onGenerate("\n");
    } catch (error) {
      updateCurrentSession((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            role: "bot",
            content:
              "An error occurred while generating the response. Please try again.",
          },
        ],
      }));
    } finally {
      setIsGenerating(false);
      setShouldStop(false);
    }
  };

  const handleStopThinking = () => {
    setShouldStop(true);
  };

  const updateCurrentSession = (
    updater: (session: ChatSession) => ChatSession
  ) => {
    setChatSessions((prev) =>
      prev.map((session) =>
        session.id === currentSessionId ? updater(session) : session
      )
    );
  };

  const addNewChatSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      name: `New Chat ${chatSessions.length + 1}`,
      messages: [],
    };
    setChatSessions((prev) => [...prev, newSession]);
    setCurrentSessionId(newSession.id);
  };

  React.useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [currentSession.messages]);

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  React.useEffect(() => {
    const lastMessage =
      currentSession.messages[currentSession.messages.length - 1];
    if (lastMessage && lastMessage.role === "bot" && lastMessage.fullContent) {
      const timer = setInterval(() => {
        updateCurrentSession((prev) => {
          const newMessages = [...prev.messages];
          const lastMsg = newMessages[newMessages.length - 1];
          if (
            lastMsg.role === "bot" &&
            lastMsg.content.length < lastMsg.fullContent!.length
          ) {
            lastMsg.content = lastMsg.fullContent!.slice(
              0,
              lastMsg.content.length + 1
            );
            return { ...prev, messages: newMessages };
          }
          clearInterval(timer);
          return prev;
        });
      }, 20);

      return () => clearInterval(timer);
    }
  }, [currentSession.messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex-grow flex flex-col">
        <Card className="flex-grow rounded-none md:rounded-l-lg shadow-lg">
          {/* header card */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center space-x-2">
              <Bot className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">
                AI Chatbot by YusrilPrayoga
              </span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-full"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
              {/* <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleSidebar}
                className="md:hidden rounded-full"
              >
                <Menu className="h-5 w-5" />
              </Button> */}
            </div>
          </CardHeader>

          <Separator
            orientation="horizontal"
            className="
            border-t border-gray-200 dark:border-gray-700 mb-10
          "
          />

          {/* content card */}
          <CardContent className="flex-grow overflow-hidden">
            <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
              <AnimatePresence>
                {currentSession.messages.map((message, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="mb-4"
                  >
                    <div
                      className={`flex items-start ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`rounded-lg ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground p-2"
                        }`}
                      >
                        <FormattedMessage
                          content={message.content}
                          role={message.role}
                        />
                      </div>
                      <Avatar
                        className={`${
                          message.role === "user" ? "ml-2" : "mr-2 order-first"
                        }`}
                      >
                        <AvatarFallback>
                          {message.role === "user" ? (
                            <User className="h-5 w-5" />
                          ) : (
                            <Bot className="h-5 w-5" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex items-center space-x-2 mb-4"
                >
                  <Avatar>
                    <AvatarFallback>
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-secondary text-secondary-foreground p-3 rounded-lg">
                    <span className="inline-flex space-x-1">
                      <span className="animate-bounce">
                        <Dot className="rounded-full w-2 h-2 bg-gray-500" />
                      </span>
                      <span className="animate-bounce delay-100">
                        <Dot className="rounded-full w-2 h-2 bg-gray-500" />
                      </span>
                      <span className="animate-bounce delay-200">
                        <Dot className="rounded-full w-2 h-2 bg-gray-500" />
                      </span>
                    </span>
                  </div>
                </motion.div>
              )}
            </ScrollArea>
          </CardContent>
          <CardFooter
            className="
          bottom-0 w-full
          flex items-center justify-between"
          >
            <div className="flex w-full items-end space-x-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="resize-none flex-grow rounded-lg items-center justify-center
                  min-h-[50px] max-h-[200px]"
                onKeyDown={handleKeyDown}
                rows={1}
              />
              {isGenerating ? (
                <Button
                  type="button"
                  size="icon"
                  onClick={handleStopThinking}
                  className="items-center justify-center min-h-[50px] min-w-[50px]"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Stop thinking</span>
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  disabled={isGenerating || input.trim() === ""}
                  className="items-center justify-center min-h-[50px] min-w-[50px]"
                >
                  <Send className="h-full w-4" />
                  <span className="sr-only">Send</span>
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AIChatbotWithSidebar;
