'use server'

import { supabase } from '@/lib/supabase'
import { LeaderboardEntry, GameRoom, GameParticipant, LatexExpression } from '@/types/game'
import { revalidatePath } from 'next/cache'
import { latexExpressions } from '@/data/expressions'

export async function submitScore(score: Omit<LeaderboardEntry, "id" | "created_at">) {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .insert([{
        username: score.username,
        points: score.points,
        expressions_completed: score.expressions_completed,
        mode: score.mode
      }])
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/')
    return { success: true, data }
  } catch (error) {
    console.error('Error submitting score:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}

export async function getLeaderboard(mode: '60' | '120') {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('mode', mode)
      .order('points', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      throw new Error(error.message)
    }
    
    return data.map(entry => ({
      ...entry,
      expressionsCompleted: entry.expressions_completed
    })) as LeaderboardEntry[]
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    throw error
  }
}

// Multiplayer actions
export async function createGameRoom(mode: '60' | '120', difficultySelection: { easy: boolean, medium: boolean, hard: boolean }) {
  try {
    // Determine expression count based on mode
    const expressionCount = mode === '60' ? 5 : 10 // Quick race: 5, Long race: 10
    
    // Select random expressions based on difficulty
    const availableExpressions = latexExpressions.filter(expr => 
      (difficultySelection.easy && expr.difficulty === 'easy') ||
      (difficultySelection.medium && expr.difficulty === 'medium') ||
      (difficultySelection.hard && expr.difficulty === 'hard')
    )
    
    if (availableExpressions.length === 0) {
      return { success: false, error: 'No expressions available for selected difficulties' }
    }

    // Shuffle and take the appropriate number of expressions
    const shuffled = [...availableExpressions].sort(() => Math.random() - 0.5)
    const gameExpressions = shuffled.slice(0, expressionCount)

    // Generate a shorter, more user-friendly room ID
    const generateShortId = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed confusing chars like I, L, O, 0, 1
      let result = ''
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    let roomCode = generateShortId()
    
    // Ensure room code is unique (very unlikely collision with 6 chars from 32-char set)
    const { data: existingRoom } = await supabase
      .from('game_rooms')
      .select('room_code')
      .eq('room_code', roomCode)
      .single()
    
    if (existingRoom) {
      roomCode = generateShortId() // Try once more
    }

    const { data: room, error } = await supabase
      .from('game_rooms')
      .insert([{
        room_code: roomCode,
        mode,
        expressions: gameExpressions
      }])
      .select()
      .single()

    if (error) {
      console.error('Supabase error creating game room:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return { success: false, error: `Database error: ${error.message}${error.hint ? ` (${error.hint})` : ''}` }
    }

    return { success: true, data: room }
  } catch (error) {
    console.error('Error creating game room:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}

export async function joinGameRoom(roomCode: string, playerId: string, username: string) {
  try {
    // Check if room exists and is joinable
    const { data: room, error: roomError } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('room_code', roomCode)
      .eq('status', 'waiting')
      .single()

    if (roomError) {
      console.error('Error fetching room:', roomError)
      console.error('Room error details:', {
        message: roomError.message,
        details: roomError.details,
        hint: roomError.hint,
        code: roomError.code
      })
      return { success: false, error: `Database error: ${roomError.message}${roomError.hint ? ` (${roomError.hint})` : ''}` }
    }

    if (!room) {
      return { success: false, error: 'Room not found or not available' }
    }

    // Check current participants
    const { data: participants, error: participantsError } = await supabase
      .from('game_participants')
      .select('*')
      .eq('room_id', room.id)

    if (participantsError) {
      console.error('Error fetching participants:', participantsError)
      return { success: false, error: `Database error: ${participantsError.message}${participantsError.hint ? ` (${participantsError.hint})` : ''}` }
    }

    if (participants.length >= 2) {
      return { success: false, error: 'Cannot join - room is full (2/2 players)' }
    }

    // Add participant
    const { data: participant, error: participantError } = await supabase
      .from('game_participants')
      .insert([{
        room_id: room.id,
        player_id: playerId,
        username: username
      }])
      .select()
      .single()

    if (participantError) {
      console.error('Error adding participant:', participantError)
      console.error('Participant error details:', {
        message: participantError.message,
        details: participantError.details,
        hint: participantError.hint,
        code: participantError.code
      })
      return { success: false, error: `Database error: ${participantError.message}${participantError.hint ? ` (${participantError.hint})` : ''}` }
    }

    return { success: true, data: { room, participant } }
  } catch (error) {
    console.error('Error joining game room:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}

export async function setPlayerReady(roomId: string, playerId: string) {
  try {
    const { data, error } = await supabase
      .from('game_participants')
      .update({ is_ready: true })
      .eq('room_id', roomId)
      .eq('player_id', playerId)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // Check if both players are ready
    const { data: allParticipants, error: participantsError } = await supabase
      .from('game_participants')
      .select('*')
      .eq('room_id', roomId)

    if (participantsError) {
      return { success: false, error: participantsError.message }
    }

    if (allParticipants.length === 2 && allParticipants.every(p => p.is_ready)) {
      // Start the game
      const { error: updateError } = await supabase
        .from('game_rooms')
        .update({
          status: 'active',
          started_at: new Date().toISOString()
        })
        .eq('id', roomId)

      if (updateError) {
        console.error('Error starting game:', updateError)
      }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error setting player ready:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}

export async function updateGameProgress(roomId: string, playerId: string, expressionIndex: number, userInput: string, isCorrect: boolean) {
  try {
    // Insert progress record
    const { data: progress, error: progressError } = await supabase
      .from('game_progress')
      .insert([{
        room_id: roomId,
        player_id: playerId,
        expression_index: expressionIndex,
        user_input: userInput,
        is_correct: isCorrect,
        completed_at: isCorrect ? new Date().toISOString() : null
      }])
      .select()
      .single()

    if (progressError) {
      return { success: false, error: progressError.message }
    }

    if (isCorrect) {
      // Update participant progress
      const { data: participant, error: participantError } = await supabase
        .from('game_participants')
        .update({ 
          expressions_completed: expressionIndex + 1,
          current_expression_index: expressionIndex + 1
        })
        .eq('room_id', roomId)
        .eq('player_id', playerId)
        .select()
        .single()

      if (participantError) {
        return { success: false, error: participantError.message }
      }

      // Get the room to check total expressions
      const { data: roomData } = await supabase
        .from('game_rooms')
        .select('expressions')
        .eq('id', roomId)
        .single()

      const totalExpressions = roomData?.expressions?.length || 10

      // Check if game is complete
      if (expressionIndex + 1 >= totalExpressions) {
        // Mark participant as finished
        await supabase
          .from('game_participants')
          .update({ finished_at: new Date().toISOString() })
          .eq('room_id', roomId)
          .eq('player_id', playerId)

        // Check if this is the first to finish (winner)
        const { data: allParticipants } = await supabase
          .from('game_participants')
          .select('*')
          .eq('room_id', roomId)
          .order('finished_at', { ascending: true })

        const finishedParticipants = allParticipants?.filter(p => p.finished_at) || []
        
        if (finishedParticipants.length === 1) {
          // This player won! Mark room as finished
          await supabase
            .from('game_rooms')
            .update({ 
              status: 'finished',
              finished_at: new Date().toISOString()
            })
            .eq('id', roomId)
        }
      }
    }

    return { success: true, data: progress }
  } catch (error) {
    console.error('Error updating game progress:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}

export async function restartGame(roomId: string) {
  try {
    // Get the current room to preserve mode and difficulty settings
    const { data: room, error: roomError } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      return { success: false, error: 'Room not found' }
    }

    // Generate new expressions using the same mode and difficulty as before
    const expressionCount = room.mode === '60' ? 5 : 10
    
    // For simplicity, we'll use all difficulties if we can't determine original selection
    // In a more sophisticated implementation, you might store the original difficulty selection
    const availableExpressions = latexExpressions.filter(expr => 
      expr.difficulty === 'easy' || expr.difficulty === 'medium' || expr.difficulty === 'hard'
    )
    
    const shuffled = [...availableExpressions].sort(() => Math.random() - 0.5)
    const gameExpressions = shuffled.slice(0, expressionCount)

    // Update room with new expressions and reset status
    const { error: updateError } = await supabase
      .from('game_rooms')
      .update({
        status: 'waiting',
        expressions: gameExpressions,
        started_at: null,
        finished_at: null
      })
      .eq('id', roomId)

    if (updateError) {
      console.error('Error updating room:', updateError)
      return { success: false, error: updateError.message }
    }

    // Reset all participants to not ready and clear progress
    const { error: participantError } = await supabase
      .from('game_participants')
      .update({
        is_ready: false,
        expressions_completed: 0,
        score: 0,
        current_expression_index: 0,
        finished_at: null
      })
      .eq('room_id', roomId)

    if (participantError) {
      console.error('Error resetting participants:', participantError)
      return { success: false, error: participantError.message }
    }

    // Clear any existing progress records
    const { error: progressError } = await supabase
      .from('game_progress')
      .delete()
      .eq('room_id', roomId)

    if (progressError) {
      console.error('Error clearing progress:', progressError)
      return { success: false, error: progressError.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error restarting game:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}

