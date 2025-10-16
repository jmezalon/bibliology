import { BookOpen, GraduationCap, Globe, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Container } from '../components/layout/container';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-20 md:py-32">
        <Container>
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h1 className="heading-xl">Master Biblical Studies with Bilingual Learning</h1>
            <p className="text-xl text-muted-foreground">
              Study theology, biblical languages, and church history in both English and French
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/register">Get Started Free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/courses">Browse Courses</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <Container>
          <div className="text-center mb-12">
            <h2 className="heading-lg mb-4">Why Choose Bibliology?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A comprehensive platform designed for serious biblical study
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <BookOpen className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Structured Learning</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Follow carefully designed courses from foundational to advanced topics
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Globe className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Bilingual Content</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Study in English or French, with full content localization
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <GraduationCap className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Expert Teachers</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Learn from qualified theologians and biblical scholars
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Award className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Earn Certificates</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Receive certificates of completion to showcase your knowledge
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 py-20">
        <Container>
          <div className="text-center space-y-6 max-w-2xl mx-auto">
            <h2 className="heading-lg">Ready to Begin Your Journey?</h2>
            <p className="text-muted-foreground">
              Join thousands of students studying biblical theology online
            </p>
            <Button size="lg" asChild>
              <Link to="/register">Create Free Account</Link>
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
}
