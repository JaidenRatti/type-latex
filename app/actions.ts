'use server'

import { supabase } from '@/lib/supabase'
import { LeaderboardEntry } from '@/types/game'
import { revalidatePath } from 'next/cache'

export async function submitScore(score: Omit<LeaderboardEntry, "id" | "created_at">) {
  try {
    console.log('Submitting score:', score)

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

    console.log('Score submitted successfully:', data)

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
      .limit(100)

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

