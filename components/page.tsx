/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import React from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { generateChat } from "@/app/api/chat"
import { readStreamableValue } from "ai/rsc"
import { Bot, Moon, Send, Sun, User } from "lucide-react"
import { useTheme } from "next-themes"
import { Textarea } from "@/components/ui/textarea"

type Props = {
  onGenerate: (value: string) => void
  isComposing?: boolean
}

type Message = {
  role: 'user' | 'bot'
  content: string
  fullContent?: string
}

const AIChatbot = (props: Props) => {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState("")
  const [isGenerating, setIsGenerating] = React.useState(false)
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const { theme, setTheme } = useTheme()

  const handleSend = async () => {
    if (input.trim() === "" || isGenerating) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsGenerating(true)

    try {
      const { output } = await generateChat("", input)
      let botResponse = ""

      setMessages(prev => [...prev, { role: 'bot', content: '', fullContent: '' }])

      for await (const delta of readStreamableValue(output)) {
        if (delta) {
          botResponse += delta
          setMessages(prev => {
            const newMessages = [...prev]
            const lastMessage = newMessages[newMessages.length - 1]
            if (lastMessage.role === 'bot') {
              lastMessage.fullContent = botResponse
            }
            return newMessages
          })
          props.onGenerate(delta)
        }
      }

      if (botResponse.trim() === "") {
        throw new Error("No content generated")
      }

      props.onGenerate("\n")
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { role: 'bot', content: "An error occurred while generating the response. Please try again." }
      ])
    } finally {
      setIsGenerating(false)
    }
  }

  React.useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  React.useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage && lastMessage.role === 'bot' && lastMessage.fullContent) {
      const timer = setInterval(() => {
        setMessages(prev => {
          const newMessages = [...prev]
          const lastMsg = newMessages[newMessages.length - 1]
          if (lastMsg.role === 'bot' && lastMsg.content.length < lastMsg.fullContent!.length) {
            lastMsg.content = lastMsg.fullContent!.slice(0, lastMsg.content.length + 1)
            return newMessages
          }
          clearInterval(timer)
          return prev
        })
      }, 20)

      return () => clearInterval(timer)
    }
  }, [messages])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
    <Card className="w-full h-screen flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center space-x-2">
          <Bot className="h-6 w-6" />
          <span>AI Chatbot</span>
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
              <div className={`flex items-start space-x-2 gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <Avatar>
                  <AvatarFallback>{message.role === 'user' ? <User /> : <Bot />}</AvatarFallback>
                </Avatar>
                <div className={`rounded-lg p-3 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {message.content}
                </div>
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="flex justify-start mb-4">
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarFallback><Bot /></AvatarFallback>
                </Avatar>
                <div className="rounded-lg p-3 bg-muted">
                  Thinking...
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex w-full items-end space-x-2">
          <Textarea
            ref={textareaRef}
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
            className="min-h-[40px] max-h-[200px] resize-none"
            rows={1}
          />
          <Button type="submit" size="icon" disabled={isGenerating || input.trim() === ""}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
    </>
  )
}

export default AIChatbot