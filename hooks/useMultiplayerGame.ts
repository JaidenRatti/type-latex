import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { compareRenderedLatex } from '../utils/compareImages'
import debounce from 'lodash/debounce'
import { 
  GameRoom, 
  GameParticipant, 
  GameProgress, 
  MultiplayerGameState, 
  LatexExpression,
  DifficultySelection 
} from '../types/game'
import { 
  createGameRoom, 
  joinGameRoom, 
  setPlayerReady, 
  updateGameProgress,
  restartGame 
} from '@/app/actions'

export function useMultiplayerGame(playerId: string, username: string) {
  const [gameState, setGameState] = useState<MultiplayerGameState>({
    room: null,
    participants: [],
    myParticipant: null,
    opponent: null,
    currentExpressionIndex: 0,
    gameStarted: false,
    gameFinished: false,
    winner: null
  })

  const [userInput, setUserInput] = useState('')
  const [previousInput, setPreviousInput] = useState('')
  const [isCorrect, setIsCorrect] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)

  const targetRef = useRef<HTMLDivElement>(null)
  const userInputRef = useRef<HTMLDivElement>(null)
  const lastTarget = useRef('')
  const inputRef = useRef<HTMLInputElement>(null)
  const subscriptionRef = useRef<any>(null)
  const countdownRef = useRef<number | null>(null)

  // Get current expression
  const currentExpression: LatexExpression | null = 
    gameState.room?.expressions[gameState.currentExpressionIndex] || null

  // Calculate progress percentage for visual indicators
  const getPlayerProgress = useCallback((participant: GameParticipant | null) => {
    if (!participant || !gameState.room) return 0
    return (participant.expressions_completed / gameState.room.expressions.length) * 100
  }, [gameState.room])

  const myProgress = getPlayerProgress(gameState.myParticipant)
  const opponentProgress = getPlayerProgress(gameState.opponent)

  // Create new game room
  const createRoom = useCallback(async (mode: '60' | '120', difficultySelection: DifficultySelection) => {
    const result = await createGameRoom(mode, difficultySelection)
    console.log('createGameRoom result:', result)
    
    if (result.success && result.data) {
      const room = result.data as GameRoom
      console.log('Room created:', room)
      setGameState(prev => ({ ...prev, room }))
      
      // Join the room we just created
      const joinResult = await joinGameRoom(room.room_code, playerId, username)
      console.log('Auto-join result:', joinResult)
      
      if (joinResult.success && joinResult.data) {
        const { participant } = joinResult.data
        setGameState(prev => ({ 
          ...prev, 
          participants: [participant],
          myParticipant: participant
        }))
        
        // Subscribe to real-time updates
        subscribeToRoom(room.id)
      }
      
      return { success: true, roomId: room.room_code }
    }
    console.error('createGameRoom failed:', result)
    return result
  }, [playerId, username])

  // Join existing room
  const joinRoom = useCallback(async (roomCode: string) => {
    const result = await joinGameRoom(roomCode, playerId, username)
    if (result.success && result.data) {
      const { room, participant } = result.data
      setGameState(prev => ({ 
        ...prev, 
        room,
        myParticipant: participant
      }))
      
      // Subscribe to real-time updates
      subscribeToRoom(room.id)
      
      // If room is already active when joining, start countdown
      if (room.status === 'active') {
        console.log('Joined active room, starting countdown')
        setTimeout(() => startGameCountdown(), 100)
      }
      
      // Fetch existing participants immediately
      const { data: participants } = await supabase
        .from('game_participants')
        .select('*')
        .eq('room_id', room.id)
        .order('created_at', { ascending: true })

      if (participants) {
        const myParticipant = participants.find(p => p.player_id === playerId) || null
        const opponent = participants.find(p => p.player_id !== playerId) || null
        
        setGameState(prev => ({
          ...prev,
          participants,
          myParticipant,
          opponent
        }))
      }
      
      return { success: true }
    }
    return result
  }, [playerId, username])

  // Mark player as ready
  const markReady = useCallback(async () => {
    if (!gameState.room) return { success: false, error: 'No room joined' }
    
    console.log('Marking player as ready...')
    const result = await setPlayerReady(gameState.room.id, playerId)
    console.log('setPlayerReady result:', result)
    if (result.success) {
      setGameState(prev => ({
        ...prev,
        myParticipant: prev.myParticipant ? { ...prev.myParticipant, is_ready: true } : null
      }))
    }
    return result
  }, [gameState.room, playerId])

  // Start game countdown
  const startGameCountdown = useCallback(() => {
    console.log('startGameCountdown called, current countdown:', countdown, 'countdownRef:', countdownRef.current)
    
    // Prevent multiple countdowns
    if (countdownRef.current !== null) {
      console.log('Countdown already in progress, skipping')
      return
    }
    
    countdownRef.current = 3
    setCountdown(3)
    console.log('🎯 Countdown started! Setting countdown to 3')
    
    let currentCount = 3
    const countdownInterval = setInterval(() => {
      currentCount -= 1
      console.log('Countdown tick:', currentCount)
      
      if (currentCount <= 0) {
        clearInterval(countdownInterval)
        setCountdown(null)
        countdownRef.current = null
        console.log('Countdown finished, starting game')
        // Small delay to ensure UI updates
        setTimeout(() => {
          setGameState(prev => ({ ...prev, gameStarted: true }))
        }, 100)
      } else {
        setCountdown(currentCount)
        countdownRef.current = currentCount
      }
    }, 1000)
  }, [])

  // Subscribe to real-time room updates
  const subscribeToRoom = useCallback((roomId: string) => {
    // Clean up existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }

    // Subscribe to room changes
    const roomSubscription = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${roomId}`
        },
        (payload) => {
          console.log('Room update:', payload)
          if (payload.new) {
            const updatedRoom = payload.new as GameRoom
            const oldStatus = (payload.old as GameRoom | undefined)?.status || 'unknown'
            console.log('Room status changed from', oldStatus, 'to:', updatedRoom.status, 'Current countdown:', countdown)
            
            // Update room first
            setGameState(prev => ({ ...prev, room: updatedRoom }))
            
            // Check if game is restarting (going back to waiting from finished)
            if (updatedRoom.status === 'waiting' && gameState.gameFinished) {
              console.log('Game restart detected - resetting state for non-pressing player')
              // Reset game state for restart
              setGameState(prev => ({
                ...prev,
                gameStarted: false,
                gameFinished: false,
                currentExpressionIndex: 0,
                winner: null
              }))
              setUserInput('')
              setPreviousInput('')
              setIsCorrect(false)
              setCountdown(null)
              countdownRef.current = null
              
              // Fetch updated participants (with reset ready states)
              setTimeout(() => fetchParticipants(roomId), 100)
            }
            
            // Check if game is starting
            if (updatedRoom.status === 'active' && countdownRef.current === null) {
              console.log('🚀 Game is active and no countdown running, starting countdown. oldStatus:', oldStatus, 'gameStarted:', gameState.gameStarted)
              console.log('🚀 About to call startGameCountdown()')
              startGameCountdown()
            } else if (updatedRoom.status === 'active') {
              console.log('⚠️ Game is active but countdown already running:', countdownRef.current)
            }
            
            // Check if game finished
            if (updatedRoom.status === 'finished') {
              setGameState(prev => ({ ...prev, gameFinished: true }))
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_participants',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('Participant update:', payload)
          // Refresh participants
          fetchParticipants(roomId)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_progress',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('Progress update:', payload)
          // Handle opponent progress updates
          if (payload.new) {
            const progress = payload.new as GameProgress
            if (progress.player_id !== playerId && progress.is_correct) {
              // Opponent completed an expression
              fetchParticipants(roomId)
            }
          }
        }
      )
      .subscribe()

    subscriptionRef.current = roomSubscription
  }, [playerId, gameState.gameStarted, gameState.gameFinished, startGameCountdown])

  // Fetch current participants
  const fetchParticipants = useCallback(async (roomId: string) => {
    const { data: participants } = await supabase
      .from('game_participants')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })

    if (participants) {
      const myParticipant = participants.find(p => p.player_id === playerId) || null
      const opponent = participants.find(p => p.player_id !== playerId) || null
      
      setGameState(prev => ({
        ...prev,
        participants,
        myParticipant,
        opponent
      }))

      // Check for winner
      const winner = participants.find(p => p.finished_at) || null
      if (winner) {
        setGameState(prev => ({ ...prev, winner, gameFinished: true }))
      } else {
        // No winner means game is not finished (important for restart)
        setGameState(prev => ({ ...prev, winner: null, gameFinished: false }))
      }
    }
  }, [playerId])

  // Validate expression
  const validateExpression = useCallback(async () => {
    if (!currentExpression || !gameState.room || !gameState.gameStarted) return
    if (userInput === previousInput) return
    setPreviousInput(userInput)

    if (!userInput) return
    if (isCorrect) return
    if (!targetRef.current || !userInputRef.current) return

    try {
      const isMatch = await compareRenderedLatex(
        targetRef.current, 
        userInputRef.current,
        currentExpression.latex,
        userInput
      )
      
      if (isMatch && lastTarget.current !== currentExpression.latex) {
        lastTarget.current = currentExpression.latex
        setIsCorrect(true)
        
        // Update progress in database
        await updateGameProgress(
          gameState.room.id,
          playerId,
          gameState.currentExpressionIndex,
          userInput,
          true
        )
        
        // Move to next expression
        setTimeout(() => {
          setGameState(prev => ({
            ...prev,
            currentExpressionIndex: prev.currentExpressionIndex + 1
          }))
          setUserInput('')
          setPreviousInput('')
          setIsCorrect(false)
          // Auto-focus input for next expression
          setTimeout(() => inputRef.current?.focus(), 100)
        }, 800)
      } else {
        // Record incorrect attempt
        await updateGameProgress(
          gameState.room.id,
          playerId,
          gameState.currentExpressionIndex,
          userInput,
          false
        )
      }
    } catch (error) {
      console.error('Validation error:', error)
    }
  }, [userInput, previousInput, isCorrect, currentExpression, gameState, playerId])

  const debouncedValidation = useCallback(
    debounce(() => {
      if (gameState.gameStarted && !isCorrect && !gameState.gameFinished) {
        validateExpression()
      }
    }, 150),
    [gameState.gameStarted, isCorrect, gameState.gameFinished, validateExpression]
  )

  // No game timer in pure race mode - winner is determined by finishing all expressions

  // Validation effect
  useEffect(() => {
    debouncedValidation()
    return () => debouncedValidation.cancel()
  }, [userInput, debouncedValidation])

  // Auto-focus input when game starts or expression changes
  useEffect(() => {
    if (gameState.gameStarted && !gameState.gameFinished) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [gameState.gameStarted, gameState.currentExpressionIndex, gameState.gameFinished])

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [])

  // Leave room
  const leaveRoom = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }
    setGameState({
      room: null,
      participants: [],
      myParticipant: null,
      opponent: null,
      currentExpressionIndex: 0,
      gameStarted: false,
      gameFinished: false,
      winner: null
    })
    setUserInput('')
    setPreviousInput('')
    setIsCorrect(false)
    setCountdown(null)
    setTimeLeft(0)
  }, [])

  // Restart game with same players
  const restartGameInRoom = useCallback(async () => {
    if (!gameState.room?.id) return { success: false, error: 'No room to restart' }
    
    const result = await restartGame(gameState.room.id)
    
    if (result.success) {
      // Reset local state
      setUserInput('')
      setPreviousInput('')
      setIsCorrect(false)
      setCountdown(null)
      setTimeLeft(0)
      
      // Reset game state while keeping room and participants
      setGameState(prev => ({
        ...prev,
        currentExpressionIndex: 0,
        gameStarted: false,
        gameFinished: false,
        winner: null
      }))
      
      // The real-time subscription will handle updating the room data
      // and participant ready states when the database is updated
    }
    
    return result
  }, [gameState.room?.id])

  return {
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
    restartGameInRoom,
    debouncedValidation
  }
} 