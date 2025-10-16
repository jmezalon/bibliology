import { BookOpen, Users, TrendingUp, Clock, FileText, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Container } from '../../components/layout/container';
import { EmptyState } from '../../components/teacher/empty-state';
import { StatCard } from '../../components/teacher/stat-card';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { useAuthStore } from '../../store/auth.store';

export function TeacherDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Mock data - replace with actual API calls
  const stats = {
    totalCourses: 0,
    totalStudents: 0,
    totalLessons: 0,
    hoursContent: 0,
  };

  const recentActivity: Array<{ id: string; message: string }> = [
    // Empty for now - will be populated from API
  ];

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Page Header */}
      <div className="bg-background border-b">
        <Container size="wide" className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="heading-lg">Welcome back, {user?.name?.split(' ')[0]}!</h1>
              <p className="text-muted-foreground mt-1">
                Manage your courses and track student progress
              </p>
            </div>
            <Button onClick={() => navigate('/teacher/courses/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          </div>
        </Container>
      </div>

      <Container size="wide" className="py-8">
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Courses"
              value={stats.totalCourses}
              description="Active courses"
              icon={BookOpen}
              trend={{
                value: 12,
                label: 'from last month',
                direction: 'up',
              }}
            />

            <StatCard
              title="Total Students"
              value={stats.totalStudents}
              description="Across all courses"
              icon={Users}
              trend={{
                value: 8,
                label: 'from last month',
                direction: 'up',
              }}
            />

            <StatCard
              title="Total Lessons"
              value={stats.totalLessons}
              description="Content created"
              icon={FileText}
            />

            <StatCard
              title="Content Hours"
              value={stats.hoursContent}
              description="Total learning time"
              icon={Clock}
            />
          </div>

          {/* Recent Activity & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates from your courses</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <EmptyState
                    icon={TrendingUp}
                    title="No recent activity"
                    description="Your recent course activities will appear here"
                  />
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((item) => (
                      <div key={item.id} className="border-b last:border-0 pb-4 last:pb-0">
                        {/* Activity items will go here */}
                        <p>{item.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/teacher/courses/new')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Course
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/teacher/courses')}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  View All Courses
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/teacher/students')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  View Students
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/teacher/analytics')}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* My Courses Preview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My Courses</CardTitle>
                <CardDescription>Your most recent courses</CardDescription>
              </div>
              <Button variant="ghost" onClick={() => navigate('/teacher/courses')}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={BookOpen}
                title="No courses yet"
                description="Create your first course to start teaching"
                action={{
                  label: 'Create Course',
                  onClick: () => navigate('/teacher/courses/new'),
                }}
              />
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
}
