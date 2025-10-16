import { ArrowLeft, Save } from 'lucide-react';
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
import { CourseLevel, type CreateCourseRequest } from '../../types/course';

export function CourseCreatePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateCourseRequest>({
    title_en: '',
    title_fr: '',
    description_en: '',
    description_fr: '',
    level: CourseLevel.BEGINNER,
    category: '',
    thumbnail_url: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreateCourseRequest, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateCourseRequest, string>> = {};

    if (!formData.title_en.trim()) {
      newErrors.title_en = 'English title is required';
    }

    if (!formData.description_en.trim()) {
      newErrors.description_en = 'English description is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // TODO: Call API to create course
    // When implemented, this will be async:
    // const response = await createCourse(formData);
    console.log('Creating course:', formData);

    // For now, simulate a successful creation
    setTimeout(() => {
      setIsSubmitting(false);
      // Navigate to the courses list
      navigate('/teacher/courses');
    }, 1000);
  };

  const handleChange = (
    field: keyof CreateCourseRequest,
    value: string | CourseLevel
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
              <CardDescription>
                Provide the basic information about your course
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                  aria-describedby={
                    errors.description_en ? 'description_en-error' : undefined
                  }
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

              {/* Course Level */}
              <div className="space-y-2">
                <Label htmlFor="level">
                  Course Level <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => handleChange('level', value as CourseLevel)}
                >
                  <SelectTrigger id="level">
                    <SelectValue placeholder="Select course level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CourseLevel.BEGINNER}>Beginner</SelectItem>
                    <SelectItem value={CourseLevel.INTERMEDIATE}>
                      Intermediate
                    </SelectItem>
                    <SelectItem value={CourseLevel.ADVANCED}>Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  placeholder="e.g., Biblical Languages, Theology, Church History"
                  aria-invalid={!!errors.category}
                  aria-describedby={errors.category ? 'category-error' : undefined}
                />
                {errors.category && (
                  <p id="category-error" className="text-sm text-destructive">
                    {errors.category}
                  </p>
                )}
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
