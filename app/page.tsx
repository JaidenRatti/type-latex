'use client'

import { useState, useCallback, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { LatexTyperacer } from './components/LatexTyperacer'
import { MultiplayerTyperacer } from '../components/MultiplayerTyperacer'
import { Leaderboard } from '../components/Leaderboard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Square, Trophy, Timer, Users } from 'lucide-react'

// Component to handle search params with proper Suspense boundary
function SearchParamsHandler({ 
  setInitialRoomCode, 
  setActiveTab 
}: { 
  setInitialRoomCode: (code: string | null) => void
  setActiveTab: (tab: string) => void 
}) {
  const searchParams = useSearchParams()

  // Handle shareable room links
  useEffect(() => {
    const roomCode = searchParams.get('room')
    if (roomCode) {
      setInitialRoomCode(roomCode)
      setActiveTab('multiplayer')
    }
  }, [searchParams, setInitialRoomCode, setActiveTab])

  return null
}

function HomeContent() {
  const [leaderboardKey, setLeaderboardKey] = useState(0)
  const [activeTab, setActiveTab] = useState('practice')
  const [initialRoomCode, setInitialRoomCode] = useState<string | null>(null)

  const handleGameEnd = useCallback(() => {
    setLeaderboardKey(prevKey => prevKey + 1)
  }, [])

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Handle search params with Suspense boundary */}
      <Suspense fallback={null}>
        <SearchParamsHandler
          setInitialRoomCode={setInitialRoomCode}
          setActiveTab={setActiveTab}
        />
      </Suspense>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-medium text-foreground mb-1">
            typelatex
          </h1>
          <p className="text-xs text-muted-foreground">
            practice typing mathematical expressions
          </p>
        </header>

        {/* Main Content with Tabs */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-6">
              <TabsList className="bg-transparent border-0 space-x-4">
                <TabsTrigger
                  value="practice"
                  className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground data-[state=active]:shadow-none border-0 text-sm px-3 py-1 hover:text-foreground"
                >
                  <Timer className="w-3 h-3 mr-1.5" />
                  practice
                </TabsTrigger>
                <TabsTrigger
                  value="multiplayer"
                  className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground data-[state=active]:shadow-none border-0 text-sm px-3 py-1 hover:text-foreground"
                >
                  <Users className="w-3 h-3 mr-1.5" />
                  multiplayer
                </TabsTrigger>
                <TabsTrigger
                  value="leaderboard"
                  className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground data-[state=active]:shadow-none border-0 text-sm px-3 py-1 hover:text-foreground"
                >
                  <Trophy className="w-3 h-3 mr-1.5" />
                  leaderboard
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Practice Mode */}
            <TabsContent value="practice" className="mt-0">
              <LatexTyperacer onGameEnd={handleGameEnd} />
            </TabsContent>

            {/* Multiplayer Mode */}
            <TabsContent value="multiplayer" className="mt-0">
              <MultiplayerTyperacer initialRoomCode={initialRoomCode} />
            </TabsContent>

            {/* Leaderboard */}
            <TabsContent value="leaderboard" className="mt-0">
              <Leaderboard key={leaderboardKey} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-muted-foreground">
          <a
            href="https://github.com/JaidenRatti/type-latex"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            github
          </a>
        </footer>
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}

