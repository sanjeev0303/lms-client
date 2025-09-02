"use client";

import { useAuth, useSession, useSignUp } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense } from "react";
import Link from "next/link";
import { refreshUserData } from "@/components/auth/custom-user-button";

function VerifyEmailContent() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isSignedIn } = useAuth();
  const { session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [code, setCode] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [resendLoading, setResendLoading] = React.useState(false);

  // Get email and names from URL params (passed from sign-up)
  const email = searchParams.get("email") || "";
  const firstName = searchParams.get("firstName") || "";
  const lastName = searchParams.get("lastName") || "";
  const password = searchParams.get("password") || "";

  React.useEffect(() => {
    if (isSignedIn) {
      router.push("/dashboard");
    }
  }, [isSignedIn]);

  React.useEffect(() => {
    // If no email or no signUp in progress, redirect to sign-up
    if (isLoaded && (!email || !signUp)) {
      router.push("/sign-up");
    }
  }, [isLoaded, email, signUp]);

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded || !signUp) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });

        // After successful email verification, create user in our database with hashed password
        try {
          // Get the user ID from the result
          const clerkUserId = result.createdUserId;

          if (clerkUserId && password && firstName && lastName) {
            // Call our custom signup endpoint to store user with hashed password
            const signupResponse = await fetch(
              "http://localhost:5000/api/auth/signup",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email,
                  password,
                  firstName,
                  lastName,
                  clerkId: clerkUserId,
                }),
              }
            );

            if (signupResponse.ok) {
              const result = await signupResponse.json();
              console.log(
                "User created in database with hashed password:",
                result
              );

              // Refresh navbar user data with new database user
              refreshUserData();
            } else {
              const errorText = await signupResponse.text();
              console.warn("Failed to create user in database:", errorText);
            }
          } else {
            console.warn("Missing required data for user creation");
          }
        } catch (dbError) {
          console.warn("Failed to create user in database:", dbError);
        }

        router.push("/dashboard");
      } else {
        setError("Verification failed. Please check the code and try again.");
      }
    } catch (err: unknown) {
      const error = err as { errors?: Array<{ message: string }> };
      setError(
        error.errors?.[0]?.message || "An error occurred during verification."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || !signUp) return;

    setResendLoading(true);
    setError("");

    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      // Show success message (you could add a success state if needed)
      alert("Verification code sent! Please check your email.");
    } catch (err: unknown) {
      const error = err as { errors?: Array<{ message: string }> };
      setError(
        error.errors?.[0]?.message || "Failed to resend verification code."
      );
    } finally {
      setResendLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2">
            Verify your email
          </h2>
          <p className="text-gray-300">
            We sent a verification code to{" "}
            <span className="font-medium text-white">{email}</span>
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Please check your email and enter the verification code below
          </p>
        </div>

        <div className="bg-gray-900 p-8 rounded-lg shadow-lg border border-gray-700">
          <form onSubmit={handleVerification} className="space-y-6">
            {error && (
              <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Verification code
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                placeholder="Enter 6-digit code"
                maxLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !code}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                "Verify Email"
              )}
            </button>

            <div className="text-center space-y-4">
              <p className="text-sm text-gray-400">Didn't receive the code?</p>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendLoading}
                className="text-white hover:text-gray-300 text-sm transition-colors disabled:opacity-50"
              >
                {resendLoading ? "Sending..." : "Resend verification code"}
              </button>
            </div>

            <div className="text-center">
              <Link
                href="/sign-up"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                ← Back to sign up
              </Link>
            </div>
          </form>
        </div>

        {/* User info preview */}
        {(firstName || lastName) && (
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
            <p className="text-sm text-gray-400 text-center">
              Signing up as:{" "}
              <span className="text-white">
                {firstName} {lastName}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
