export interface LeaderboardEntry {
    id: string
    username: string
    points: number
    expressions_completed: number
    mode: '60' | '120'
    created_at: string
  }
  
  export interface GameScore {
    expressionsCompleted: number
    skipped: number
    points: number
  }
  
  export type Difficulty = 'easy' | 'medium' | 'hard'
  
  export interface LatexExpression {
    latex: string
    difficulty: Difficulty
  }
  
  export type GameMode = '60' | '120' | 'zen'
  
  export interface DifficultySelection {
    easy: boolean
    medium: boolean
    hard: boolean
  }
  
  