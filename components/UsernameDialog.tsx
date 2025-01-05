import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { GameScore } from '@/types/game'

interface UsernameDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (username: string) => void
  score: GameScore
  gameMode: '60' | '120'
  isSubmitting: boolean
}

export function UsernameDialog({ isOpen, onClose, onSubmit, score, gameMode, isSubmitting }: UsernameDialogProps) {
  const [username, setUsername] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return
    
    await onSubmit(username.trim())
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Submit Your Score</DialogTitle>
          <DialogDescription>
            Enter your username to add your score to the leaderboard!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Your Score</h4>
            <div className="text-sm space-y-1">
              <p>Points: {score.points}</p>
              <p>Expressions completed: {score.expressionsCompleted}</p>
              <p>Mode: {gameMode} seconds</p>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              Username
            </label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              maxLength={20}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!username.trim() || isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Score'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

