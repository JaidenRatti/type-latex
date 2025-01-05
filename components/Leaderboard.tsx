'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getLeaderboard } from '@/app/actions'
import { LeaderboardEntry } from '@/types/game'
import { cn } from '@/lib/utils'
import { AlertCircle, Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import Script from 'next/script'
import { Button } from '@/components/ui/button'

export function Leaderboard() {
  const [mode, setMode] = useState<'60' | '120'>('60')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const refreshLeaderboard = () => {
    fetchLeaderboard()
  }

  return (
    <div className="space-y-8">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold">Leaderboard</CardTitle>
          <Button onClick={refreshLeaderboard} variant="outline" size="sm">
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Tabs defaultValue="60" onValueChange={(value) => setMode(value as '60' | '120')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="60">60 Seconds</TabsTrigger>
              <TabsTrigger value="120">120 Seconds</TabsTrigger>
            </TabsList>
            <TabsContent value="60" className="mt-4">
              <LeaderboardTable entries={entries} isLoading={isLoading} />
            </TabsContent>
            <TabsContent value="120" className="mt-4">
              <LeaderboardTable entries={entries} isLoading={isLoading} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="list-disc pl-5 space-y-2">
            <li>Don't know a symbol? Draw it using <a href="https://detexify.kirelabs.org/classify.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Detexify</a></li>
            <li>Don't use the $ symbol</li>
            <li>Use \not\in instead of \notin</li>
            <li>Use \pmod instead of \mod</li>
            <li>Use \mathbf instead of \textbf</li>
            <li>Happy typesetting!</li>
            <li>Want to add an expression? Add it below</li>
          </ul>
          <div className="mt-6">
            <div data-tf-live="01JDZXFXSAFAEF7R6ZHJJX9ZQ5"></div>
            <Script src="//embed.typeform.com/next/embed.js" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LeaderboardTable({ entries, isLoading }: { entries: LeaderboardEntry[], isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">Loading scores...</p>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No scores yet. Be the first to submit!
      </div>
    )
  }

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase bg-muted">
          <tr>
            <th scope="col" className="px-6 py-3">Rank</th>
            <th scope="col" className="px-6 py-3">Username</th>
            <th scope="col" className="px-6 py-3">Points</th>
            <th scope="col" className="px-6 py-3">Expressions</th>
          </tr>
        </thead>
        <tbody>
          {entries.slice(0, 6).map((entry, index) => (
            <tr 
              key={entry.id} 
              className={cn(
                "border-b hover:bg-muted/50 transition-colors",
                index < 3 ? "font-semibold" : ""
              )}
            >
              <td className="px-6 py-4">{index + 1}</td>
              <td className="px-6 py-4">{entry.username}</td>
              <td className="px-6 py-4">{entry.points}</td>
              <td className="px-6 py-4">{entry.expressions_completed}</td>
            </tr>
          ))}
          {entries.length > 6 && (
            <tr>
              <td colSpan={4} className="px-6 py-4 text-center text-sm text-muted-foreground">
                Showing top 6 entries. There are {entries.length - 6} more entries.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

