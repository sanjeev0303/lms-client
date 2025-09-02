"use client";

import CourseCard from "@/components/course/course-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEnrolledCourses } from "@/hooks";
import { useUpdateProfile, useMe } from "@/hooks";
import { useVerifyPhone } from "@/hooks/user/usePhoneVerification";
import { useAuth, useUser } from "@clerk/nextjs";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Image from "next/image";

const ProfilePage = () => {
  const router = useRouter();
  const { isLoaded } = useAuth();
  const { user } = useUser();

  // Use centralized API hook for server user data
  const { data: serverUser } = useMe();

  const { data: enrolledCourses, isLoading: coursesLoading } = useEnrolledCourses();

  // Use optimized update profile hook
  const updateProfile = useUpdateProfile();

  // Use phone verification hook
  const verifyPhone = useVerifyPhone();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState("STUDENT");

  // Additional state for file upload and messages
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Initialize form with server data when it loads
  useEffect(() => {
    if (serverUser) {
      setFirstName(serverUser.firstName || "");
      setLastName(serverUser.lastName || "");
      setPhoneNumber(serverUser.phoneNumber || "");
      setRole(serverUser.role || "");
    }
  }, [serverUser]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Prepare update data according to UpdateProfileData interface
    const updateData = {
      firstName,
      lastName,
      phoneNumber,
      role,
      ...(selectedFile && { profileImage: selectedFile }),
    };

    // Use the optimized update profile hook
    updateProfile.mutate(updateData, {
      onSuccess: () => {
        setMessage("Profile updated successfully!");
        // Clean up preview
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        setSelectedFile(null);
      },
      onError: (error: Error) => {
        setError(error instanceof Error ? error.message : "Failed to update profile");
      },
    });
  };

  // Handle phone verification using React Query hook
  const handlePhoneVerification = () => {
    if (!user || !phoneNumber.trim()) {
      setError("Please enter a phone number first");
      return;
    }

    // Clear any existing errors
    setError(null);

    // Use the React Query mutation
    verifyPhone.mutate({ phoneNumber });
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Authentication Required</h1>
          <p className="text-gray-300 mb-6">You need to be signed in to view this page.</p>
          <Link href="/" className="bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-md">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-900 rounded-lg shadow p-6 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-6">Edit Profile</h1>

          {/* Messages */}
          {message && (
            <div className="mb-6 p-4 bg-green-900 border border-green-700 text-green-200 rounded">{message}</div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-900 border border-red-700 text-red-200 rounded">{error}</div>
          )}

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Profile Image Section */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white">Profile Image</h2>

                <div className="flex items-center space-x-4">
                  <div className="relative">
                    {previewUrl ? (
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        width={96}
                        height={96}
                        className="w-24 h-24 rounded-full object-cover border-4 border-gray-600"
                        unoptimized
                      />
                    ) : serverUser?.photoUrl ? (
                      <Image
                        src={serverUser.photoUrl}
                        alt="Profile"
                        width={96}
                        height={96}
                        className="w-24 h-24 rounded-full object-cover border-4 border-gray-600"
                        unoptimized
                      />
                    ) : serverUser?.imageUrl ? (
                      <Image
                        src={serverUser.imageUrl}
                        alt="Profile"
                        width={96}
                        height={96}
                        className="w-24 h-24 rounded-full object-cover border-4 border-gray-600"
                        unoptimized
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-300 text-lg font-semibold">
                          {firstName?.[0] || user.firstName?.[0]}
                          {lastName?.[0] || user.lastName?.[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block">
                      <span className="sr-only">Choose profile photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-800 file:text-gray-200 hover:file:bg-gray-700"
                      />
                    </label>
                    <p className="text-xs text-gray-400 mt-1">Max 5MB, images only</p>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white">Personal Information</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="Enter first name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="Enter last name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email (Read-only)</label>
                  <input
                    type="email"
                    value={serverUser?.email || user?.primaryEmailAddress?.emailAddress || ""}
                    disabled
                    className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed from this form</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
                      placeholder="Enter phone number"
                    />
                    <button
                      type="button"
                      onClick={handlePhoneVerification}
                      disabled={!phoneNumber.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {"Verify"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Click verify to validate your phone number</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                  <input
                    type="text"
                    value={serverUser?.role || ""}
                    disabled
                    className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
              <Link href="/dashboard" className="px-4 py-2 text-gray-300 border border-gray-600 rounded-md hover:bg-gray-800">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={updateProfile.isPending}
                className="px-6 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateProfile.isPending ? "Updating..." : "Update Profile"}
              </button>
            </div>
          </form>
        </div>

        {/* Courses Section */}
        <div className="space-y-6 mt-5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Learning Journey</h2>
          </div>

          {/* Enrolled Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coursesLoading ? (
              // Loading skeleton for courses
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-64" />
              ))
            ) : !enrolledCourses || enrolledCourses.length === 0 ? (
              <div className="col-span-full">
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border-dashed border-2 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-12 text-center">
                    <BookOpen className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">No Courses Yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">Start your learning journey by enrolling in your first course!</p>
                    <Button onClick={() => router.push("/")} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300">
                      Browse Courses
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              enrolledCourses.map((course: any, index: number) => (
                <div key={course.id || index} className="transform transition-all duration-300 hover:scale-105">
                  <CourseCard course={course} />
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
