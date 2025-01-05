import { useState } from 'react';
import { toast } from 'react-toastify';

interface LatexTyperacerProps {
  onGameEnd: () => void;
}


export function LatexTyperacer({ onGameEnd }: LatexTyperacerProps) {
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);

  const handleSubmitScore = async (score: number) => {
    try {
      const response = await fetch('/api/submit-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ score }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Score submitted successfully!')
        setShowUsernameDialog(false)
        onGameEnd()
      } else {
        toast.error(`Failed to submit score: ${result.error}`)
      }
    } catch (error) {
      toast.error('Failed to submit score')
      console.error('Error submitting score:', error);
    }
  };


}

