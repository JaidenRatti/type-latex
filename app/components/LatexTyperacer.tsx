import React, { useState } from 'react'
import { useLatexGame } from '../../hooks/useLatexGame'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { SkipForward, Play, Clock, Target, Award, Zap } from 'lucide-react'
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
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {!isGameActive && score.points === 0 && (
        <div className="space-y-8">
          {/* Game Mode Selection */}
          <div className="text-center space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 60 Second Mode */}
              <Card className="card-interactive cursor-pointer group" onClick={() => startGame('60')}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">Sprint Mode</h4>
                  <p className="text-sm text-muted-foreground mb-4">60 seconds of intense LaTeX typing</p>
                  <div className="text-2xl font-bold text-blue-600">60s</div>
                </CardContent>
              </Card>

              {/* 120 Second Mode */}
              <Card className="card-interactive cursor-pointer group" onClick={() => startGame('120')}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">Marathon Mode</h4>
                  <p className="text-sm text-muted-foreground mb-4">Extended practice session</p>
                  <div className="text-2xl font-bold text-purple-600">120s</div>
                </CardContent>
              </Card>

              {/* Zen Mode */}
              <Card className="card-interactive cursor-pointer group" onClick={() => startGame('zen')}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                    <Zap className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">Zen Mode</h4>
                  <p className="text-sm text-muted-foreground mb-4">Relaxed, untimed practice</p>
                  <div className="text-2xl font-bold text-green-600">∞</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Difficulty Selection */}
          <div className="bg-gray-50 rounded-xl p-6 border">
            <h4 className="text-lg font-semibold mb-4 text-center">Select Difficulty Levels</h4>
            <div className="flex justify-center gap-8">
              {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
                <div key={difficulty} className="flex items-center space-x-3">
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
                      "font-medium capitalize cursor-pointer select-none px-3 py-1 rounded-full border transition-all duration-200",
                      difficultyBadgeStyles[difficulty],
                      difficultySelection[difficulty] ? 'shadow-sm' : 'opacity-60'
                    )}
                  >
                    {difficulty}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isGameActive && currentExpression && (
        <div className="space-y-6">
          {/* Game Status Header */}
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Time and Mode */}
              <div className="flex items-center space-x-6">
                {gameMode !== 'zen' ? (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="text-sm text-muted-foreground">Time Left</div>
                      <div className="time-display text-2xl font-bold">{timeLeft}s</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="text-sm text-muted-foreground">Mode</div>
                      <div className="text-2xl font-bold text-green-600">Zen</div>
                    </div>
                  </div>
                )}

                {/* Score Display */}
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  <div>
                    <div className="text-sm text-muted-foreground">Score</div>
                    <div className="text-2xl font-bold text-yellow-600">{score.points}</div>
                  </div>
                </div>
              </div>

              {/* Expression Info and Skip */}
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">This Expression</div>
                  <div className="font-semibold text-blue-600">
                    +{calculateExpressionPoints(currentExpression)} pts
                  </div>
                </div>
                <div className={cn(
                  "difficulty-badge border text-xs font-semibold px-3 py-1 rounded-full",
                  difficultyBadgeStyles[currentExpression.difficulty]
                )}>
                  {currentExpression.difficulty.charAt(0).toUpperCase() + currentExpression.difficulty.slice(1)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={skipQuestion}
                  className="interactive-element"
                  title="Skip this equation"
                >
                  <SkipForward className="h-4 w-4 mr-2" />
                  Skip
                </Button>
              </div>
            </div>
          </div>

          {/* Math Expression Display */}
          <Card className="overflow-hidden relative">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <CardTitle className="text-center text-lg">Target Expression</CardTitle>
            </CardHeader>
            <CardContent className={cn(
              "math-container p-8 text-center transition-all duration-300",
              isCorrect && "correct"
            )}>
              {/* Visual display for users */}
              <div className="text-center min-h-[60px] flex items-center justify-center">
                <div
                  dangerouslySetInnerHTML={{
                    __html: katex.renderToString(currentExpression.latex, {
                      throwOnError: false,
                      displayMode: true
                    })
                  }}
                />
              </div>
            </CardContent>
            {/* Clean container for comparison - positioned off-screen */}
            <div className="absolute -left-[9999px] bg-white p-4">
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
          </Card>

          {/* Input Section */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="text-center text-lg">Your LaTeX Input</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                ref={inputRef}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type the LaTeX expression here..."
                className={cn(
                  "w-full text-lg p-4 latex-input transition-all duration-200",
                  isCorrect && "border-green-500 bg-green-50"
                )}
                autoFocus
                disabled={isCorrect}
              />
              
              {/* Live Preview */}
              <Card className="bg-gray-50 border-dashed relative">
                <CardContent className={cn(
                  "math-container user-input p-6 text-center min-h-[60px] flex items-center justify-center",
                  isCorrect && "correct"
                )}>
                  {/* Visual display for users */}
                  <div
                    dangerouslySetInnerHTML={{
                      __html: katex.renderToString(userInput || '\\phantom{x}', {
                        throwOnError: false,
                        displayMode: true
                      })
                    }}
                  />
                </CardContent>
                {/* Clean container for comparison - positioned off-screen */}
                <div className="absolute -left-[9999px] bg-white p-4">
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
              </Card>
            </CardContent>
          </Card>

          {/* Zen Mode Controls */}
          {gameMode === 'zen' && (
            <div className="text-center">
              <Button 
                onClick={endGame} 
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-8 py-3 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105"
              >
                End Zen Session
              </Button>
            </div>
          )}
        </div>
      )}

      {!isGameActive && score.points > 0 && !showUsernameDialog && (
        <Card className="card-elevated overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-center">
            <CardTitle className="text-3xl font-bold">Game Complete! 🎉</CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center space-y-6">
            {/* Score Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{score.expressionsCompleted}</div>
                <div className="text-sm text-blue-700">Expressions Completed</div>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">{score.points}</div>
                <div className="text-sm text-yellow-700">Total Points</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="text-2xl font-bold text-gray-600">{score.skipped}</div>
                <div className="text-sm text-gray-700">Expressions Skipped</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              {gameMode !== 'zen' && (
                <Button 
                  onClick={() => setShowUsernameDialog(true)}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold px-8 py-3 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105"
                >
                  {isSubmitting ? 'Submitting...' : '🏆 Submit to Leaderboard'}
                </Button>
              )}
              
              <div className="flex flex-wrap justify-center gap-4">
                <Button 
                  onClick={() => startGame('60')} 
                  variant="outline"
                  className="interactive-element"
                >
                  <Play className="w-4 h-4 mr-2" />
                  60 Seconds
                </Button>
                <Button 
                  onClick={() => startGame('120')} 
                  variant="outline"
                  className="interactive-element"
                >
                  <Play className="w-4 h-4 mr-2" />
                  120 Seconds
                </Button>
                <Button 
                  onClick={() => startGame('zen')} 
                  variant="outline"
                  className="interactive-element"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Zen Mode
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
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

