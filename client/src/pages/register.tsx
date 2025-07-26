import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import { registerSchema, type RegisterRequest } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerUser, registerError, isRegisterPending } = useAuth();

  const form = useForm<RegisterRequest>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const onSubmit = async (data: RegisterRequest) => {
    try {
      await registerUser(data);
      setLocation("/"); // Redirect to dashboard after successful registration
    } catch (error) {
      // Error is handled by useAuth hook
    }
  };

  const password = form.watch("password");
  const passwordStrength = {
    hasLength: password && password.length >= 6,
    hasNumber: password && /\d/.test(password),
    hasSpecial: password && /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create Account
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Join thousands of users improving their productivity with AI
          </p>
        </div>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Create your account to get started with AI Smart Notes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Error Alert */}
              {registerError && (
                <Alert variant="destructive">
                  <AlertDescription>{registerError}</AlertDescription>
                </Alert>
              )}

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    disabled={isRegisterPending}
                    {...form.register("firstName")}
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    disabled={isRegisterPending}
                    {...form.register("lastName")}
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  disabled={isRegisterPending}
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    disabled={isRegisterPending}
                    {...form.register("password")}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                
                {/* Password Strength Indicators */}
                {password && (
                  <div className="space-y-1">
                    <div className={`flex items-center text-xs ${passwordStrength.hasLength ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle className={`mr-1 h-3 w-3 ${passwordStrength.hasLength ? 'text-green-600' : 'text-gray-400'}`} />
                      At least 6 characters
                    </div>
                    <div className={`flex items-center text-xs ${passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle className={`mr-1 h-3 w-3 ${passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-400'}`} />
                      Contains a number
                    </div>
                  </div>
                )}
                
                {form.formState.errors.password && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isRegisterPending}
              >
                {isRegisterPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              {/* Terms */}
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </p>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{" "}
                <Link href="/login">
                  <span className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer">
                    Sign in
                  </span>
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Free Tier Benefits */}
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 border-indigo-200 dark:border-gray-600">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
              🎉 Start Free Today
            </h3>
            <div className="space-y-1 text-sm text-indigo-700 dark:text-indigo-400">
              <p>✓ 50 tasks per month</p>
              <p>✓ 5 AI insights daily</p>
              <p>✓ Basic habit tracking</p>
              <p>✓ Mobile-responsive design</p>
            </div>
            <p className="text-xs text-indigo-600 dark:text-indigo-300 mt-2">
              Upgrade anytime for unlimited features and advanced AI
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}