'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { EyeIcon, EyeSlashIcon, ShieldCheckIcon, SparklesIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      await login(email, password);
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-pink-400/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => {
          // Use deterministic values based on index to avoid hydration mismatch
          const left = (i * 17.3) % 100;
          const top = (i * 23.7) % 100;
          const delay = (i * 0.15) % 3;
          const duration = 2 + (i * 0.1) % 2;
          
          return (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`
              }}
            ></div>
          );
        })}
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Main Login Card */}
          <div className="glass-dark rounded-3xl p-8 shadow-2xl backdrop-blur-xl border border-white/10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-glow mb-4 float">
                <ShieldCheckIcon className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold gradient-text mb-2">
                MargWatch Admin Portal
              </h1>
              <p className="text-gray-300 text-sm">
                Secure access to your dashboard
              </p>
            </div>
            
            {/* Login Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-200 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="form-input w-full bg-white/10 border-white/20 text-white placeholder-gray-400 focus:bg-white/20 focus:border-blue-400 focus:ring-blue-400/50"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <SparklesIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-200 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      className="form-input w-full bg-white/10 border-white/20 text-white placeholder-gray-400 focus:bg-white/20 focus:border-blue-400 focus:ring-blue-400/50 pr-10"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-white transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-white" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400 hover:text-white" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-4 text-lg font-semibold rounded-2xl shadow-glow transform transition-all duration-300 hover:scale-105 hover:shadow-glow-purple disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <ShieldCheckIcon className="h-5 w-5" />
                    <span>Sign In</span>
                  </div>
                )}
              </button>
            </form>
            
            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-400">
                Road Issue Reporting and Management System
              </p>
              <div className="mt-2 flex items-center justify-center space-x-1 text-xs text-gray-500">
                <ShieldCheckIcon className="h-3 w-3" />
                <span>Secured by enterprise-grade encryption</span>
              </div>
            </div>
          </div>

          {/* Additional Info Card */}
          <div className="mt-6 glass-dark rounded-2xl p-4 backdrop-blur-xl border border-white/10">
            <div className="text-center">
              <p className="text-sm text-gray-300 mb-2">
                <span className="font-semibold text-blue-400">Demo Credentials:</span>
              </p>
              <div className="text-xs text-gray-400 space-y-1">
                <p>Email: <span className="text-white font-mono">admin@roadportal.com</span></p>
                <p>Password: <span className="text-white font-mono">admin123</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
