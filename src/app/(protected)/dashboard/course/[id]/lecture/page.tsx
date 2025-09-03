"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    useCourseLectures,
    useCreateLecture,
    useDeleteLecture,
    useReorderLectures,
} from "@/hooks/lecture/useLecture";
import { SortableLectureList } from "@/components/lecture/sortable-lecture-list";
import { Loader2, PlayCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

interface Lecture {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  isFree: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

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
  const { mutate: reorderLectures, isPending: isReordering } = useReorderLectures(courseId);

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

  const handleLectureReorder = (reorderedLectures: Lecture[]) => {
    // Create the reorder payload
    const lectureOrders = reorderedLectures.map((lecture, index) => ({
      id: lecture.id,
      position: index + 1
    }));

    reorderLectures(lectureOrders);
  };

  const handleEditLecture = (lectureId: string) => {
    router.push(`/dashboard/course/${courseId}/lecture/${lectureId}`);
  };

  // Sort lectures by position for display and map to expected structure
  const sortedLectures = lecturesData
    ? [...lecturesData].map((lecture: any) => ({
        id: lecture.id,
        title: lecture.title,
        description: lecture.description,
        videoUrl: lecture.videoUrl,
        isFree: lecture.isFree,
        position: lecture.order || lecture.position || 0, // Use order field, fallback to position
        createdAt: lecture.createdAt,
        updatedAt: lecture.updatedAt,
      } as Lecture)).sort((a, b) => a.position - b.position)
    : [];

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
            Manage and edit your course lectures. Drag lectures to reorder them.
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
        ) : (
          <SortableLectureList
            lectures={sortedLectures}
            onReorder={handleLectureReorder}
            onEdit={handleEditLecture}
            onDelete={handleLectureDelete}
            deletingId={deletingId}
            isReordering={isReordering}
          />
        )}
      </div>
    </div>
  );
};

export default CourseLecturePage;
