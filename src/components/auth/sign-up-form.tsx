"use client";

import { useAuth, useSignUp } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { SignUpFormData, signUpSchema } from "@/validation/auth-validation";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { AuthLayout } from "./auth-layout";
import { OAuthButtons } from "./oauth-button";

export default function SignUpForm() {
  const { isLoaded, signUp } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  useEffect(() => {
    if (isSignedIn) {
      router.push("/dashboard");
    }
  }, [isSignedIn]);

  const onSubmit = async (data: SignUpFormData) => {
    if (!isLoaded) return;

    try {
      // First, create the sign-up with only email and password
      const result = await signUp.create({
        emailAddress: data.email,
        password: data.password,
      });

      if (result.status === "missing_requirements") {
        // Need email verification - redirect to dedicated verification page
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });

        toast.success("Verification email sent! Please check your inbox.");

        // Redirect to verification page with user data
        const params = new URLSearchParams({
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          password: data.password,
        });

        router.push(`/verify-email?${params.toString()}`);
      } else {
        toast.success("Account created successfully!");
        router.push("/dashboard");
      }
    } catch (err: any) {
      const errorMessage =
        err.errors?.[0]?.message || "An error occurred during sign up.";
      toast.error(errorMessage);
      form.setError("root", {
        message: errorMessage,
      });
    }
  };

  const handleOAuthSignUp = async (
    provider: "oauth_google" | "oauth_github"
  ) => {
    if (!isLoaded) return;

    try {
      await signUp.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err: any) {
      const errorMessage =
        err.errors?.[0]?.message ||
        `An error occurred with ${provider} sign up.`;
      toast.error(errorMessage);
      form.setError("root", {
        message: errorMessage,
      });
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Enter your details below to create your account"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {form.formState.errors.root && (
            <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/50">
              <p className="text-sm text-red-600 dark:text-red-400">
                {form.formState.errors.root.message}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div id="clerk-captcha"></div>
          <Button
            type="submit"
            className="w-full bg-gray-300 text-gray-700"
            disabled={!isLoaded || form.formState.isSubmitting}
          >
            {form.formState.isSubmitting
              ? "Creating Account..."
              : "Create Account"}
          </Button>
        </form>
      </Form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-300 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
            Or continue with
          </span>
        </div>
      </div>

      <OAuthButtons onOAuth={handleOAuthSignUp} />

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
