import type { Slide, LessonWithSlides, TransitionType } from '../../types/lesson-builder';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';

interface PropertiesPanelProps {
  lesson: LessonWithSlides | null;
  currentSlide: Slide | null;
  onLessonUpdate: (data: Partial<LessonWithSlides>) => void;
  onSlideUpdate: (data: Partial<Slide>) => void;
}

const TRANSITIONS = [
  { value: 'NONE', label: 'None' },
  { value: 'FADE', label: 'Fade' },
  { value: 'SLIDE', label: 'Slide' },
  { value: 'ZOOM', label: 'Zoom' },
];

export function PropertiesPanel({
  lesson,
  currentSlide,
  onLessonUpdate,
  onSlideUpdate,
}: PropertiesPanelProps) {
  if (!lesson) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">No lesson loaded</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800">
      <Tabs defaultValue="slide" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="slide">Slide</TabsTrigger>
          <TabsTrigger value="lesson">Lesson</TabsTrigger>
        </TabsList>

        {/* Slide Settings Tab */}
        <TabsContent value="slide" className="p-4 space-y-4">
          {currentSlide ? (
            <Accordion type="multiple" defaultValue={['title', 'notes', 'timing']}>
              {/* Slide Title */}
              <AccordionItem value="title">
                <AccordionTrigger>Title</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="slide-title-en">Title (English)</Label>
                      <Input
                        id="slide-title-en"
                        value={currentSlide.title_en || ''}
                        onChange={(e) => onSlideUpdate({ title_en: e.target.value })}
                        placeholder="Enter slide title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slide-title-fr">Title (French)</Label>
                      <Input
                        id="slide-title-fr"
                        value={currentSlide.title_fr || ''}
                        onChange={(e) => onSlideUpdate({ title_fr: e.target.value })}
                        placeholder="Entrez le titre"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Teacher Notes */}
              <AccordionItem value="notes">
                <AccordionTrigger>Teacher Notes</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="notes-en">Notes (English)</Label>
                      <Textarea
                        id="notes-en"
                        value={currentSlide.teacher_notes_en || ''}
                        onChange={(e) => onSlideUpdate({ teacher_notes_en: e.target.value })}
                        placeholder="Private notes for this slide"
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes-fr">Notes (French)</Label>
                      <Textarea
                        id="notes-fr"
                        value={currentSlide.teacher_notes_fr || ''}
                        onChange={(e) => onSlideUpdate({ teacher_notes_fr: e.target.value })}
                        placeholder="Notes privées"
                        rows={4}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Timing & Transition */}
              <AccordionItem value="timing">
                <AccordionTrigger>Timing & Transition</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="estimated-time">Estimated Time (seconds)</Label>
                      <Input
                        id="estimated-time"
                        type="number"
                        min="0"
                        step="30"
                        value={currentSlide.estimated_time_seconds || 0}
                        onChange={(e) =>
                          onSlideUpdate({
                            estimated_time_seconds: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Approximately {Math.ceil((currentSlide.estimated_time_seconds || 0) / 60)}{' '}
                        minute
                        {Math.ceil((currentSlide.estimated_time_seconds || 0) / 60) !== 1
                          ? 's'
                          : ''}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="transition">Transition Effect</Label>
                      <select
                        id="transition"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={currentSlide.transition}
                        onChange={(e) =>
                          onSlideUpdate({
                            transition: e.target.value as TransitionType,
                          })
                        }
                      >
                        {TRANSITIONS.map((transition) => (
                          <option key={transition.value} value={transition.value}>
                            {transition.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select a slide to view its properties
              </p>
            </div>
          )}
        </TabsContent>

        {/* Lesson Settings Tab */}
        <TabsContent value="lesson" className="p-4 space-y-4">
          <Accordion type="multiple" defaultValue={['info', 'settings']}>
            {/* Lesson Information */}
            <AccordionItem value="info">
              <AccordionTrigger>Lesson Information</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="lesson-title-en">Title (English)</Label>
                    <Input
                      id="lesson-title-en"
                      value={lesson.title_en}
                      onChange={(e) => onLessonUpdate({ title_en: e.target.value })}
                      placeholder="Lesson title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lesson-title-fr">Title (French)</Label>
                    <Input
                      id="lesson-title-fr"
                      value={lesson.title_fr || ''}
                      onChange={(e) => onLessonUpdate({ title_fr: e.target.value })}
                      placeholder="Titre de la leçon"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lesson-desc-en">Description (English)</Label>
                    <Textarea
                      id="lesson-desc-en"
                      value={lesson.description_en}
                      onChange={(e) => onLessonUpdate({ description_en: e.target.value })}
                      placeholder="Brief lesson description"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lesson-desc-fr">Description (French)</Label>
                    <Textarea
                      id="lesson-desc-fr"
                      value={lesson.description_fr || ''}
                      onChange={(e) => onLessonUpdate({ description_fr: e.target.value })}
                      placeholder="Brève description"
                      rows={3}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Lesson Settings */}
            <AccordionItem value="settings">
              <AccordionTrigger>Settings</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="lesson-duration">Duration (minutes)</Label>
                    <Input
                      id="lesson-duration"
                      type="number"
                      min="1"
                      value={lesson.duration_minutes}
                      onChange={(e) =>
                        onLessonUpdate({
                          duration_minutes: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lesson-order">Lesson Order</Label>
                    <Input
                      id="lesson-order"
                      type="number"
                      min="0"
                      value={lesson.order}
                      onChange={(e) =>
                        onLessonUpdate({
                          order: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lesson-status">Status</Label>
                    <select
                      id="lesson-status"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={lesson.is_published ? 'published' : 'draft'}
                      onChange={(e) =>
                        onLessonUpdate({
                          is_published: e.target.value === 'published',
                        })
                      }
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>

                  {lesson.is_published && (
                    <div className="rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        This lesson is published and visible to students
                      </p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Lesson Stats */}
            <AccordionItem value="stats">
              <AccordionTrigger>Statistics</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Slides:</span>
                    <span className="font-semibold">{lesson.slides.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Content Blocks:</span>
                    <span className="font-semibold">
                      {lesson.slides.reduce((acc, slide) => acc + slide.content_blocks.length, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Created:</span>
                    <span className="font-semibold">
                      {new Date(lesson.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Last Updated:</span>
                    <span className="font-semibold">
                      {new Date(lesson.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>
      </Tabs>
    </div>
  );
}
