'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AudioLines,
  Monitor,
  Video,
  GitBranch,
  FileText,
  Layers,
  CircleHelp,
  BarChart3,
  Table,
  Sparkles,
  Mic,
  LucideIcon,
} from 'lucide-react'
import { CollapsibleColumn, createCollapseButton } from '@/components/notebooks/CollapsibleColumn'
import { useNotebookColumnsStore } from '@/lib/stores/notebook-columns-store'
import { useTranslation } from '@/lib/hooks/use-translation'
import { GeneratePodcastDialog } from '@/components/podcasts/GeneratePodcastDialog'
import { toast } from 'sonner'

interface StudioItem {
  icon: LucideIcon
  labelKey: string
  action?: 'podcast'
}

const STUDIO_ITEMS: StudioItem[] = [
  { icon: AudioLines, labelKey: 'audioOverview' },
  { icon: Monitor, labelKey: 'presentation' },
  { icon: Video, labelKey: 'videoSummary' },
  { icon: GitBranch, labelKey: 'mindMap' },
  { icon: FileText, labelKey: 'report' },
  { icon: Layers, labelKey: 'flashcards' },
  { icon: CircleHelp, labelKey: 'quiz' },
  { icon: BarChart3, labelKey: 'infographic' },
  { icon: Table, labelKey: 'dataTable' },
  { icon: Mic, labelKey: 'generatePodcast', action: 'podcast' },
]

interface StudioColumnProps {
  notebookId: string
}

export function StudioColumn({ notebookId }: StudioColumnProps) {
  const { t } = useTranslation()
  const { studioCollapsed, toggleStudio } = useNotebookColumnsStore()
  const [podcastDialogOpen, setPodcastDialogOpen] = useState(false)

  const collapseButton = useMemo(
    () => createCollapseButton(toggleStudio, t.studio?.title || 'Studio', 'right'),
    [toggleStudio, t.studio?.title]
  )

  const studioTranslations: Record<string, string> = t.studio || {}

  const handleItemClick = (item: StudioItem) => {
    if (item.action === 'podcast') {
      setPodcastDialogOpen(true)
    } else {
      toast.info(t.studio?.comingSoon || 'Coming soon')
    }
  }

  return (
    <>
      <CollapsibleColumn
        isCollapsed={studioCollapsed}
        onToggle={toggleStudio}
        collapsedIcon={Sparkles}
        collapsedLabel={t.studio?.title || 'Studio'}
        direction="right"
      >
        <Card className="h-full flex flex-col flex-1 overflow-hidden">
          <CardHeader className="pb-2 flex-shrink-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{t.studio?.title || 'Studio'}</h3>
              {collapseButton}
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto min-h-0">
            {/* Studio output grid */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {STUDIO_ITEMS.map((item) => {
                const Icon = item.icon
                const label = studioTranslations[item.labelKey] || item.labelKey
                const isPodcast = item.action === 'podcast'
                return (
                  <button
                    key={item.labelKey}
                    className={`flex flex-col items-start gap-1.5 p-2 rounded-lg border transition-colors cursor-pointer group text-left overflow-hidden ${
                      isPodcast
                        ? 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                        : 'bg-card hover:bg-accent/50'
                    }`}
                    onClick={() => handleItemClick(item)}
                  >
                    <Icon className={`h-3.5 w-3.5 transition-colors flex-shrink-0 ${
                      isPodcast
                        ? 'text-primary group-hover:text-primary'
                        : 'text-muted-foreground group-hover:text-foreground'
                    }`} />
                    <span className={`text-[11px] font-medium transition-colors leading-tight truncate w-full ${
                      isPodcast
                        ? 'text-primary group-hover:text-primary'
                        : 'text-muted-foreground group-hover:text-foreground'
                    }`}>
                      {label}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Empty state */}
            <div className="flex flex-col items-center justify-center text-center py-6 px-2">
              <Sparkles className="h-6 w-6 text-muted-foreground/50 mb-2" />
              <p className="text-xs font-medium text-muted-foreground">
                {t.studio?.emptyState || 'Studio outputs will appear here.'}
              </p>
              <p className="text-[11px] text-muted-foreground/70 mt-1 leading-relaxed">
                {t.studio?.emptyStateDesc || 'Add sources, then click to generate audio overviews, study guides, mind maps, and more!'}
              </p>
            </div>
          </CardContent>
        </Card>
      </CollapsibleColumn>

      {/* Podcast generation dialog */}
      <GeneratePodcastDialog
        open={podcastDialogOpen}
        onOpenChange={setPodcastDialogOpen}
      />
    </>
  )
}
