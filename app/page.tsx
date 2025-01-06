'use client'

import { useState, useCallback } from 'react'
import { LatexTyperacer } from './components/LatexTyperacer'
import { Leaderboard } from '../components/Leaderboard'
import { SquarePiIcon as MathIcon } from 'lucide-react'

export default function Home() {
  const [leaderboardKey, setLeaderboardKey] = useState(0)

  const handleGameEnd = useCallback(() => {
    setLeaderboardKey(prevKey => prevKey + 1)
  }, [])

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="text-center mb-12">
          <div className="flex justify-center items-center mb-4">
            <MathIcon className="w-16 h-16 text-primary mr-4" />
            <h1 className="text-4xl font-bold gradient-text font-heading">
              Type LaTeX
            </h1>
          </div>
          <p className="text-xl text-gray-600">
            Master the art of LaTeX!
          </p>
        </header>

        <div className="space-y-8">
          <section className="bg-white rounded-lg p-6 w-full">
            <h2 className="text-2xl font-semibold text-primary mb-6 font-heading">Practice Arena</h2>
            <LatexTyperacer onGameEnd={handleGameEnd} />
          </section>
          <section className="bg-white rounded-lg p-6 w-full">
            <h2 className="text-2xl font-semibold text-primary mb-6 font-heading">Leaderboard</h2>
            <Leaderboard key={leaderboardKey} />
          </section>
        </div>

        <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>© 2024 <a href="https://github.com/JaidenRatti/type-latex" target="_blank">Type LaTeX</a>. All rights reserved.</p>
        </footer>
      </div>
    </main>
  )
}

