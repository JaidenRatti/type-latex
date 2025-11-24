import { useState, useEffect, useCallback, useRef } from 'react'
import { compareRenderedLatex } from '../utils/compareImages'
import debounce from 'lodash/debounce'
import { latexExpressions } from '../data/expressions'
import { GameMode, GameScore, DifficultySelection, LatexExpression } from '../types/game'
import { toast } from 'sonner'

export function useLatexGame() {
  const [currentExpression, setCurrentExpression] = useState<LatexExpression | null>(null)
  const [userInput, setUserInput] = useState('')
  const [previousInput, setPreviousInput] = useState('')
  const [timeLeft, setTimeLeft] = useState(60)
  const [isGameActive, setIsGameActive] = useState(false)
  const [timerStarted, setTimerStarted] = useState(false)
  const [score, setScore] = useState<GameScore>({
    expressionsCompleted: 0,
    skipped: 0,
    points: 0
  })
  const [gameMode, setGameMode] = useState<GameMode>('60')
  const [isCorrect, setIsCorrect] = useState(false)
  const [difficultySelection, setDifficultySelection] = useState<DifficultySelection>({
    easy: true,
    medium: true,
    hard: true
  })

  const targetRef = useRef<HTMLDivElement>(null)
  const userInputRef = useRef<HTMLDivElement>(null)
  const lastTarget = useRef('')
  const inputRef = useRef<HTMLInputElement>(null)

  const getAvailableExpressions = useCallback(() => {
    return latexExpressions.filter(expr => 
      (difficultySelection.easy && expr.difficulty === 'easy') ||
      (difficultySelection.medium && expr.difficulty === 'medium') ||
      (difficultySelection.hard && expr.difficulty === 'hard')
    )
  }, [difficultySelection])

  const calculateExpressionPoints = useCallback((expression: LatexExpression) => {
    const difficultyMultiplier = {
      easy: 1,
      medium: 1.5,
      hard: 2
    }
    return Math.round((10 + expression.latex.length) * difficultyMultiplier[expression.difficulty])
  }, [])

  const getNextExpression = useCallback(() => {
    const availableExpressions = getAvailableExpressions()
    if (availableExpressions.length === 0) {
      // If no difficulties are selected, enable all
      setDifficultySelection({ easy: true, medium: true, hard: true })
      return latexExpressions[Math.floor(Math.random() * latexExpressions.length)]
    }
    let nextExpression
    do {
      nextExpression = availableExpressions[Math.floor(Math.random() * availableExpressions.length)]
    } while (nextExpression.latex === currentExpression?.latex)
    return nextExpression
  }, [currentExpression, getAvailableExpressions])

  const startGame = useCallback((mode: GameMode) => {
    setGameMode(mode)
    const firstExpression = getNextExpression()
    setCurrentExpression(firstExpression)
    setUserInput('')
    setPreviousInput('')
    setTimeLeft(mode === 'zen' ? 0 : parseInt(mode))
    setIsGameActive(true)
    setTimerStarted(false)
    setScore({expressionsCompleted: 0, skipped: 0, points: 0 })
    setIsCorrect(false)
    lastTarget.current = ''
  }, [getNextExpression])

  // Load initial expression on mount
  useEffect(() => {
    if (!currentExpression) {
      const availableExpressions = latexExpressions.filter(expr =>
        (difficultySelection.easy && expr.difficulty === 'easy') ||
        (difficultySelection.medium && expr.difficulty === 'medium') ||
        (difficultySelection.hard && expr.difficulty === 'hard')
      )
      const initialExpression = availableExpressions.length > 0
        ? availableExpressions[Math.floor(Math.random() * availableExpressions.length)]
        : latexExpressions[Math.floor(Math.random() * latexExpressions.length)]
      setCurrentExpression(initialExpression)
      setIsGameActive(true)
    }
  }, [])

  // Update expression when difficulty selection changes
  useEffect(() => {
    if (currentExpression && !timerStarted) {
      // Only update if timer hasn't started yet (user hasn't begun typing)
      const availableExpressions = latexExpressions.filter(expr =>
        (difficultySelection.easy && expr.difficulty === 'easy') ||
        (difficultySelection.medium && expr.difficulty === 'medium') ||
        (difficultySelection.hard && expr.difficulty === 'hard')
      )
      if (availableExpressions.length > 0) {
        const newExpression = availableExpressions[Math.floor(Math.random() * availableExpressions.length)]
        setCurrentExpression(newExpression)
      }
    }
  }, [difficultySelection])

  const skipQuestion = useCallback(() => {
    const nextExpression = getNextExpression()
    setCurrentExpression(nextExpression)
    setUserInput('')
    setPreviousInput('')
    setIsCorrect(false)
    setScore(prevScore => ({
      ...prevScore,
      skipped: prevScore.skipped + 1
    }))
  }, [getNextExpression])

  const loadNextProblem = useCallback(() => {
    const nextExpression = getNextExpression()
    setCurrentExpression(nextExpression)
    setUserInput('')
    setPreviousInput('')
    setIsCorrect(false)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
  }, [getNextExpression])

  const validateProblem = useCallback(async () => {
    if (!currentExpression) return
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
        
        const expressionPoints = calculateExpressionPoints(currentExpression)
        
        setScore(prevScore => ({
          ...prevScore,
          expressionsCompleted: prevScore.expressionsCompleted + 1,
          points: prevScore.points + expressionPoints
        }))
        
        setTimeout(() => {
          loadNextProblem()
        }, 800)
      }
    } catch (error) {
      console.error('Validation error:', error)
    }
  }, [userInput, previousInput, isCorrect, currentExpression, loadNextProblem, calculateExpressionPoints])

  const debouncedValidation = useCallback(
    debounce(() => {
      if (isGameActive && !isCorrect) {
        validateProblem()
      }
    }, 150),
    [isGameActive, isCorrect, validateProblem]
  )

  useEffect(() => {
    debouncedValidation()
    return () => debouncedValidation.cancel()
  }, [userInput, debouncedValidation])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isGameActive && timerStarted && gameMode !== 'zen' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1)
      }, 1000)
    } else if (gameMode !== 'zen' && timeLeft === 0 && isGameActive && timerStarted) {
      setIsGameActive(false)
      calculateScore()
    }
    return () => clearInterval(timer)
  }, [isGameActive, timerStarted, timeLeft, gameMode])

  const calculateScore = () => {
    if (!currentExpression) return
    const totalCharacters = score.expressionsCompleted * currentExpression.latex.length
    const minutes = parseInt(gameMode) / 60
    const wpm = Math.round((totalCharacters / 5) / minutes)
    const accuracy = Math.round((totalCharacters / (totalCharacters + userInput.length)) * 100)
    setScore(prevScore => ({ ...prevScore, wpm, accuracy }))
  }

  const endGame = useCallback(() => {
    setIsGameActive(false)
    calculateScore()
  }, [])

  const handleUserInput = useCallback((value: string) => {
    // Check if user typed a $ sign
    if (value.includes('$')) {
      toast.info("You don't need to type $ - you're already in math mode!", {
        duration: 2000,
      })
      // Remove all $ signs from the input
      value = value.replace(/\$/g, '')
    }

    // Start timer on first keystroke
    if (!timerStarted && value.length > 0 && gameMode !== 'zen') {
      setTimerStarted(true)
    }
    setUserInput(value)
  }, [timerStarted, gameMode])

  return {
    currentExpression,
    userInput,
    setUserInput: handleUserInput,
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
  }
}

