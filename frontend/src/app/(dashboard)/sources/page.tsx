'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { sourcesApi } from '@/lib/api/sources'
import { memoriesApi } from '@/lib/api/memories'
import { SourceListResponse } from '@/lib/types/api'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { AppShell } from '@/components/layout/AppShell'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { FileText, Link as LinkIcon, Upload, AlignLeft, Trash2, ArrowUpDown, Brain, ArrowLeft, BookOpen, Search as SearchIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { AddToNotebookDialog } from '@/components/sources/AddToNotebookDialog'
import { useTranslation } from '@/lib/hooks/use-translation'
import { getDateLocale } from '@/lib/utils/date-locale'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { getApiErrorKey } from '@/lib/utils/error-handler'
import { MemoryTimeline } from '@/app/(dashboard)/memories/components/MemoryTimeline'

export default function SourcesPage() {
  const { t, language } = useTranslation()
  const searchParams = useSearchParams()
  const fromNotebook = searchParams?.get('from') || null
  const urlTab = searchParams?.get('tab')
  const [activeTab, setActiveTab] = useState<'sources' | 'memories'>(urlTab === 'memories' ? 'memories' : 'sources')
  const { data: hubStatus } = useQuery({
    queryKey: ['memories', 'status'],
    queryFn: () => memoriesApi.status(),
    staleTime: 60 * 1000,
  })
  const isMemoryHubConnected = hubStatus?.connected === true
  const [sources, setSources] = useState<SourceListResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [sortBy, setSortBy] = useState<'created' | 'updated'>('updated')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; source: SourceListResponse | null }>({
    open: false,
    source: null
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(new Set())
  const [addToNotebookDialog, setAddToNotebookDialog] = useState<{open: boolean, sourceId?: string, sourceTitle?: string}>({open: false})
  const router = useRouter()
  const tableRef = useRef<HTMLTableElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(0)
  const loadingMoreRef = useRef(false)
  const hasMoreRef = useRef(true)
  const PAGE_SIZE = 30

  const fetchSources = useCallback(async (reset = false) => {
    try {
      // Check flags before proceeding
      if (!reset && (loadingMoreRef.current || !hasMoreRef.current)) {
        return
      }

      if (reset) {
        setLoading(true)
        offsetRef.current = 0
        setSources([])
        hasMoreRef.current = true
      } else {
        loadingMoreRef.current = true
        setLoadingMore(true)
      }

      const data = await sourcesApi.list({
        limit: PAGE_SIZE,
        offset: offsetRef.current,
        sort_by: sortBy,
        sort_order: sortOrder,
      })

      if (reset) {
        setSources(data)
      } else {
        setSources(prev => [...prev, ...data])
      }

      // Check if we have more data
      const hasMoreData = data.length === PAGE_SIZE
      hasMoreRef.current = hasMoreData
      offsetRef.current += data.length
    } catch (err) {
      console.error('Failed to fetch sources:', err)
      setError(t.sources.failedToLoad)
      toast.error(t.sources.failedToLoad)
    } finally {
      setLoading(false)
      setLoadingMore(false)
      loadingMoreRef.current = false
    }
  }, [sortBy, sortOrder, t.sources.failedToLoad])

  // Initial load and when sort changes
  useEffect(() => {
    fetchSources(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, sortOrder])

  useEffect(() => {
    // Focus the table when component mounts or sources change
    if (sources.length > 0 && tableRef.current) {
      tableRef.current.focus()
    }
  }, [sources])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sources.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => {
            const newIndex = Math.min(prev + 1, sources.length - 1)
            // Scroll to keep selected row visible
            setTimeout(() => scrollToSelectedRow(newIndex), 0)
            return newIndex
          })
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => {
            const newIndex = Math.max(prev - 1, 0)
            // Scroll to keep selected row visible
            setTimeout(() => scrollToSelectedRow(newIndex), 0)
            return newIndex
          })
          break
        case 'Enter':
          e.preventDefault()
          if (sources[selectedIndex]) {
            router.push(`/sources/${sources[selectedIndex].id}`)
          }
          break
        case 'Home':
          e.preventDefault()
          setSelectedIndex(0)
          setTimeout(() => scrollToSelectedRow(0), 0)
          break
        case 'End':
          e.preventDefault()
          const lastIndex = sources.length - 1
          setSelectedIndex(lastIndex)
          setTimeout(() => scrollToSelectedRow(lastIndex), 0)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sources, selectedIndex, router])

  const scrollToSelectedRow = (index: number) => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    // Find the selected row element
    const rows = scrollContainer.querySelectorAll('tbody tr')
    const selectedRow = rows[index] as HTMLElement
    if (!selectedRow) return

    const containerRect = scrollContainer.getBoundingClientRect()
    const rowRect = selectedRow.getBoundingClientRect()

    // Check if row is above visible area
    if (rowRect.top < containerRect.top) {
      selectedRow.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    // Check if row is below visible area
    else if (rowRect.bottom > containerRect.bottom) {
      selectedRow.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }

  // Set up scroll listener after sources are loaded
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    let scrollTimeout: NodeJS.Timeout | null = null

    const handleScroll = () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }

      scrollTimeout = setTimeout(() => {
        if (!scrollContainerRef.current) return

        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight

        // Load more when within 200px of the bottom
        if (distanceFromBottom < 200 && !loadingMoreRef.current && hasMoreRef.current) {
          fetchSources(false)
        }
      }, 100)
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    handleScroll() // Check on mount

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll)
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
    }
  }, [fetchSources, sources.length])

  const toggleSort = (field: 'created' | 'updated') => {
    if (sortBy === field) {
      // Toggle order if clicking the same field
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      // Switch to new field with default desc order
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const getSourceIcon = (source: SourceListResponse) => {
    if (source.asset?.url) return <LinkIcon className="h-4 w-4" />
    if (source.asset?.file_path) return <Upload className="h-4 w-4" />
    return <AlignLeft className="h-4 w-4" />
  }

  const getSourceType = (source: SourceListResponse) => {
    if (source.asset?.url) return t.sources.type.link
    if (source.asset?.file_path) return t.sources.type.file
    return t.sources.type.text
  }

  const handleRowClick = useCallback((index: number, sourceId: string) => {
    setSelectedIndex(index)
    router.push(`/sources/${sourceId}`)
  }, [router])

  const handleDeleteClick = useCallback((e: React.MouseEvent, source: SourceListResponse) => {
    e.stopPropagation() // Prevent row click
    setDeleteDialog({ open: true, source })
  }, [])

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.source) return

    try {
      await sourcesApi.delete(deleteDialog.source.id)
      toast.success(t.sources.deleteSuccess)
      // Remove the deleted source from the list
      setSources(prev => prev.filter(s => s.id !== deleteDialog.source?.id))
      setDeleteDialog({ open: false, source: null })
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } }, message?: string };
      console.error('Failed to delete source:', error)
      toast.error(t(getApiErrorKey(error.response?.data?.detail || error.message)))
    }
  }

  const filteredSources = sources.filter(s =>
    !searchQuery || s.title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AppShell>
      <div className="flex flex-col h-full w-full max-w-none px-6 py-6">
        <div className="mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            {fromNotebook && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/notebooks/${fromNotebook}`)}
                className="h-8 px-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t.common.back}
              </Button>
            )}
            <h1 className="text-3xl font-bold">{t.navigation?.collect || t.sources.allSources}</h1>
          </div>
          <p className="mt-2 text-muted-foreground">
            {t.sources.allSourcesDesc}
          </p>
        </div>

        {/* Tabs: Sources | Memories */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'sources' | 'memories')} className="flex flex-col flex-1 min-h-0">
          <TabsList className="mb-4 w-fit flex-shrink-0">
            <TabsTrigger value="sources" className="gap-2">
              <FileText className="h-4 w-4" />
              {t.navigation.sources}
            </TabsTrigger>
            {isMemoryHubConnected && (
              <TabsTrigger value="memories" className="gap-2">
                <Brain className="h-4 w-4" />
                {t.memories?.browseTitle || 'Memories'}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="memories" className="flex-1 min-h-0 mt-0">
            {isMemoryHubConnected ? (
              <MemoryTimeline />
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-sm">
                  {t.memories?.hubOffline || 'Memory Hub is not connected.'}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sources" className="flex-1 min-h-0 mt-0">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="flex h-64 items-center justify-center">
                <p className="text-red-500">{error}</p>
              </div>
            ) : sources.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={t.sources.noSourcesYet}
                description={t.sources.allSourcesDescShort}
              />
            ) : (
              <>
        <div className="flex items-center gap-2 mb-3 flex-shrink-0">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.sources?.searchSources || 'Search sources...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        {selectedSourceIds.size > 0 && (
          <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-primary/5 border border-primary/20 flex-shrink-0">
            <span className="text-sm font-medium">
              {t.sources?.selectedCount?.replace('{count}', selectedSourceIds.size.toString()) || `${selectedSourceIds.size} selected`}
            </span>
            <Button size="sm" onClick={() => setAddToNotebookDialog({open: true})}>
              <BookOpen className="h-3.5 w-3.5 mr-1" />
              {t.sources?.addToNotebook || 'Add to Notebook'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedSourceIds(new Set())}>
              {t.common.cancel}
            </Button>
          </div>
        )}
        <div ref={scrollContainerRef} className="flex-1 rounded-md border overflow-auto">
          <table
            ref={tableRef}
            tabIndex={0}
            className="w-full min-w-[800px] outline-none table-fixed"
          >
            <colgroup>
              <col className="w-[50px]" />
              <col className="w-[120px]" />
              <col className="w-auto" />
              <col className="w-[140px]" />
              <col className="w-[100px]" />
              <col className="w-[100px]" />
              <col className="w-[100px]" />
            </colgroup>
            <thead className="sticky top-0 bg-background z-10">
              <tr className="border-b bg-muted/50">
                <th className="h-12 px-4 text-center align-middle">
                  <Checkbox
                    checked={filteredSources.length > 0 && selectedSourceIds.size === filteredSources.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedSourceIds(new Set(filteredSources.map(s => s.id)))
                      } else {
                        setSelectedSourceIds(new Set())
                      }
                    }}
                  />
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  {t.common.type}
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  {t.common.title}
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground hidden sm:table-cell">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSort('created')}
                    className="h-8 px-2 hover:bg-muted"
                  >
                    {t.common.created_label}
                    <ArrowUpDown className={cn(
                      "ml-2 h-3 w-3",
                      sortBy === 'created' ? 'opacity-100' : 'opacity-30'
                    )} />
                    {sortBy === 'created' && (
                      <span className="ml-1 text-xs">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </Button>
                </th>
                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground hidden md:table-cell">
                  {t.sources.insights}
                </th>
                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground hidden lg:table-cell">
                  {t.sources.embedded}
                </th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                  {t.common.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSources.map((source, index) => (
                <tr
                  key={source.id}
                  onClick={() => handleRowClick(index, source.id)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "border-b transition-colors cursor-pointer",
                    selectedIndex === index
                      ? "bg-accent"
                      : "hover:bg-muted/50"
                  )}
                >
                  <td className="h-12 px-4 text-center">
                    <Checkbox
                      checked={selectedSourceIds.has(source.id)}
                      onCheckedChange={(checked) => {
                        const next = new Set(selectedSourceIds)
                        if (checked) {
                          next.add(source.id)
                        } else {
                          next.delete(source.id)
                        }
                        setSelectedSourceIds(next)
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="h-12 px-4">
                    <div className="flex items-center gap-2">
                      {getSourceIcon(source)}
                      <Badge variant="secondary" className="text-xs">
                        {getSourceType(source)}
                      </Badge>
                    </div>
                  </td>
                  <td className="h-12 px-4">
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-medium truncate">
                        {source.title || t.sources.untitledSource}
                      </span>
                      {source.asset?.url && (
                        <span className="text-xs text-muted-foreground truncate">
                          {source.asset.url}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="h-12 px-4 text-muted-foreground text-sm hidden sm:table-cell">
                    {formatDistanceToNow(new Date(source.created), { 
                      addSuffix: true,
                      locale: getDateLocale(language)
                    })}
                  </td>
                  <td className="h-12 px-4 text-center hidden md:table-cell">
                    <span className="text-sm font-medium">{source.insights_count || 0}</span>
                  </td>
                  <td className="h-12 px-4 text-center hidden lg:table-cell">
                    <Badge variant={source.embedded ? "default" : "secondary"} className="text-xs">
                      {source.embedded ? t.sources.yes : t.sources.no}
                    </Badge>
                  </td>
                  <td className="h-12 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        setAddToNotebookDialog({open: true, sourceId: source.id, sourceTitle: source.title || undefined})
                      }}
                      className="text-primary hover:text-primary"
                      title={t.sources?.addToNotebook || 'Add to Notebook'}
                    >
                      <BookOpen className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDeleteClick(e, source)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {loadingMore && (
                <tr>
                  <td colSpan={7} className="h-16 text-center">
                    <div className="flex items-center justify-center">
                      <LoadingSpinner />
                      <span className="ml-2 text-muted-foreground">{t.sources.loadingMore}</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AddToNotebookDialog
        open={addToNotebookDialog.open}
        onOpenChange={(open) => setAddToNotebookDialog(prev => ({...prev, open}))}
        sourceId={addToNotebookDialog.sourceId}
        sourceIds={selectedSourceIds.size > 0 ? Array.from(selectedSourceIds) : undefined}
        sourceTitle={addToNotebookDialog.sourceTitle}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, source: deleteDialog.source })}
        title={t.sources.delete}
        description={t.sources.deleteConfirmWithTitle.replace('{title}', deleteDialog.source?.title || t.sources.untitledSource)}
        confirmText={t.common.delete}
        confirmVariant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </AppShell>
  )
}