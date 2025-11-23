import React, { useState } from 'react'
import { useLatexGame } from '../../hooks/useLatexGame'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { SkipForward, Play, Clock, Target, Square } from 'lucide-react'
import { UsernameDialog } from '../../components/UsernameDialog'
import { submitScore } from '@/app/actions'
import 'katex/dist/katex.min.css'
import katex from 'katex'
import { cn } from '@/lib/utils'
import { Difficulty } from '../../types/game'
import { toast } from 'sonner'

interface LatexTyperacerProps {
  onGameEnd: () => void;
}

export function LatexTyperacer({ onGameEnd }: LatexTyperacerProps) {
  const [showUsernameDialog, setShowUsernameDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    currentExpression,
    userInput,
    setUserInput,
    timeLeft,
    isGameActive,
    timerStarted,
    score,
    setScore,
    startGame,
    gameMode,
    endGame,
    skipQuestion,
    targetRef,
    userInputRef,
    isCorrect,
    inputRef,
    calculateExpressionPoints,
    difficultySelection,
    setDifficultySelection,
    setIsGameActive
  } = useLatexGame()

  const difficultyColors: Record<Difficulty, string> = {
    easy: 'text-green-600',
    medium: 'text-yellow-600',
    hard: 'text-red-600'
  }

  const difficultyBadgeStyles: Record<Difficulty, string> = {
    easy: 'bg-green-50 text-green-700 border-green-200',
    medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    hard: 'bg-red-50 text-red-700 border-red-200'
  }

  const handleSubmitScore = async (username: string) => {
    if (gameMode === 'zen') return

    setIsSubmitting(true)
    try {
      const result = await submitScore({
        username,
        points: score.points,
        expressions_completed: score.expressionsCompleted,
        mode: gameMode as '60' | '120'
      })

      if (result.success) {
        toast.success('Score submitted successfully!')
        setShowUsernameDialog(false)
        onGameEnd()
        // Start a new game with the same mode
        startGame(gameMode)
      } else {
        console.error('Error submitting score:', result.error)
        toast.error(`Failed to submit score: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error submitting score:', error)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      {/* Top Controls - Always Visible */}
      <div className="flex items-center justify-center gap-6 text-sm">
        {/* Time Selection */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => startGame('60')}
            className={cn(
              "px-2 py-1 rounded hover:text-foreground transition-colors",
              gameMode === '60' ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            60
          </button>
          <button
            onClick={() => startGame('120')}
            className={cn(
              "px-2 py-1 rounded hover:text-foreground transition-colors",
              gameMode === '120' ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            120
          </button>
          <button
            onClick={() => startGame('zen')}
            className={cn(
              "px-2 py-1 rounded hover:text-foreground transition-colors",
              gameMode === 'zen' ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            zen
          </button>
        </div>

        <div className="w-px h-4 bg-border"></div>

        {/* Difficulty Selection */}
        <div className="flex items-center gap-2">
          {(['easy', 'medium', 'hard'] as const).map((difficulty) => {
            const colorMap = {
              easy: difficultySelection[difficulty] ? 'text-green-600' : 'text-muted-foreground',
              medium: difficultySelection[difficulty] ? 'text-yellow-600' : 'text-muted-foreground',
              hard: difficultySelection[difficulty] ? 'text-red-600' : 'text-muted-foreground'
            }

            // Check if this is the only selected difficulty
            const selectedCount = Object.values(difficultySelection).filter(Boolean).length
            const isOnlySelected = difficultySelection[difficulty] && selectedCount === 1

            return (
              <button
                key={difficulty}
                onClick={() => {
                  // Prevent deselecting if it's the last one selected
                  if (!isOnlySelected) {
                    setDifficultySelection(prev => ({ ...prev, [difficulty]: !prev[difficulty] }))
                    // If timer is running, restart the game with new difficulty
                    if (timerStarted) {
                      startGame(gameMode)
                    }
                  }
                }}
                className={cn(
                  "px-2 py-1 rounded transition-colors text-xs",
                  colorMap[difficulty],
                  !isOnlySelected && "hover:opacity-80",
                  isOnlySelected && "cursor-not-allowed opacity-100"
                )}
              >
                {difficulty}
              </button>
            )
          })}
        </div>
      </div>

      {/* Game Status - Only show after user starts typing */}
      <div className="h-8 flex items-center justify-center">
        {isGameActive && (timerStarted || gameMode === 'zen') && (
          <div className="flex items-center justify-center gap-6 text-sm animate-in fade-in duration-500">
            {gameMode !== 'zen' && (
              <div className="text-2xl font-semibold tabular-nums">{timeLeft}</div>
            )}
            <div className="text-muted-foreground">{score.points} pts</div>
            <button
              onClick={skipQuestion}
              className="text-xs text-muted-foreground hover:text-foreground ml-2"
            >
              skip
            </button>
          </div>
        )}
      </div>

      {currentExpression && (isGameActive || (!isGameActive && score.points === 0)) && (
        <div className="space-y-6">
          {/* Math Expression Display */}
          <div className="text-center py-8">
            <div
              className="inline-block"
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(currentExpression.latex, {
                  throwOnError: false,
                  displayMode: true
                })
              }}
            />
            {/* User submission indicator */}
            {currentExpression.isUserSubmitted && (
              <div className="mt-4 flex justify-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-muted/50 text-muted-foreground border border-border">
                  {currentExpression.submittedBy ? (
                    <>submitted by {currentExpression.submittedBy}</>
                  ) : (
                    <>user submitted</>
                  )}
                </span>
              </div>
            )}
            {/* Clean container for comparison - positioned off-screen */}
            <div className="absolute -left-[9999px]">
              <div
                ref={targetRef}
                dangerouslySetInnerHTML={{
                  __html: katex.renderToString(currentExpression.latex, {
                    throwOnError: false,
                    displayMode: true
                  })
                }}
              />
            </div>
          </div>

          {/* Input Section */}
          <div className="space-y-4">
            <input
              ref={inputRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="start typing..."
              className={cn(
                "w-full text-center text-lg p-4 bg-background border-b-2 border-border focus:outline-none focus:border-foreground font-mono caret-foreground transition-colors",
                isCorrect && "border-green-500"
              )}
              autoFocus
              disabled={isCorrect || (!isGameActive && score.points > 0)}
            />

            {/* Live Preview */}
            {userInput && (
              <div className="text-center py-4 text-muted-foreground">
                <div
                  className="inline-block"
                  dangerouslySetInnerHTML={{
                    __html: katex.renderToString(userInput, {
                      throwOnError: false,
                      displayMode: true
                    })
                  }}
                />
              </div>
            )}

            {/* Clean container for comparison - positioned off-screen */}
            <div className="absolute -left-[9999px]">
              <div
                ref={userInputRef}
                dangerouslySetInnerHTML={{
                  __html: katex.renderToString(userInput || '\\phantom{x}', {
                    throwOnError: false,
                    displayMode: true
                  })
                }}
              />
            </div>
          </div>
        </div>
      )}

      {!isGameActive && score.points > 0 && !showUsernameDialog && (
        <div className="text-center space-y-6 py-12">
          {/* Score Summary */}
          <div className="space-y-2">
            <div className="text-4xl font-medium">{score.points}</div>
            <div className="text-sm text-muted-foreground">
              {score.expressionsCompleted} completed · {score.skipped} skipped
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={() => startGame(gameMode)}
              variant="outline"
              size="sm"
            >
              restart
            </Button>
            {gameMode !== 'zen' && (
              <Button
                onClick={() => setShowUsernameDialog(true)}
                disabled={isSubmitting}
                variant="outline"
                size="sm"
              >
                {isSubmitting ? 'submitting...' : 'submit to leaderboard'}
              </Button>
            )}
          </div>
        </div>
      )}

      <UsernameDialog
        isOpen={showUsernameDialog}
        onClose={() => setShowUsernameDialog(false)}
        onSubmit={handleSubmitScore}
        score={score}
        gameMode={gameMode as '60' | '120'}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}

