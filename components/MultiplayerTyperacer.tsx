import React, { useState, useCallback, useEffect } from 'react'
import { useMultiplayerGame } from '../hooks/useMultiplayerGame'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
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
  Timer
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DifficultySelection } from '../types/game'
import { toast } from 'sonner'
import 'katex/dist/katex.min.css'
import katex from 'katex'

interface MultiplayerTyperacerProps {
  onBackToMenu: () => void
  initialRoomCode?: string | null
}

export function MultiplayerTyperacer({ onBackToMenu, initialRoomCode }: MultiplayerTyperacerProps) {
  const [playerId] = useState(() => `player_${Math.random().toString(36).substr(2, 9)}`)
  const [playerName, setPlayerName] = useState('')
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

  // Debug logging
  console.log('MultiplayerTyperacer render - countdown:', countdown, 'gameState:', gameState)

  // Handle room creation
  const handleCreateRoom = useCallback(async (mode: '60' | '120') => {
    if (!playerName.trim()) {
      toast.error('Please enter your name first')
      return
    }

    console.log('Creating room with mode:', mode, 'and difficulty:', difficultySelection)
    const result = await createRoom(mode, difficultySelection)
    console.log('Create room result:', result)
    
    if (result.success && 'roomId' in result) {
      toast.success(`Room created! Share room ID: ${result.roomId}`)
    } else {
      const errorMsg = 'error' in result ? result.error || 'Failed to create room' : 'Failed to create room'
      console.error('Create room failed:', errorMsg)
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

    console.log('Joining room:', joinRoomId.trim(), 'with player:', playerId)
    const result = await joinRoom(joinRoomId.trim())
    console.log('Join room result:', result)
    
    if (result.success) {
      toast.success('Joined room successfully!')
      setJoinError('') // Clear any errors on success
    } else {
      const errorMsg = 'error' in result ? result.error || 'Failed to join room' : 'Failed to join room'
      console.error('Join room failed:', errorMsg)
      setJoinError(errorMsg)
      toast.error(errorMsg)
    }
  }, [playerName, joinRoomId, joinRoom, playerId])

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
      "bg-white rounded-lg p-4 border-2 transition-all duration-200",
      isMe ? "border-blue-300 bg-blue-50" : "border-gray-300"
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {isMe ? (
            <UserCheck className="w-4 h-4 text-blue-600" />
          ) : (
            <Users className="w-4 h-4 text-gray-600" />
          )}
          <span className={cn(
            "font-semibold text-sm",
            isMe ? "text-blue-600" : "text-gray-600"
          )}>
            {playerName} {isMe && "(You)"}
          </span>
        </div>
        <span className="text-sm font-medium text-gray-500">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className={cn(
            "h-3 rounded-full transition-all duration-300 ease-out",
            isMe ? "bg-gradient-to-r from-blue-400 to-blue-600" : "bg-gradient-to-r from-red-400 to-red-600"
          )}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>
          {gameState.room ? Math.floor((progress / 100) * gameState.room.expressions.length) : 0} / {gameState.room?.expressions.length || 10}
        </span>
        <span>expressions</span>
      </div>
    </div>
  )

  // If not in a room, show room selection
  if (!gameState.room) {
    console.log('Rendering: No room')
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-8 space-y-6">
            {/* Player name input */}
            <div className="space-y-2">
              <Label htmlFor="playerName" className="text-lg font-semibold">Your Name</Label>
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
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Select Difficulty Levels</h4>
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
                      className="font-medium capitalize cursor-pointer select-none px-3 py-1 rounded-full border transition-all duration-200"
                    >
                      {difficulty}
                    </Label>
                  </div>
                ))}
              </div>
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
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                                          Quick Race (5 expressions)
                  </Button>
                  <Button
                    onClick={() => handleCreateRoom('120')}
                    disabled={!playerName.trim()}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3"
                  >
                    <Target className="w-4 h-4 mr-2" />
                                          Long Race (10 expressions)
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

            <div className="text-center pt-4">
              <Button variant="outline" onClick={onBackToMenu}>
                Back to Main Menu
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Countdown - CHECK THIS FIRST!
  if (countdown !== null) {
    console.log('🎯 Rendering countdown UI with value:', countdown, typeof countdown)
    return (
      <div className="w-full max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-16 text-center">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Get Ready!</h2>
              <div className="text-8xl font-bold text-blue-600 animate-pulse">
                {countdown}
              </div>
              <p className="text-muted-foreground">The race begins in...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Waiting room (also show if room status is waiting, regardless of other states)
  if (gameState.room && (!gameState.gameStarted && !gameState.gameFinished || gameState.room.status === 'waiting')) {
    console.log('Rendering: Waiting room')
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center space-x-3">
                <h3 className="text-2xl font-bold">Room ID: {gameState.room.room_code}</h3>
                
                {/* Copy Code Button */}
                <div className="relative flex flex-col items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (gameState.room) {
                        navigator.clipboard.writeText(gameState.room.room_code)
                        toast.success('Room code copied!')
                        setCodeCopied(true)
                        setTimeout(() => setCodeCopied(false), 2000)
                      }
                    }}
                    className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                    title="Copy room code"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <span className="text-xs text-gray-500 mt-1">Code</span>
                  
                  {/* Floating tooltip */}
                  {codeCopied && (
                    <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium shadow-lg z-50 animate-in fade-in-0 zoom-in-95 duration-200">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Code copied!
                      </div>
                      {/* Arrow pointing down */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-green-600"></div>
                    </div>
                  )}
                </div>

                                {/* Copy Link Button */}
                <div className="relative flex flex-col items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (gameState.room) {
                        const shareableUrl = `${window.location.origin}?room=${gameState.room.room_code}`
                        navigator.clipboard.writeText(shareableUrl)
                        toast.success('Room link copied!')
                        setLinkCopied(true)
                        setTimeout(() => setLinkCopied(false), 2000)
                      }
                    }}
                    className="border-green-300 text-green-600 hover:bg-green-50 hover:text-green-700"
                    title="Copy shareable link"
                  >
                    <Share className="w-4 h-4" />
                  </Button>
                  <span className="text-xs text-gray-500 mt-1">Link</span>
                   
                                      {/* Floating tooltip for link copy */}
                   {linkCopied && (
                     <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium shadow-lg z-50 animate-in fade-in-0 zoom-in-95 duration-200">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Link copied!
                      </div>
                      {/* Arrow pointing down */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-green-600"></div>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-muted-foreground">Copy the code to share manually, or copy the link for one-click joining!</p>
            </div>

            {/* Players */}
            <div className="grid md:grid-cols-2 gap-4">
              {gameState.participants.map((participant, index) => (
                <div
                  key={participant.id}
                  className={cn(
                    "p-4 rounded-lg border-2 flex items-center justify-between",
                    participant.is_ready ? "bg-green-50 border-green-300" : "bg-gray-50 border-gray-300"
                  )}
                >
                  <div className="flex items-center space-x-2">
                    {participant.is_ready ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="font-semibold">
                      {participant.player_id === playerId ? `${playerName} (You)` : participant.username}
                    </span>
                  </div>
                  <span className={cn(
                    "px-2 py-1 rounded text-sm",
                    participant.is_ready ? "bg-green-200 text-green-800" : "bg-gray-200 text-gray-600"
                  )}>
                    {participant.is_ready ? 'Ready' : 'Not Ready'}
                  </span>
                </div>
              ))}
              
              {/* Empty slot */}
              {gameState.participants.length < 2 && (
                <div className="p-4 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                  <span className="text-gray-500">Waiting for opponent...</span>
                </div>
              )}
            </div>

            {/* Ready button */}
            {gameState.myParticipant && !gameState.myParticipant.is_ready && (
              <div className="text-center">
                <Button
                  onClick={handleMarkReady}
                  disabled={gameState.participants.length < 2}
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-3"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Ready to Start!
                </Button>
                {gameState.participants.length < 2 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Waiting for opponent to join...
                  </p>
                )}
              </div>
            )}

            {/* Game details */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Race Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">Mode:</span> {gameState.room.mode === '60' ? 'Quick Race' : 'Long Race'}
                </div>
                <div>
                  <span className="text-blue-600">Expressions:</span> {gameState.room.expressions.length}
                </div>
              </div>
              <div className="mt-2 text-xs text-blue-600">
                🏁 First to complete all expressions wins!
              </div>
            </div>

            <div className="text-center pt-4">
              <Button variant="outline" onClick={leaveRoom}>
                Leave Room
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }



  // Active game
  if (gameState.gameStarted && currentExpression && !gameState.gameFinished) {
    console.log('Rendering: Active game')
    return (
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {/* Progress indicators */}
        <div className="grid md:grid-cols-2 gap-4">
          <ProgressBar 
            progress={myProgress} 
            playerName={playerName} 
            isMe={true} 
          />
          <ProgressBar 
            progress={opponentProgress} 
            playerName={gameState.opponent?.username || "Opponent"} 
            isMe={false} 
          />
        </div>

        {/* Game status */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target className="w-6 h-6" />
                <span>Race to Finish!</span>
              </div>
              <div className="text-sm">
                Expression {gameState.currentExpressionIndex + 1} of {gameState.room?.expressions.length}
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Expression display */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Target Expression</CardTitle>
          </CardHeader>
          <CardContent className={cn(
            "p-8 text-center transition-all duration-300",
            isCorrect && "bg-green-50 border-green-200"
          )}>
            <div
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(currentExpression.latex, {
                  throwOnError: false,
                  displayMode: true
                })
              }}
            />
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
          </CardContent>
        </Card>

        {/* Input section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Your LaTeX Input</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              ref={inputRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type the LaTeX expression here..."
              className={cn(
                "w-full text-lg p-4 transition-all duration-200",
                isCorrect && "border-green-500 bg-green-50"
              )}
              autoFocus
              disabled={isCorrect}
            />
            
            <Card className="bg-gray-50 border-dashed">
              <CardContent className="p-6 text-center min-h-[60px] flex items-center justify-center">
                <div
                  dangerouslySetInnerHTML={{
                    __html: katex.renderToString(userInput || '\\phantom{x}', {
                      throwOnError: false,
                      displayMode: true
                    })
                  }}
                />
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
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Game finished
  if (gameState.gameFinished) {
    console.log('Rendering: Game finished')
    const isWinner = gameState.winner?.player_id === playerId
    
    return (
      <div className="w-full max-w-4xl mx-auto">
        <Card>
          <CardHeader className={cn(
            "text-white text-center",
            isWinner ? "bg-gradient-to-r from-green-500 to-emerald-500" : "bg-gradient-to-r from-red-500 to-orange-500"
          )}>
            <CardTitle className="text-3xl font-bold flex items-center justify-center space-x-2">
              {isWinner ? <Crown className="w-8 h-8" /> : <Trophy className="w-8 h-8" />}
              <span>{isWinner ? 'You Won!' : 'Game Over'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center space-y-6">
            <div className="text-xl">
              {isWinner 
                ? '🎉 Congratulations! You completed all expressions first!' 
                : '😔 Better luck next time! Your opponent finished first.'
              }
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
                playerName={gameState.opponent?.username || "Opponent"} 
                isMe={false} 
              />
            </div>

            <div className="space-y-4">
              <Button 
                onClick={handlePlayAgain}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3"
              >
                Play Again
              </Button>
              <div className="space-x-4">
                <Button variant="outline" onClick={leaveRoom}>
                  Leave Room
                </Button>
                <Button variant="outline" onClick={onBackToMenu}>
                  Back to Main Menu
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fallback - if we have a room but no other condition matches, show waiting room
  if (gameState.room) {
    console.log('Fallback rendering - showing waiting room', { 
      room: gameState.room, 
      gameStarted: gameState.gameStarted, 
      gameFinished: gameState.gameFinished,
      countdown 
    })
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