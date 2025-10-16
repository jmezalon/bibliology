import { ArrowLeft, Save, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Container } from '../../components/layout/container';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { coursesApi } from '../../lib/api';
import type { CreateCourseRequest } from '../../types/course';

export function CourseCreatePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateCourseRequest>({
    slug: '',
    title_en: '',
    title_fr: '',
    description_en: '',
    description_fr: '',
    difficulty: 'Beginner',
    category: '',
    thumbnail_url: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreateCourseRequest, string>>>({});

  // Generate slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateCourseRequest, string>> = {};

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug)) {
      newErrors.slug = 'Slug must be lowercase alphanumeric with hyphens only';
    }

    if (!formData.title_en.trim()) {
      newErrors.title_en = 'English title is required';
    }

    if (!formData.description_en.trim()) {
      newErrors.description_en = 'English description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const course = await coursesApi.create(formData);

      // Navigate to the created course detail page
      navigate(`/teacher/courses/${course.id}`);
    } catch (error) {
      console.error('Failed to create course:', error);
      // TODO: Show error toast notification
      alert('Failed to create course. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof CreateCourseRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Auto-generate slug when title changes
    if (field === 'title_en') {
      const newSlug = generateSlug(value);
      setFormData((prev) => ({ ...prev, slug: newSlug }));
    }

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Page Header */}
      <div className="bg-background border-b">
        <Container size="wide" className="py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/teacher/courses')}
              aria-label="Back to courses"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="heading-lg">Create New Course</h1>
              <p className="text-muted-foreground mt-1">
                Fill in the details to create a new course
              </p>
            </div>
          </div>
        </Container>
      </div>

      <Container size="default" className="py-8">
        <form onSubmit={(e) => void handleSubmit(e)}>
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
              <CardDescription>Provide the basic information about your course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">
                  Course Slug <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleChange('slug', e.target.value)}
                    placeholder="e.g., introduction-to-biblical-greek"
                    aria-invalid={!!errors.slug}
                    aria-describedby={errors.slug ? 'slug-error' : undefined}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleChange('slug', generateSlug(formData.title_en))}
                    title="Regenerate slug from title"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                {errors.slug && (
                  <p id="slug-error" className="text-sm text-destructive">
                    {errors.slug}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  URL-friendly identifier (auto-generated from title, lowercase alphanumeric with
                  hyphens)
                </p>
              </div>

              {/* English Title */}
              <div className="space-y-2">
                <Label htmlFor="title_en">
                  Course Title (English) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title_en"
                  value={formData.title_en}
                  onChange={(e) => handleChange('title_en', e.target.value)}
                  placeholder="e.g., Introduction to Biblical Greek"
                  aria-invalid={!!errors.title_en}
                  aria-describedby={errors.title_en ? 'title_en-error' : undefined}
                />
                {errors.title_en && (
                  <p id="title_en-error" className="text-sm text-destructive">
                    {errors.title_en}
                  </p>
                )}
              </div>

              {/* French Title */}
              <div className="space-y-2">
                <Label htmlFor="title_fr">Course Title (French)</Label>
                <Input
                  id="title_fr"
                  value={formData.title_fr}
                  onChange={(e) => handleChange('title_fr', e.target.value)}
                  placeholder="e.g., Introduction au grec biblique"
                />
              </div>

              {/* English Description */}
              <div className="space-y-2">
                <Label htmlFor="description_en">
                  Description (English) <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description_en"
                  value={formData.description_en}
                  onChange={(e) => handleChange('description_en', e.target.value)}
                  placeholder="Describe what students will learn in this course..."
                  rows={4}
                  aria-invalid={!!errors.description_en}
                  aria-describedby={errors.description_en ? 'description_en-error' : undefined}
                />
                {errors.description_en && (
                  <p id="description_en-error" className="text-sm text-destructive">
                    {errors.description_en}
                  </p>
                )}
              </div>

              {/* French Description */}
              <div className="space-y-2">
                <Label htmlFor="description_fr">Description (French)</Label>
                <Textarea
                  id="description_fr"
                  value={formData.description_fr}
                  onChange={(e) => handleChange('description_fr', e.target.value)}
                  placeholder="Décrivez ce que les étudiants apprendront dans ce cours..."
                  rows={4}
                />
              </div>

              {/* Course Difficulty */}
              <div className="space-y-2">
                <Label htmlFor="difficulty">Course Difficulty</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) => handleChange('difficulty', value)}
                >
                  <SelectTrigger id="difficulty">
                    <SelectValue placeholder="Select course difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  placeholder="e.g., Biblical Languages, Theology, Church History"
                />
              </div>

              {/* Thumbnail URL */}
              <div className="space-y-2">
                <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
                <Input
                  id="thumbnail_url"
                  value={formData.thumbnail_url}
                  onChange={(e) => handleChange('thumbnail_url', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  type="url"
                />
                <p className="text-sm text-muted-foreground">
                  Optional: Provide a URL to an image for the course thumbnail
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/teacher/courses')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Creating...' : 'Create Course'}
            </Button>
          </div>
        </form>
      </Container>
    </div>
  );
}
