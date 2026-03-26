'use client'

import { AppShell } from '@/components/layout/AppShell'
import { SettingsForm } from './components/SettingsForm'
import { MemoryHubCard } from './components/MemoryHubCard'
import { RebuildEmbeddings } from '@/app/(dashboard)/advanced/components/RebuildEmbeddings'
import { SystemInfo } from '@/app/(dashboard)/advanced/components/SystemInfo'
import { useSettings } from '@/lib/hooks/use-settings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, Key, Shuffle, Bot, ChevronRight } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/use-translation'
import Link from 'next/link'

export default function SettingsPage() {
  const { t } = useTranslation()
  const { refetch } = useSettings()

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="max-w-4xl">
            <div className="flex items-center gap-4 mb-6">
              <h1 className="text-2xl font-bold">{t.navigation.settings}</h1>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <SettingsForm />

            {/* Models & Transformations quick access */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/settings/api-keys" className="block">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Key className="h-4 w-4 text-primary" />
                      {t.navigation.models}
                      <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {t.models?.defaultAssignmentsDesc || 'Configure AI models and API keys'}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/transformations" className="block">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shuffle className="h-4 w-4 text-primary" />
                      {t.navigation.transformations}
                      <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {t.transformations?.desc || 'Manage content transformations'}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </div>

            <div className="mt-6">
              <MemoryHubCard />
            </div>

            <div className="mt-6">
              <RebuildEmbeddings />
            </div>

            <div className="mt-6">
              <SystemInfo />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
