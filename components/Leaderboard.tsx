'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getLeaderboard } from '@/app/actions'
import { LeaderboardEntry } from '@/types/game'
import { cn } from '@/lib/utils'
import { AlertCircle, Trophy, RefreshCw, Timer, Target } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Script from 'next/script'
import { Button } from '@/components/ui/button'

export function Leaderboard() {
  const [mode, setMode] = useState<'60' | '120'>('60')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  const fetchLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getLeaderboard(mode)
      console.log('Fetched leaderboard data:', data)
      setEntries(data)
    } catch (err) {
      console.error('Leaderboard error:', err)
      setError('Failed to load leaderboard. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }, [mode])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  // Initialize Typeform when script loads
  useEffect(() => {
    if (scriptLoaded && typeof window !== 'undefined') {
      // @ts-ignore - Typeform global
      if (window.tf && window.tf.createPopup) {
        // Force Typeform to re-scan for embeds
        const event = new Event('DOMContentLoaded', { bubbles: true })
        document.dispatchEvent(event)
      }
    }
  }, [scriptLoaded])

  const refreshLeaderboard = () => {
    fetchLeaderboard()
  }


  return (
    <div className="space-y-8">
      <div className="w-full max-w-4xl mx-auto">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Mode Selection Tabs */}
        <Tabs defaultValue="60" onValueChange={(value) => setMode(value as '60' | '120')} className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-secondary border border-border">
              <TabsTrigger
                value="60"
                className="data-[state=active]:bg-background data-[state=active]:text-foreground flex items-center space-x-2 text-sm"
              >
                <Timer className="w-4 h-4" />
                <span>60s</span>
              </TabsTrigger>
              <TabsTrigger
                value="120"
                className="data-[state=active]:bg-background data-[state=active]:text-foreground flex items-center space-x-2 text-sm"
              >
                <Target className="w-4 h-4" />
                <span>120s</span>
              </TabsTrigger>
            </TabsList>

            <Button
              onClick={refreshLeaderboard}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2 text-xs"
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
              <span>Refresh</span>
            </Button>
          </div>

          <TabsContent value="60" className="mt-0">
            <LeaderboardTable entries={entries} isLoading={isLoading} mode="60" />
          </TabsContent>
          <TabsContent value="120" className="mt-0">
            <LeaderboardTable entries={entries} isLoading={isLoading} mode="120" />
          </TabsContent>
        </Tabs>
      </div>

      {/* Tips and Community Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Tips Card */}
        <Card className="border border-border">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-base font-semibold">Tips</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="space-y-2.5 text-sm">
              <li>
                <strong>Don't know a symbol?</strong> Draw it using{' '}
                <a
                  href="https://detexify.kirelabs.org/classify.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  Detexify
                </a>
              </li>
              <li>Use <code className="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono">\not\in</code> instead of <code className="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono">\notin</code></li>
              <li>Use <code className="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono">\pmod</code> instead of <code className="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono">\mod</code></li>
              <li>Use <code className="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono">\mathbf</code> instead of <code className="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono">\textbf</code></li>
              <li><strong>Never use</strong> the <code className="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono">$</code> symbol</li>
              <li>Use <code className="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono">\left</code> and <code className="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono">\right</code> instead of <code className="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono">\Bigl</code> and <code className="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono">\Bigr</code></li>
            </ul>
          </CardContent>
        </Card>

        {/* Community Contribution Card */}
        <Card className="border border-border">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-base font-semibold">Contribute</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Help improve Type LaTeX by contributing new expressions
              </p>

              <div className="bg-secondary p-4 rounded border border-border">
                <h4 className="font-medium text-sm mb-2">Add an expression</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Submit your favorite LaTeX expressions (or make a PR)
                </p>

                <div data-tf-live="01JDZXFXSAFAEF7R6ZHJJX9ZQ5"></div>
                <Script
                  src="//embed.typeform.com/next/embed.js"
                  strategy="lazyOnload"
                  onLoad={() => setScriptLoaded(true)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function LeaderboardTable({
  entries,
  isLoading,
  mode
}: {
  entries: LeaderboardEntry[],
  isLoading: boolean,
  mode: '60' | '120'
}) {
  if (isLoading) {
    return (
      <Card className="border border-border">
        <CardContent className="p-12">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (entries.length === 0) {
    return (
      <Card className="border border-border">
        <CardContent className="p-12">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">No scores yet</p>
            <p className="text-xs text-muted-foreground">Be the first to set a record in {mode}s mode</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-border overflow-hidden">
      <CardContent className="p-0">
        <div className="custom-scrollbar" style={{ maxHeight: '500px', overflowY: 'auto' }}>
          <div className="divide-y divide-border">
            {entries.map((entry, index) => {
              const rank = index + 1

              return (
                <div
                  key={entry.id}
                  className={cn(
                    "leaderboard-row p-4",
                    rank === 1 && "rank-1",
                    rank === 2 && "rank-2",
                    rank === 3 && "rank-3"
                  )}
                >
                  <div className="flex items-center justify-between">
                    {/* Rank and User Info */}
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-secondary rounded flex items-center justify-center text-xs font-medium text-foreground">
                        {rank}
                      </div>

                      <div>
                        <div className="font-medium text-sm">
                          {entry.username}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(entry.created_at).toISOString().split('T')[0]}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="font-semibold text-sm">
                          {entry.points.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">points</div>
                      </div>

                      <div className="text-right">
                        <div className="font-medium text-sm">
                          {entry.expressions_completed}
                        </div>
                        <div className="text-xs text-muted-foreground">completed</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

