"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCourseLectures,
  useCreateLecture,
  useDeleteLecture,
} from "@/hooks/lecture/useLecture";
import { Edit, Loader2, PlayCircle, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const CourseLecturePage = () => {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const [lectureTitle, setLectureTitle] = useState("");
  // Track which lecture is being deleted
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { mutate, isPending } = useCreateLecture(courseId);
  const {
    data: lecturesData,
    isLoading: isLoadingLectures,
    refetch,
  } = useCourseLectures(courseId);
  const { mutate: deleteLecture } = useDeleteLecture(courseId);

  useEffect(() => {
    // Any initialization logic can go here
    console.log("Course lectures page loaded");
  }, []);

  const handleCreateLecture = () => {
    if (!lectureTitle.trim()) {
      alert("Please enter a lecture title");
      return;
    }

    const lectureData = {
      title: lectureTitle,
    };
    mutate(lectureData, {
      onSuccess: () => {
        setLectureTitle("");
        refetch();
      },
    });
  };

  const handleLectureDelete = async (lectureId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this lecture? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeletingId(lectureId);
    deleteLecture(lectureId, {
      onSuccess: () => {
        refetch(); // Refresh the lectures list
      },
      onSettled: () => {
        setDeletingId(null);
      },
    });
  };

  return (
    <div className="flex-1 mx-auto max-w-2xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Create Your Lecture
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Let's add lectures details for your new lecture
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="space-y-6">
          {/* Course Title Section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              Lecture Title
              <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              name="lectureTitle"
              placeholder="Enter your lecture name"
              value={lectureTitle}
              onChange={(e) => setLectureTitle(e.target.value)}
              className="h-12 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 transition-colors"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/course")}
            className="flex-1 sm:flex-none h-12 px-6 text-base font-medium border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
          >
            ← Back to Courses
          </Button>
          <Button
            onClick={handleCreateLecture}
            disabled={isPending}
            className="flex-1 sm:flex-none h-12 px-8 text-base font-medium bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                <span>Creating Lecture...</span>
              </>
            ) : (
              <>
                <span>Create Lecture</span>
                <span className="ml-2">→</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Existing Lectures Section */}
      <div className="mt-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Course Lectures
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and edit your course lectures
          </p>
        </div>

        {isLoadingLectures ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600 dark:text-gray-300">
                Loading lectures...
              </span>
            </div>
          </div>
        ) : lecturesData && lecturesData.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {lecturesData.map((lecture: any, index: number) => (
                <div
                  key={lecture.id}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          <PlayCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            #{index + 1}
                          </span>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {lecture.title}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            Created:{" "}
                            {new Date(lecture.createdAt).toLocaleDateString()}
                          </span>
                          {lecture.videoUrl && (
                            <span className="text-sm text-green-600 dark:text-green-400">
                              Video uploaded
                            </span>
                          )}
                          <span
                            className={`text-sm px-2 py-1 rounded-full ${
                              lecture.isFree
                                ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {lecture.isFree ? "Free Preview" : "Premium"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/dashboard/course/${courseId}/lecture/${lecture.id}`
                          )
                        }
                        className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLectureDelete(lecture.id)}
                        disabled={deletingId === lecture.id}
                        className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900"
                      >
                        {deletingId === lecture.id ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-1" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center">
              <PlayCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No lectures yet
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Create your first lecture to get started with your course.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseLecturePage;
