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
    isUserSubmitted?: boolean
    expressionName?: string
    submittedBy?: string
  }
  
  export type GameMode = '60' | '120' | 'zen'
  
  export interface DifficultySelection {
    easy: boolean
    medium: boolean
    hard: boolean
  }

  // Multiplayer types
  export interface GameRoom {
    id: string
    room_code: string
    status: 'waiting' | 'active' | 'finished'
    mode: '60' | '120'
    expressions: LatexExpression[]
    created_at: string
    started_at?: string
    finished_at?: string
  }

  export interface GameParticipant {
    id: string
    room_id: string
    player_id: string
    username: string
    score: number
    expressions_completed: number
    current_expression_index: number
    is_ready: boolean
    finished_at?: string
    created_at: string
  }

  export interface GameProgress {
    id: string
    room_id: string
    player_id: string
    expression_index: number
    user_input: string
    is_correct: boolean
    completed_at?: string
    created_at: string
  }

  export interface MultiplayerGameState {
    room: GameRoom | null
    participants: GameParticipant[]
    myParticipant: GameParticipant | null
    opponent: GameParticipant | null
    currentExpressionIndex: number
    gameStarted: boolean
    gameFinished: boolean
    winner: GameParticipant | null
  }
  
  