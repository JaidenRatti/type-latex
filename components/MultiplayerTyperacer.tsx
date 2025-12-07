import React, { useState, useCallback, useEffect } from 'react'
import { useMultiplayerGame } from '../hooks/useMultiplayerGame'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users,
  Crown,
  Clock,
  Copy,
  Share,
  Target,
  Trophy,
  Zap,
  CheckCircle,
  Circle,
  UserCheck,
  Timer,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DifficultySelection } from '../types/game'
import { toast } from 'sonner'
import 'katex/dist/katex.min.css'
import katex from 'katex'

interface MultiplayerTyperacerProps {
  initialRoomCode?: string | null
}

export function MultiplayerTyperacer({ initialRoomCode }: MultiplayerTyperacerProps) {
  const [playerId] = useState(() => `player_${Math.random().toString(36).substr(2, 9)}`)
  const [playerName, setPlayerName] = useState(() => {
    // Load saved username from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('typelatex_username') || ''
    }
    return ''
  })
  const [joinRoomId, setJoinRoomId] = useState('')
  const [difficultySelection, setDifficultySelection] = useState<DifficultySelection>({
    easy: true,
    medium: true,
    hard: true
  })
  const [codeCopied, setCodeCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [showJoinTooltip, setShowJoinTooltip] = useState(false)

  // Save username to localStorage whenever it changes
  useEffect(() => {
    if (playerName.trim()) {
      localStorage.setItem('typelatex_username', playerName.trim())
    }
  }, [playerName])

  // Auto-fill room code from URL parameter
  useEffect(() => {
    if (initialRoomCode && !joinRoomId) {
      setJoinRoomId(initialRoomCode)
      toast.success(`Room code ${initialRoomCode} auto-filled! Enter your name to join.`)
    }
  }, [initialRoomCode, joinRoomId])

  const {
    gameState,
    userInput,
    setUserInput,
    isCorrect,
    countdown,
    timeLeft,
    currentExpression,
    myProgress,
    opponentProgress,
    targetRef,
    userInputRef,
    inputRef,
    createRoom,
    joinRoom,
    markReady,
    leaveRoom,
    restartGameInRoom
  } = useMultiplayerGame(playerId, playerName)

  // Handle room creation
  const handleCreateRoom = useCallback(async (mode: '60' | '120') => {
    if (!playerName.trim()) {
      toast.error('Please enter your name first')
      return
    }

    const result = await createRoom(mode, difficultySelection)

    if (result.success && 'roomId' in result) {
      toast.success(`Room created! Share room ID: ${result.roomId}`)
    } else {
      const errorMsg = 'error' in result ? result.error || 'Failed to create room' : 'Failed to create room'
      toast.error(`Failed to create room: ${errorMsg}`)
    }
  }, [playerName, difficultySelection, createRoom])

  // Handle joining room
  const handleJoinRoom = useCallback(async () => {
    setJoinError('') // Clear previous errors
    
    if (!playerName.trim()) {
      toast.error('Please enter your name first')
      return
    }
    if (!joinRoomId.trim()) {
      toast.error('Please enter a room ID')
      return
    }

    const result = await joinRoom(joinRoomId.trim())

    if (result.success) {
      toast.success('Joined room successfully!')
      setJoinError('') // Clear any errors on success
    } else {
      const errorMsg = 'error' in result ? result.error || 'Failed to join room' : 'Failed to join room'
      setJoinError(errorMsg)
      toast.error(errorMsg)
    }
  }, [playerName, joinRoomId, joinRoom])

  // Handle ready state
  const handleMarkReady = useCallback(async () => {
    const result = await markReady()
    if (result.success) {
      toast.success('Marked as ready!')
    } else {
      toast.error(result.error || 'Failed to mark ready')
    }
  }, [markReady])

  // Handle play again
  const handlePlayAgain = useCallback(async () => {
    const result = await restartGameInRoom()
    if (result.success) {
      toast.success('Game restarted! Get ready for another round!')
    } else {
      toast.error(result.error || 'Failed to restart game')
    }
  }, [restartGameInRoom])

  // Progress bar component
  const ProgressBar = ({ progress, playerName, isMe }: { progress: number, playerName: string, isMe: boolean }) => (
    <div className={cn(
      "bg-card rounded border p-3",
      isMe ? "border-foreground" : "border-border"
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className={cn(
          "text-xs font-medium",
          isMe ? "text-foreground" : "text-muted-foreground"
        )}>
          {playerName} {isMe && "(you)"}
        </span>
        <span className="text-xs text-muted-foreground">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="w-full bg-border rounded h-1.5">
        <div
          className={cn(
            "h-1.5 rounded transition-all duration-300 ease-out",
            isMe ? "bg-foreground" : "bg-muted-foreground"
          )}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>
          {gameState.room ? Math.floor((progress / 100) * gameState.room.expressions.length) : 0} / {gameState.room?.expressions.length || 10}
        </span>
      </div>
    </div>
  )

  // If not in a room, show room selection
  if (!gameState.room) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-8 space-y-6">
            {/* Player name input */}
            <div className="space-y-2">
              <label htmlFor="playerName" className="text-lg font-semibold block">Your Name</label>
              <Input
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your display name"
                className="text-lg p-4"
                maxLength={20}
              />
            </div>

            {/* Difficulty selection */}
            <div className="flex items-center justify-center gap-2">
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

            {/* Room actions */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Create room */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-center">Create Room</h3>
                <div className="space-y-3">
                  <Button
                    onClick={() => handleCreateRoom('60')}
                    disabled={!playerName.trim()}
                    className="w-full bg-background hover:bg-muted border-2 border-border hover:border-foreground/20 text-foreground py-6 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex flex-col items-center">
                      <span className="font-medium text-base">Quick Race</span>
                      <span className="text-xs text-muted-foreground">5 expressions</span>
                    </div>
                  </Button>
                  <Button
                    onClick={() => handleCreateRoom('120')}
                    disabled={!playerName.trim()}
                    className="w-full bg-background hover:bg-muted border-2 border-border hover:border-foreground/20 text-foreground py-6 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex flex-col items-center">
                      <span className="font-medium text-base">Long Race</span>
                      <span className="text-xs text-muted-foreground">10 expressions</span>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Join room */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-center">Join Room</h3>
                <div className="space-y-3">
                  <Input
                    value={joinRoomId}
                    onChange={(e) => {
                      setJoinRoomId(e.target.value)
                      if (joinError) setJoinError('') // Clear error when user starts typing
                    }}
                    placeholder="Enter room ID"
                    className="text-center"
                  />
                  <div 
                    className="relative"
                    onMouseEnter={() => {
                      if (!playerName.trim() || !joinRoomId.trim()) {
                        setShowJoinTooltip(true)
                      }
                    }}
                    onMouseLeave={() => setShowJoinTooltip(false)}
                  >
                    <Button
                      onClick={handleJoinRoom}
                      disabled={!playerName.trim() || !joinRoomId.trim()}
                      className="w-full bg-green-500 hover:bg-green-600 text-white py-3 disabled:bg-gray-400 disabled:cursor-help transition-all"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Join Room
                    </Button>
                    
                    {/* Tooltip for disabled state */}
                    {showJoinTooltip && (!playerName.trim() || !joinRoomId.trim()) && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-gray-800 text-white px-3 py-2 rounded-md text-sm font-medium shadow-xl z-[100] whitespace-nowrap animate-in fade-in-0 slide-in-from-top-2 duration-200">
                        {!playerName.trim() && !joinRoomId.trim() 
                          ? "Please enter your name and room code"
                          : !playerName.trim() 
                          ? "Please enter your name first"
                          : "Please enter a room code"
                        }
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800"></div>
                      </div>
                    )}
                  </div>
                  
                  {/* Error message for room joining */}
                  {joinError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                      <div className="flex items-center gap-2">
                        <Circle className="w-4 h-4 text-red-500 fill-current" />
                        {joinError}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Countdown OR Active Game - render together to avoid progress bar re-rendering
  if (countdown !== null || (gameState.gameStarted && currentExpression && !gameState.gameFinished)) {
    const isCountdown = countdown !== null

    return (
      <div className="w-full max-w-6xl mx-auto space-y-6 transition-all duration-300 ease-in-out">
        {/* Progress indicators - persistent across countdown and active game */}
        <div className="grid md:grid-cols-2 gap-4">
          <ProgressBar 
            progress={isCountdown ? 0 : myProgress} 
            playerName={playerName} 
            isMe={true} 
          />
          <ProgressBar 
            progress={isCountdown ? 0 : opponentProgress} 
            playerName={gameState.opponent?.username || "Opponent"} 
            isMe={false} 
          />
        </div>

        {/* Countdown OR Active Game Content */}
        {isCountdown ? (
          <div className="py-16 text-center">
            <div className="space-y-6">
              <div className="text-8xl font-bold tabular-nums">
                {countdown}
              </div>
              <p className="text-sm text-muted-foreground">get ready...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Game status */}
            <div className="text-center text-sm text-muted-foreground">
              expression {gameState.currentExpressionIndex + 1} of {gameState.room?.expressions.length}
            </div>

            {/* Expression display */}
            <div className="text-center py-8">
              <div
                className="inline-block"
                dangerouslySetInnerHTML={{
                  __html: katex.renderToString(currentExpression!.latex, {
                    throwOnError: false,
                    displayMode: true
                  })
                }}
              />
              <div className="absolute -left-[9999px]">
                <div
                  ref={targetRef}
                  dangerouslySetInnerHTML={{
                    __html: katex.renderToString(currentExpression!.latex, {
                      throwOnError: false,
                      displayMode: true
                    })
                  }}
                />
              </div>
            </div>

            {/* Input section */}
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
                  disabled={isCorrect}
                />

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
          </>
        )}
      </div>
    )
  }

  // Waiting room - only when room status is waiting AND no countdown
  if (gameState.room && gameState.room.status === 'waiting') {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="text-lg font-mono">{gameState.room.room_code}</div>
            <button
              onClick={() => {
                if (gameState.room) {
                  navigator.clipboard.writeText(gameState.room.room_code)
                  toast.success('code copied')
                }
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              copy code
            </button>
            <button
              onClick={() => {
                if (gameState.room) {
                  const shareableUrl = `${window.location.origin}?room=${gameState.room.room_code}`
                  navigator.clipboard.writeText(shareableUrl)
                  toast.success('link copied')
                }
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              copy link
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {gameState.room.mode === '60' ? '5' : '10'} expressions · first to finish wins
          </p>
        </div>

        {/* Players */}
        <div className="space-y-3">
          {gameState.participants.map((participant) => (
            <div
              key={participant.id}
              className={cn(
                "p-3 rounded border flex items-center justify-between text-sm",
                participant.is_ready
                  ? "border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-950/30"
                  : "border-border bg-card"
              )}
            >
              <span className={cn(
                "text-foreground",
                participant.player_id === playerId && "font-medium"
              )}>
                {participant.player_id === playerId ? `${playerName} (you)` : participant.username}
              </span>
              <span className={cn(
                "text-xs",
                participant.is_ready ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
              )}>
                {participant.is_ready ? 'ready' : 'not ready'}
              </span>
            </div>
          ))}

          {/* Empty slot */}
          {gameState.participants.length < 2 && (
            <div className="p-3 rounded border border-dashed border-border bg-card flex items-center justify-center text-sm text-muted-foreground">
              waiting for opponent...
            </div>
          )}
        </div>

        {/* Ready button */}
        {gameState.myParticipant && !gameState.myParticipant.is_ready && (
          <div className="text-center space-y-2">
            <Button
              onClick={handleMarkReady}
              disabled={gameState.participants.length < 2}
              variant="outline"
              size="sm"
            >
              ready
            </Button>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={leaveRoom}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            leave room
          </button>
        </div>
      </div>
    )
  }





  // Game finished
  if (gameState.gameFinished) {
    const isWinner = gameState.winner?.player_id === playerId

    return (
      <div className="w-full max-w-3xl mx-auto text-center space-y-8 py-12">
        <div className="space-y-2">
          <div className="text-4xl font-medium">
            {isWinner ? 'you won' : 'you lost'}
          </div>
          <p className="text-sm text-muted-foreground">
            {isWinner
              ? 'nice work!'
              : `${gameState.winner?.username || 'opponent'} finished first`
            }
          </p>
        </div>

        {/* Final progress */}
        <div className="grid md:grid-cols-2 gap-4">
          <ProgressBar
            progress={myProgress}
            playerName={playerName}
            isMe={true}
          />
          <ProgressBar
            progress={opponentProgress}
            playerName={gameState.opponent?.username || "opponent"}
            isMe={false}
          />
        </div>

        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={handlePlayAgain}
            variant="outline"
            size="sm"
          >
            play again
          </Button>
          <button
            onClick={leaveRoom}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            leave room
          </button>
        </div>
      </div>
    )
  }

  // Fallback - if we have a room but no other condition matches, show waiting room
  if (gameState.room) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Loading game state...</p>
            <Button 
              variant="outline" 
              onClick={leaveRoom} 
              className="mt-4"
            >
              Leave Room
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
} 