import { useState, useEffect, useCallback, useRef } from 'react'
import { compareRenderedLatex } from '../utils/compareImages'
import debounce from 'lodash/debounce'
import { latexExpressions } from '../data/expressions'
import { GameMode, GameScore, DifficultySelection, LatexExpression } from '../types/game'

export function useLatexGame() {
  const [currentExpression, setCurrentExpression] = useState<LatexExpression | null>(null)
  const [userInput, setUserInput] = useState('')
  const [previousInput, setPreviousInput] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [isGameActive, setIsGameActive] = useState(false)
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
    setScore({expressionsCompleted: 0, skipped: 0, points: 0 })
    setIsCorrect(false)
    lastTarget.current = ''
  }, [getNextExpression])

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
    if (isGameActive && gameMode !== 'zen' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1)
      }, 1000)
    } else if (gameMode !== 'zen' && timeLeft === 0 && isGameActive) {
      setIsGameActive(false)
      calculateScore()
    }
    return () => clearInterval(timer)
  }, [isGameActive, timeLeft, gameMode])

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

  return {
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
  }
}

