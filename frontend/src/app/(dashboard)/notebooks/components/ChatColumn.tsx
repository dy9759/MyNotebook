'use client'

import { useMemo, useState, useCallback } from 'react'
import { useNotebookChat } from '@/lib/hooks/useNotebookChat'
import { useNotes } from '@/lib/hooks/use-notes'
import { useAsk } from '@/lib/hooks/use-ask'
import { useModelDefaults } from '@/lib/hooks/use-models'
import { ChatPanel } from '@/components/source/ChatPanel'
import { StreamingResponse } from '@/components/search/StreamingResponse'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { AlertCircle, Bot, MessageSquare, Globe, Send } from 'lucide-react'
import { ContextSelections } from '../[id]/page'
import { useTranslation } from '@/lib/hooks/use-translation'
import { SourceListResponse } from '@/lib/types/api'

interface ChatColumnProps {
  notebookId: string
  contextSelections: ContextSelections
  sources: SourceListResponse[]
  sourcesLoading: boolean
}

export function ChatColumn({ notebookId, contextSelections, sources, sourcesLoading }: ChatColumnProps) {
  const { t } = useTranslation()

  // Chat mode toggle
  const [chatMode, setChatMode] = useState<'notebook' | 'global'>('notebook')

  // Fetch notes for this notebook
  const { data: notes = [], isLoading: notesLoading } = useNotes(notebookId)

  // Initialize notebook chat hook
  const chat = useNotebookChat({
    notebookId,
    sources,
    notes,
    contextSelections
  })

  // Global Ask state
  const ask = useAsk()
  const { data: modelDefaults } = useModelDefaults()
  const [askQuestion, setAskQuestion] = useState('')

  const handleAsk = useCallback(() => {
    if (!askQuestion.trim() || !modelDefaults?.default_chat_model) return

    ask.sendAsk(askQuestion, {
      strategy: modelDefaults.default_chat_model,
      answer: modelDefaults.default_chat_model,
      finalAnswer: modelDefaults.default_chat_model
    })
  }, [askQuestion, modelDefaults, ask])

  // Calculate context stats for indicator
  const contextStats = useMemo(() => {
    let sourcesInsights = 0
    let sourcesFull = 0
    let notesCount = 0

    sources.forEach(source => {
      const mode = contextSelections.sources[source.id]
      if (mode === 'insights') {
        sourcesInsights++
      } else if (mode === 'full') {
        sourcesFull++
      }
    })

    notes.forEach(note => {
      const mode = contextSelections.notes[note.id]
      if (mode === 'full') {
        notesCount++
      }
    })

    return {
      sourcesInsights,
      sourcesFull,
      notesCount,
      tokenCount: chat.tokenCount,
      charCount: chat.charCount
    }
  }, [sources, notes, contextSelections, chat.tokenCount, chat.charCount])

  // Show loading state while sources/notes are being fetched
  if (sourcesLoading || notesLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardContent className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    )
  }

  // Show error state if data fetch failed
  if (!sources && !notes) {
    return (
      <Card className="h-full flex flex-col">
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">{t.chat.unableToLoadChat}</p>
            <p className="text-xs mt-2">{t.common.refreshPage || 'Please try refreshing the page'}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Mode toggle */}
      <div className="flex-shrink-0 mb-2">
        <Tabs value={chatMode} onValueChange={(v) => setChatMode(v as 'notebook' | 'global')}>
          <TabsList className="h-8 w-full">
            <TabsTrigger value="notebook" className="text-xs gap-1.5 flex-1">
              <MessageSquare className="h-3.5 w-3.5" />
              {t.chat?.notebookChat || 'Notebook Chat'}
            </TabsTrigger>
            <TabsTrigger value="global" className="text-xs gap-1.5 flex-1">
              <Globe className="h-3.5 w-3.5" />
              {t.chat?.globalAsk || 'Global Ask'}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Notebook Chat mode */}
      <div className={chatMode === 'notebook' ? 'flex-1 min-h-0' : 'hidden'}>
        <ChatPanel
          title={t.chat.chatWithNotebook}
          contextType="notebook"
          messages={chat.messages}
          isStreaming={chat.isSending}
          contextIndicators={null}
          onSendMessage={(message, modelOverride) => chat.sendMessage(message, modelOverride)}
          modelOverride={chat.currentSession?.model_override ?? chat.pendingModelOverride ?? undefined}
          onModelChange={(model) => chat.setModelOverride(model ?? null)}
          sessions={chat.sessions}
          currentSessionId={chat.currentSessionId}
          onCreateSession={(title) => chat.createSession(title)}
          onSelectSession={chat.switchSession}
          onUpdateSession={(sessionId, title) => chat.updateSession(sessionId, { title })}
          onDeleteSession={chat.deleteSession}
          loadingSessions={chat.loadingSessions}
          notebookContextStats={contextStats}
          notebookId={notebookId}
        />
      </div>

      {/* Global Ask mode */}
      <div className={chatMode === 'global' ? 'flex-1 min-h-0 flex flex-col' : 'hidden'}>
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-2 flex-shrink-0">
            <p className="text-xs text-muted-foreground">
              {t.chat?.globalAskDesc || 'Search across all your knowledge base'}
            </p>
            {modelDefaults?.default_chat_model && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Bot className="h-3 w-3" />
                <span>{modelDefaults.default_chat_model}</span>
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto min-h-0 flex flex-col">
            {/* Question input */}
            <div className="flex gap-2 mb-4 flex-shrink-0">
              <Textarea
                placeholder={t.searchPage?.enterQuestionPlaceholder || 'Enter your question...'}
                value={askQuestion}
                onChange={(e) => setAskQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !ask.isStreaming && askQuestion.trim()) {
                    e.preventDefault()
                    handleAsk()
                  }
                }}
                disabled={ask.isStreaming}
                rows={2}
                className="flex-1 resize-none text-sm"
              />
              <Button
                size="icon"
                onClick={handleAsk}
                disabled={ask.isStreaming || !askQuestion.trim() || !modelDefaults?.default_chat_model}
                className="h-auto self-end"
              >
                {ask.isStreaming ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Streaming response */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <StreamingResponse
                isStreaming={ask.isStreaming}
                strategy={ask.strategy}
                answers={ask.answers}
                finalAnswer={ask.finalAnswer}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
