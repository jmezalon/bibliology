import {
  ArrowLeft,
  Plus,
  Edit,
  Settings,
  Users,
  BookOpen,
  BarChart3,
  FileText,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { Container } from '../../components/layout/container';
import { EmptyState } from '../../components/teacher/empty-state';
import { LessonCard } from '../../components/teacher/lesson-card';
import { StatCard } from '../../components/teacher/stat-card';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { coursesApi, lessonsApi } from '../../lib/api';
import type { Course, Lesson } from '../../types/course';

export function TeacherCourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [draggedLesson, setDraggedLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch course and lessons on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!courseId) return;

      try {
        setIsLoading(true);
        const [courseData, lessonsData] = await Promise.all([
          coursesApi.getById(courseId),
          lessonsApi.getAllForCourse(courseId, 1, 100),
        ]);
        setCourse(courseData);
        setLessons(lessonsData.data);
      } catch (error) {
        console.error('Failed to fetch course data:', error);
        // Course not found or error - will show error state
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [courseId]);

  // Display course for UI rendering
  const displayCourse =
    course ||
    ({
      title_en: 'Course Title',
      description_en: 'Course description',
      is_published: false,
    } as Course);

  const stats = {
    totalStudents: 0,
    totalLessons: lessons.length,
    completionRate: 0,
    averageRating: 0,
  };

  const handleAddLesson = async () => {
    if (!courseId) return;

    // Prompt for lesson title
    const title = prompt('Enter lesson title:');
    if (!title) return;

    try {
      const lesson = await lessonsApi.create({
        course_id: courseId,
        title_en: title,
        description_en: 'Add a description for this lesson',
        duration_minutes: 30,
      });

      // Navigate to the lesson builder
      navigate(`/teacher/courses/${courseId}/lessons/${lesson.id}/edit`);
    } catch (error) {
      console.error('Failed to create lesson:', error);
      alert('Failed to create lesson. Please try again.');
    }
  };

  const handleEditLesson = (lesson: Lesson) => {
    navigate(`/teacher/courses/${courseId}/lessons/${lesson.id}/edit`);
  };

  const handleDeleteLesson = async (lesson: Lesson) => {
    if (window.confirm(`Are you sure you want to delete "${lesson.title_en}"?`)) {
      try {
        await lessonsApi.delete(lesson.id);
        // Remove from local state
        setLessons((prev) => prev.filter((l) => l.id !== lesson.id));
      } catch (error) {
        console.error('Failed to delete lesson:', error);
        alert('Failed to delete lesson. Please try again.');
      }
    }
  };

  const handleViewLesson = (lesson: Lesson) => {
    navigate(`/teacher/courses/${courseId}/lessons/${lesson.id}`);
  };

  const handleTogglePublish = (lesson: Lesson) => {
    console.log('Toggle publish:', lesson.id, !lesson.is_published);
  };

  const handleDragStart = (lesson: Lesson) => {
    setDraggedLesson(lesson);
  };

  const handleDragEnd = () => {
    setDraggedLesson(null);
  };

  const handleDrop = (targetLesson: Lesson) => {
    if (draggedLesson && draggedLesson.id !== targetLesson.id) {
      // Reorder lessons
      console.log('Reorder:', draggedLesson.order, 'to', targetLesson.order);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center">
        <p className="text-muted-foreground">Loading course...</p>
      </div>
    );
  }

  if (!course && courseId) {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center">
        <EmptyState
          icon={BookOpen}
          title="Course not found"
          description="The course you're looking for doesn't exist or you don't have access to it"
          action={{
            label: 'Back to Courses',
            onClick: () => navigate('/teacher/courses'),
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Page Header */}
      <div className="bg-background border-b">
        <Container size="wide" className="py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/teacher/courses')}
                aria-label="Back to courses"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="heading-lg truncate">{displayCourse.title_en}</h1>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      displayCourse.is_published
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {displayCourse.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="text-muted-foreground">{displayCourse.description_en}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/teacher/courses/${courseId}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </Container>
      </div>

      <Container size="wide" className="py-8">
        <div className="space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Students Enrolled"
              value={stats.totalStudents}
              icon={Users}
              description="Active learners"
            />
            <StatCard
              title="Total Lessons"
              value={stats.totalLessons}
              icon={FileText}
              description="Content modules"
            />
            <StatCard
              title="Completion Rate"
              value={`${stats.completionRate}%`}
              icon={BarChart3}
              description="Student completion"
            />
            <StatCard
              title="Average Rating"
              value={stats.averageRating.toFixed(1)}
              icon={BookOpen}
              description="Out of 5.0"
            />
          </div>

          {/* Lessons Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Course Lessons</CardTitle>
                <CardDescription>Drag and drop to reorder lessons</CardDescription>
              </div>
              <Button onClick={() => void handleAddLesson()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Lesson
              </Button>
            </CardHeader>
            <CardContent>
              {lessons.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No lessons yet"
                  description="Create your first lesson to start building your course content"
                  action={{
                    label: 'Create First Lesson',
                    onClick: () => void handleAddLesson(),
                  }}
                />
              ) : (
                <div className="space-y-3" role="list">
                  {lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      draggable
                      onDragStart={() => handleDragStart(lesson)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(lesson)}
                      role="listitem"
                    >
                      <LessonCard
                        lesson={lesson}
                        isDragging={draggedLesson?.id === lesson.id}
                        onEdit={handleEditLesson}
                        onDelete={(lesson) => void handleDeleteLesson(lesson)}
                        onView={handleViewLesson}
                        onTogglePublish={handleTogglePublish}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
}
