import { useState } from 'react';

import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

interface CreateLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { title: string; description: string; duration: number }) => void;
  isSubmitting?: boolean;
}

export function CreateLessonDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: CreateLessonDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(30);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || 'Add a description for this lesson',
      duration,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setDuration(30);
  };

  const handleCancel = () => {
    setTitle('');
    setDescription('');
    setDuration(30);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Lesson</DialogTitle>
            <DialogDescription>
              Add a new lesson to your course. You can edit the details later in the lesson builder.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Lesson Title */}
            <div className="space-y-2">
              <Label htmlFor="lesson-title">
                Lesson Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lesson-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Introduction to Greek Alphabet"
                autoFocus
                required
              />
            </div>

            {/* Lesson Description */}
            <div className="space-y-2">
              <Label htmlFor="lesson-description">Description (Optional)</Label>
              <Textarea
                id="lesson-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what students will learn..."
                rows={3}
              />
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="lesson-duration">Estimated Duration (minutes)</Label>
              <Input
                id="lesson-duration"
                type="number"
                min="1"
                max="300"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Lesson'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
