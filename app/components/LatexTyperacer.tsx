import React, { useState } from 'react'
import { useLatexGame } from '../../hooks/useLatexGame'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { SkipForward } from 'lucide-react'
import { UsernameDialog } from '../../components/UsernameDialog'
import { submitScore } from '@/app/actions'
import 'katex/dist/katex.min.css'
import katex from 'katex'
import { cn } from '@/lib/utils'
import { Difficulty, GameScore } from '../../types/game'
import { toast } from 'sonner'
import { CheckIcon } from 'lucide-react'

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
        // Reset the game state
        setScore({ expressionsCompleted: 0, skipped: 0, points: 0 })
        setIsGameActive(false)
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
    <Card className="w-full max-w-3xl mx-auto bg-white">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center gradient-text">Solo Mode</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isGameActive && score.points === 0 && (
          <div className="space-y-6">
            <div className="flex justify-center space-x-4">
              <Button onClick={() => startGame('60')} variant="outline">60 Seconds</Button>
              <Button onClick={() => startGame('120')} variant="outline">120 Seconds</Button>
              <Button onClick={() => startGame('zen')} variant="outline">Zen Mode</Button>
            </div>
            <div className="flex justify-center gap-6">
              {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
                <div key={difficulty} className="flex items-center space-x-2">
                  <Checkbox 
                    id={difficulty} 
                    checked={difficultySelection[difficulty]}
                    onCheckedChange={(checked) => 
                      setDifficultySelection(prev => ({ ...prev, [difficulty]: !!checked }))
                    }
                    className="border-2 w-5 h-5"
                  />
                  <Label 
                    htmlFor={difficulty} 
                    className={cn(
                      "font-medium capitalize select-none",
                      difficulty === 'easy' && "text-green-600",
                      difficulty === 'medium' && "text-yellow-600",
                      difficulty === 'hard' && "text-red-600"
                    )}
                  >
                    {difficulty}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}
        {isGameActive && currentExpression && (
          <>
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                {gameMode !== 'zen' && (
                  <div className="text-2xl font-bold text-primary">Time Left: {timeLeft}s</div>
                )}
                {gameMode === 'zen' && (
                  <div className="text-2xl font-bold text-primary">Zen Mode</div>
                )}
                <div className="text-sm text-muted-foreground">
                  Points: {score.points} (This equation: {calculateExpressionPoints(currentExpression)} pts)
                </div>
                <div className={cn("text-sm font-medium", difficultyColors[currentExpression.difficulty])}>
                  Difficulty: {currentExpression.difficulty.charAt(0).toUpperCase() + currentExpression.difficulty.slice(1)}
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={skipQuestion}
                title="Skip this equation"
                className="ml-2"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
            <Card className="bg-gray-100">
              <CardContent className="p-4">
                <div
                  ref={targetRef}
                  dangerouslySetInnerHTML={{
                    __html: katex.renderToString(currentExpression.latex, {
                      throwOnError: false,
                      displayMode: true
                    })
                  }}
                />
              </CardContent>
            </Card>
            <Input
              ref={inputRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type the LaTeX expression here..."
              className="w-full latex-input bg-white"
              autoFocus
              disabled={isCorrect}
            />
            <Card className="bg-gray-100">
              <CardContent className={cn("p-4", isCorrect && "bg-green-50")}>
                <div
                  ref={userInputRef}
                  dangerouslySetInnerHTML={{
                    __html: katex.renderToString(userInput || ' ', {
                      throwOnError: false,
                      displayMode: true
                    })
                  }}
                />
              </CardContent>
            </Card>
            {gameMode === 'zen' && (
              <Button onClick={endGame} className="w-full">End Zen Mode</Button>
            )}
          </>
        )}
        {!isGameActive && score.points > 0 && !showUsernameDialog && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2 gradient-text">Game Over!</h2>
            <div className="space-y-2">
              <p>Expressions completed: {score.expressionsCompleted}</p>
              <p>Expressions skipped: {score.skipped}</p>
              <p className="text-lg font-semibold text-primary">Total Points: {score.points}</p>
            </div>
            {gameMode !== 'zen' && (
              <Button 
                onClick={() => setShowUsernameDialog(true)}
                className="mt-4"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit to Leaderboard'}
              </Button>
            )}
            <div className="flex justify-center space-x-4 mt-4">
              <Button onClick={() => startGame('60')} variant="outline">60 Seconds</Button>
              <Button onClick={() => startGame('120')} variant="outline">120 Seconds</Button>
              <Button onClick={() => startGame('zen')} variant="outline">Zen Mode</Button>
            </div>
          </div>
        )}
      </CardContent>
      <UsernameDialog
        isOpen={showUsernameDialog}
        onClose={() => setShowUsernameDialog(false)}
        onSubmit={handleSubmitScore}
        score={score}
        gameMode={gameMode as '60' | '120'}
        isSubmitting={isSubmitting}
      />
    </Card>
  )
}

