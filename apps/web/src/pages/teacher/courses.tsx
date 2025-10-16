import { Plus, Search, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Container } from '../../components/layout/container';
import { CourseCard } from '../../components/teacher/course-card';
import { EmptyState } from '../../components/teacher/empty-state';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import type { Course } from '../../types/course';

export function TeacherCoursesPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'published' | 'draft'>('all');

  // Mock data - replace with actual API call
  const courses: Course[] = [];

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description_en.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'published' && course.is_published) ||
      (selectedStatus === 'draft' && !course.is_published);

    return matchesSearch && matchesStatus;
  });

  const handleCreateCourse = () => {
    navigate('/teacher/courses/new');
  };

  const handleEditCourse = (course: Course) => {
    navigate(`/teacher/courses/${course.id}/edit`);
  };

  const handleDeleteCourse = (course: Course) => {
    // Show confirmation dialog
    if (window.confirm(`Are you sure you want to delete "${course.title_en}"?`)) {
      // Call API to delete course
      console.log('Delete course:', course.id);
    }
  };

  const handleViewCourse = (course: Course) => {
    navigate(`/teacher/courses/${course.id}`);
  };

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Page Header */}
      <div className="bg-background border-b">
        <Container size="wide" className="py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="heading-lg">My Courses</h1>
              <p className="text-muted-foreground mt-1">
                Manage and organize your teaching content
              </p>
            </div>
            <Button onClick={handleCreateCourse}>
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          </div>
        </Container>
      </div>

      <Container size="wide" className="py-8">
        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              aria-label="Search courses"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <Button
              variant={selectedStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('all')}
              aria-pressed={selectedStatus === 'all'}
            >
              All
            </Button>
            <Button
              variant={selectedStatus === 'published' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('published')}
              aria-pressed={selectedStatus === 'published'}
            >
              Published
            </Button>
            <Button
              variant={selectedStatus === 'draft' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('draft')}
              aria-pressed={selectedStatus === 'draft'}
            >
              Drafts
            </Button>
          </div>
        </div>

        {/* Course Grid */}
        {filteredCourses.length === 0 ? (
          courses.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No courses yet"
              description="Start creating courses to share your knowledge with students"
              action={{
                label: 'Create Your First Course',
                onClick: handleCreateCourse,
              }}
            />
          ) : (
            <EmptyState
              icon={Search}
              title="No courses found"
              description="Try adjusting your search or filters"
            />
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onEdit={handleEditCourse}
                onDelete={handleDeleteCourse}
                onView={handleViewCourse}
              />
            ))}
          </div>
        )}

        {/* Results Count */}
        {filteredCourses.length > 0 && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Showing {filteredCourses.length} of {courses.length} courses
          </div>
        )}
      </Container>
    </div>
  );
}
