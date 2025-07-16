'use client'

import { useState, useCallback } from 'react'
import { LatexTyperacer } from './components/LatexTyperacer'
import { Leaderboard } from '../components/Leaderboard'
import { SquarePiIcon as MathIcon, Sparkles, Trophy, Timer } from 'lucide-react'

export default function Home() {
  const [leaderboardKey, setLeaderboardKey] = useState(0)

  const handleGameEnd = useCallback(() => {
    setLeaderboardKey(prevKey => prevKey + 1)
  }, [])

  return (
    <main className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-subtle"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-subtle delay-1000"></div>
        <div className="absolute -bottom-32 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-subtle delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <header className="text-center mb-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-md opacity-30 animate-pulse"></div>
              <MathIcon className="relative w-16 h-16 text-primary animate-bounce-gentle" />
            </div>
            <div className="space-y-2">
              <h1 className="text-5xl font-bold gradient-text font-heading text-shadow">
                Type LaTeX
              </h1>
              <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span>Master the art of typing math</span>
                <Sparkles className="w-4 h-4 text-yellow-500" />
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-8">
          {/* Practice Arena Section */}
          <section className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-2xl blur-sm"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/40 card-elevated overflow-hidden">
              {/* Section Header */}
              <div className="game-header">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <MathIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-white font-heading">Practice Arena</h2>
                      <p className="text-blue-100 text-sm">Challenge yourself with LaTeX expressions</p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center space-x-4 text-blue-100">
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">100+</div>
                      <div className="text-xs opacity-80">Expressions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">3</div>
                      <div className="text-xs opacity-80">Difficulties</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Game Content */}
              <div className="p-8">
                <LatexTyperacer onGameEnd={handleGameEnd} />
              </div>
            </div>
          </section>

          {/* Leaderboard Section */}
          <section className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-50/50 to-orange-50/50 rounded-2xl blur-sm"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/40 card-elevated overflow-hidden">
              {/* Section Header */}
              <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-white font-heading">Leaderboard</h2>
                      <p className="text-yellow-100 text-sm">Compete with LaTeX masters worldwide</p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-300 rounded-full animate-pulse"></div>
                    <span className="text-yellow-100 text-sm">Live Rankings</span>
                  </div>
                </div>
              </div>
              
              {/* Leaderboard Content */}
              <div className="p-8">
                <Leaderboard key={leaderboardKey} />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-20 text-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/30 shadow-lg">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <MathIcon className="w-6 h-6 text-primary" />
                <span className="text-lg font-semibold gradient-text">Type LaTeX</span>
              </div>
              <p className="text-muted-foreground mb-4">
                Open source LaTeX typing practice game
              </p>
              <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
                <a 
                  href="https://github.com/JaidenRatti/type-latex" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors duration-200 font-medium"
                >
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}

