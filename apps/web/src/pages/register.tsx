import { BookOpen } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useToast } from '../hooks/use-toast';
import { useAuthStore } from '../store/auth.store';
import type { RegisterRequest } from '../types/auth';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuthStore();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterRequest & { confirmPassword: string }>();

  const password = watch('password');

  const onSubmit = async (data: RegisterRequest & { confirmPassword: string }) => {
    try {
      const { confirmPassword: _confirmPassword, ...registerData } = data;

      const newUser = await registerUser(registerData);

      toast({
        title: 'Account created!',
        description: 'Welcome to Bibliology. Your account has been created successfully.',
        variant: 'success',
      });

      // Redirect based on user role (future-proof for teacher registration)
      const redirectPath =
        newUser.role === 'TEACHER' || newUser.role === 'ADMIN'
          ? '/teacher/dashboard'
          : '/dashboard';

      navigate(redirectPath, { replace: true });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
            'Failed to create account. Please try again.'
          : 'Failed to create account. Please try again.';

      toast({
        title: 'Registration failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>Enter your details to get started with Bibliology</CardDescription>
        </CardHeader>

        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
          <CardContent className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              error={errors.name?.message}
              {...register('name', {
                required: 'Name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters',
                },
              })}
            />

            <Input
              label="Email"
              type="email"
              placeholder="your.email@example.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Create a strong password"
              helperText="Must be at least 8 characters"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
              })}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) => value === password || 'Passwords do not match',
              })}
            />
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" loading={isLoading}>
              Create Account
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>

            <p className="text-xs text-center text-muted-foreground">
              By creating an account, you agree to our{' '}
              <Link to="/terms" className="underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="underline">
                Privacy Policy
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
