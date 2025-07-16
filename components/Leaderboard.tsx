'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getLeaderboard } from '@/app/actions'
import { LeaderboardEntry } from '@/types/game'
import { cn } from '@/lib/utils'
import { AlertCircle, Trophy, Medal, Award, Crown, Sparkles, RefreshCw, Timer, Target } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
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

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-orange-500" />
      default:
        return null
    }
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white"
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-400 text-white"
      case 3:
        return "bg-gradient-to-r from-orange-400 to-orange-500 text-white"
      default:
        return "bg-gray-100 text-gray-600"
    }
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
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-white shadow-sm border">
              <TabsTrigger 
                value="60" 
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white flex items-center space-x-2"
              >
                <Timer className="w-4 h-4" />
                <span>60 Seconds</span>
              </TabsTrigger>
              <TabsTrigger 
                value="120"
                className="data-[state=active]:bg-purple-500 data-[state=active]:text-white flex items-center space-x-2"
              >
                <Target className="w-4 h-4" />
                <span>120 Seconds</span>
              </TabsTrigger>
            </TabsList>
            
            <Button 
              onClick={refreshLeaderboard} 
              variant="outline" 
              size="sm"
              className="interactive-element flex items-center space-x-2"
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* Tips Card */}
        <Card className="card-elevated">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-xl">
            <CardTitle className="text-xl font-bold flex items-center space-x-2">
              <Sparkles className="w-5 h-5" />
              <span>Pro Tips</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm">
                    <strong>Don't know a symbol?</strong> Draw it using{' '}
                    <a 
                      href="https://detexify.kirelabs.org/classify.html" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:text-blue-800 font-medium underline transition-colors"
                    >
                      Detexify
                    </a>
                  </p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <p className="text-sm">Use <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">\not\in</code> instead of <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">\notin</code></p>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <p className="text-sm">Use <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">\pmod</code> instead of <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">\mod</code></p>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <p className="text-sm">Use <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">\mathbf</code> instead of <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">\textbf</code></p>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <p className="text-sm"><strong>Never use</strong> the <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">$</code> symbol</p>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <p className="text-sm font-medium text-green-700">Happy typesetting! 🎯</p>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Community Contribution Card */}
        <Card className="card-elevated">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-xl">
            <CardTitle className="text-xl font-bold flex items-center space-x-2">
              <Award className="w-5 h-5" />
              <span>Join the Community</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Help improve Type LaTeX by contributing new expressions and features!
              </p>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">Want to add an expression?</h4>
                <p className="text-sm text-green-700 mb-4">
                  Submit your favorite LaTeX expressions to help others learn
                </p>
                
                <div data-tf-live="01JDZXFXSAFAEF7R6ZHJJX9ZQ5"></div>
                <Script src="//embed.typeform.com/next/embed.js" />
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
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-orange-500" />
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <Card className="card-elevated">
        <CardContent className="p-8">
          <div className="text-center py-12">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
              <Trophy className="w-6 h-6 text-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="mt-4 text-lg font-medium text-muted-foreground">Loading rankings...</p>
            <p className="text-sm text-muted-foreground">Fetching the latest scores</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (entries.length === 0) {
    return (
      <Card className="card-elevated">
        <CardContent className="p-8">
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No scores yet!</h3>
            <p className="text-muted-foreground mb-6">Be the first to set a record in {mode}-second mode</p>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-700">
                🏆 Submit your score to claim the top spot!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="card-elevated overflow-hidden">
      <CardContent className="p-0">
        <div className="custom-scrollbar" style={{ maxHeight: '500px', overflowY: 'auto' }}>
          <div className="divide-y divide-gray-100">
            {entries.map((entry, index) => {
              const rank = index + 1
              const isTopThree = rank <= 3
              
              return (
                <div 
                  key={entry.id} 
                  className={cn(
                    "leaderboard-row p-4 transition-all duration-200",
                    rank === 1 && "rank-1",
                    rank === 2 && "rank-2", 
                    rank === 3 && "rank-3"
                  )}
                >
                  <div className="flex items-center justify-between">
                    {/* Rank and User Info */}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {isTopThree ? (
                          <div className="flex items-center space-x-2">
                            {getRankIcon(rank)}
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                              rank === 1 && "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg",
                                                             rank === 2 && "bg-gradient-to-r from-slate-400 to-blue-400 text-white shadow-lg",
                              rank === 3 && "bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg"
                            )}>
                              {rank}
                            </div>
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
                            {rank}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <div className={cn(
                          "font-semibold",
                          isTopThree ? "text-lg" : "text-base",
                          rank === 1 && "text-yellow-700",
                          rank === 2 && "text-slate-700",
                          rank === 3 && "text-orange-700"
                        )}>
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
                        <div className={cn(
                          "font-bold",
                          isTopThree ? "text-xl" : "text-lg",
                          rank === 1 && "text-yellow-600",
                          rank === 2 && "text-slate-600", 
                          rank === 3 && "text-orange-600"
                        )}>
                          {entry.points.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">points</div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-semibold text-blue-600">
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

