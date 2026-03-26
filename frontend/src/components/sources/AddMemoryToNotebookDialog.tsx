'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Loader2, BookOpen } from 'lucide-react'
import { useNotebooks } from '@/lib/hooks/use-notebooks'
import { useImportMemories } from '@/lib/hooks/use-memories'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useTranslation } from '@/lib/hooks/use-translation'

interface AddMemoryToNotebookDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  memoryIds: string[]
  memoryType: string
  title?: string
}

export function AddMemoryToNotebookDialog({
  open,
  onOpenChange,
  memoryIds,
  memoryType,
  title,
}: AddMemoryToNotebookDialogProps) {
  const { t } = useTranslation()
  const [selectedNotebooks, setSelectedNotebooks] = useState<Set<string>>(new Set())
  const { data: notebooks, isLoading } = useNotebooks(false)
  const importMemories = useImportMemories()

  const toggleNotebook = (id: string) => {
    setSelectedNotebooks((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleImport = async () => {
    if (selectedNotebooks.size === 0 || memoryIds.length === 0) return

    for (const notebookId of selectedNotebooks) {
      await importMemories.mutateAsync({
        memory_ids: memoryIds,
        memory_type: memoryType,
        notebook_id: notebookId,
      })
    }

    setSelectedNotebooks(new Set())
    onOpenChange(false)
  }

  const count = memoryIds.length
  const subtitle = count > 1
    ? (t.sources?.selectedCount?.replace('{count}', count.toString()) || `${count} selected`)
    : title

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t.sources?.addToNotebook || 'Add to Notebook'}
          </DialogTitle>
          {subtitle && (
            <DialogDescription className="truncate">
              {subtitle}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="max-h-[40vh] overflow-y-auto space-y-2 py-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : !notebooks || notebooks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t.notebooks?.noNotebooks || 'No notebooks found'}
            </p>
          ) : (
            notebooks.map((notebook) => (
              <div
                key={notebook.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer"
                onClick={() => toggleNotebook(notebook.id)}
              >
                <Checkbox
                  checked={selectedNotebooks.has(notebook.id)}
                  onCheckedChange={() => toggleNotebook(notebook.id)}
                />
                <Label className="cursor-pointer flex-1 text-sm">
                  {notebook.name}
                </Label>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button
            onClick={handleImport}
            disabled={selectedNotebooks.size === 0 || importMemories.isPending}
          >
            {importMemories.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {t.common.add} ({selectedNotebooks.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
