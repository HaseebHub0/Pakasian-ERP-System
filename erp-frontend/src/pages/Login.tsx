import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { FormField } from '@/components/ui/Forms';
import { LoadingSpinner } from '@/components/ui/Forms';
import toast from 'react-hot-toast';
import { authAPI } from '@/api/auth';

const loginSchema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = React.useState(false);

  const methods = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login({ 
        username: data.email, 
        password: data.password 
      });
      
      const backendUser = response.user;
      const mappedUser = {
        id: backendUser.id,
        email: backendUser.email || backendUser.username,
        username: backendUser.username,
        name: backendUser.username,
        role: backendUser.role_name?.toLowerCase() || null,
        permissions: backendUser.permissions || [],
      };
      
      setAuth(mappedUser, response.access_token, response.refresh_token);
      toast.success(`Logged in as ${mappedUser.name}`);
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Login failed Check your credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 text-center bg-light-blue/30 border-b">
          <h1 className="text-2xl font-bold text-primary">Pakistani Foods</h1>
          <p className="text-gray-500 mt-1">Enterprise Resource Planning</p>
        </div>
        
        <div className="p-8">
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                name="email"
                label="Username or Email"
                type="text"
                placeholder="admin"
                required
              />
              <FormField
                name="password"
                label="Password"
                type="password"
                placeholder="••••••••"
                required
              />
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn btn-primary py-3 flex items-center justify-center gap-2"
              >
                {isLoading ? <LoadingSpinner size={20} className="text-white" /> : 'Sign In'}
              </button>
            </form>
          </FormProvider>
          
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              © 2026 Pakistani Foods ERP. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
