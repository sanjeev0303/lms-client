"use client";

import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCourseView } from "@/hooks";
import { progressService } from "@/lib/api/services";
import { Lecture } from "@/types/api";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  PlayCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  optimizeCloudinaryVideo,
  generateVideoThumbnail,
  shouldUseProgressiveLoading,
} from "@/lib/utils/video-optimizer";
import {
  PerformanceMonitor,
  usePerformanceMonitoring,
} from "@/components/performance/performance-monitor";
// Remove direct import and use dynamic import for better LCP and SSR safety
const ReactPlayer = dynamic(() => import("react-player"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
      Loading player...
    </div>
  ),
});

interface CourseProgressPageProps {
  params: Promise<{
    courseId: string;
    lectureId?: string;
  }>;
}

// Type for lecture progress record
interface LectureProgressRecord {
  lectureId: string;
  isUnlocked: boolean;
  isCompleted: boolean;
}

const CourseProgressPage = ({ params }: CourseProgressPageProps) => {
  const { courseId, lectureId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const { markStart, markEnd, measureVideoLoading } =
    usePerformanceMonitoring();

  // State for current lecture
  const [currentLectureId, setCurrentLectureId] = useState<string>("");
  // Removed unused isVideoReady state
  const [watchProgress, setWatchProgress] = useState(0);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [useOriginalVideo, setUseOriginalVideo] = useState<boolean>(false);
  const [videoLoadStart, setVideoLoadStart] = useState<number>(0);

  const {
    course,
    lectures: lecturesData,
    progress: lectureProgressData,
    isLoading: courseViewLoading,
    error: courseViewError,
  } = useCourseView(courseId);

  // Derived loading states for backwards compatibility
  const courseLoading = courseViewLoading;
  const lecturesLoading = courseViewLoading;
  const progressLoading = courseViewLoading;
  const courseError = courseViewError;

  // Memoized lectures array to avoid unnecessary re-renders
  const lectures: Lecture[] = useMemo(() => {
    if (lecturesData) {
      const data = lecturesData as unknown;
      if (Array.isArray(data)) {
        return data as Lecture[];
      } else if (
        (data as { lectures?: Lecture[] })?.lectures &&
        Array.isArray((data as { lectures?: Lecture[] }).lectures)
      ) {
        return (data as { lectures: Lecture[] }).lectures;
      } else if (
        (data as { data?: { lectures?: Lecture[] } })?.data?.lectures &&
        Array.isArray(
          (data as { data?: { lectures?: Lecture[] } }).data?.lectures
        )
      ) {
        return (data as { data: { lectures: Lecture[] } }).data.lectures;
      }
    }
    return [];
  }, [lecturesData]);

  // Find current lecture and index
  const currentLectureIndex = currentLectureId
    ? lectures.findIndex((lecture) => lecture.id === currentLectureId)
    : 0;
  const currentLecture = lectures[currentLectureIndex] || lectures[0];

  // Set initial lecture ID if not set
  useEffect(() => {
    if (!currentLectureId && lectures.length > 0) {
      if (lectureId) {
        // Use lectureId from URL if available
        const lecture = lectures.find((l) => l.id === lectureId);
        if (lecture) {
          setCurrentLectureId(lectureId);
        } else {
          setCurrentLectureId(lectures[0].id);
        }
      } else {
        // Default to first lecture
        setCurrentLectureId(lectures[0].id);
      }
    }
  }, [lectures, lectureId, currentLectureId]);

  // Helper function to check if a lecture is unlocked
  const isLectureUnlocked = (lectureId: string, isFree: boolean): boolean => {
    if (isFree) return true;

    if (lectureProgressData && Array.isArray(lectureProgressData)) {
      const progressRecord = (
        lectureProgressData as LectureProgressRecord[]
      ).find((progress) => progress.lectureId === lectureId);
      return progressRecord?.isUnlocked || false;
    }
    return false;
  };

  // Helper function to check if a lecture is completed
  const isLectureCompleted = (lectureId: string): boolean => {
    if (lectureProgressData && Array.isArray(lectureProgressData)) {
      const progressRecord = (
        lectureProgressData as LectureProgressRecord[]
      ).find((progress) => progress.lectureId === lectureId);
      return progressRecord?.isCompleted || false;
    }
    return false;
  };

  // Mark lecture as completed mutation
  const markLectureCompletedMutation = useMutation({
    mutationFn: async (lectureId: string) => {
      const token = await getToken();
      if (!token) {
        throw new Error("User not authenticated");
      }
      return await progressService.completeLecture(lectureId, courseId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["lecture-progress", courseId],
      });
      queryClient.invalidateQueries({
        queryKey: ["course-lectures", courseId],
      });
      toast.success("Lecture marked as completed!");
    },
    onError: (error: unknown) => {
      // error is unknown, try to get message
      const errMsg =
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message
          : "Failed to mark lecture as completed";
      console.error("Error marking lecture as completed:", error);
      toast.error(errMsg);
    },
  });

  // Set initial lecture from URL parameter
  useEffect(() => {
    if (lectureId && lectures.length > 0) {
      const lectureIndex = lectures.findIndex(
        (lecture) => lecture.id === lectureId
      );
      if (lectureIndex !== -1) {
        setCurrentLectureId(lectureId);
      }
    }
  }, [lectureId, lectures]);

  // Handle lecture selection
  const handleLectureSelect = (index: number, lecture: Lecture) => {
    const isUnlocked = isLectureUnlocked(lecture.id, lecture.isFree ?? false);

    if (!isUnlocked) {
      toast.error(
        "This lecture is locked. Please complete previous lectures to unlock it."
      );
      return;
    }

    setCurrentLectureId(lecture.id);
    setWatchProgress(0);
    setVideoError(false); // Reset video error state
    setUseOriginalVideo(false); // Reset to optimized video
    setVideoLoadStart(performance.now()); // Start measuring load time

    // Update URL
    router.push(`/course-progress/${courseId}?lectureId=${lecture.id}`, {
      scroll: false,
    });
  };

  // Handle mark as completed
  const handleMarkCompleted = () => {
    if (currentLecture && !isLectureCompleted(currentLecture.id)) {
      markLectureCompletedMutation.mutate(currentLecture.id);
    }
  };

  // Navigate to next lecture
  const handleNextLecture = () => {
    const currentIndex = lectures.findIndex(
      (lecture) => lecture.id === currentLectureId
    );
    if (currentIndex < lectures.length - 1) {
      const nextLecture = lectures[currentIndex + 1];
      handleLectureSelect(currentIndex + 1, nextLecture);
    }
  };

  // Navigate to previous lecture
  const handlePreviousLecture = () => {
    const currentIndex = lectures.findIndex(
      (lecture) => lecture.id === currentLectureId
    );
    if (currentIndex > 0) {
      const prevLecture = lectures[currentIndex - 1];
      handleLectureSelect(currentIndex - 1, prevLecture);
    }
  };

  // Handle video progress
  const handleVideoProgress = (progress: { played: number }) => {
    setWatchProgress(progress.played * 100);

    // Auto-mark as completed when 80% watched
    if (
      progress.played >= 0.8 &&
      currentLecture &&
      !isLectureCompleted(currentLecture.id)
    ) {
      markLectureCompletedMutation.mutate(currentLecture.id);
    }
  };

  if (courseLoading || lecturesLoading || progressLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course content...</p>
        </div>
      </div>
    );
  }

  if (courseError || !course || lectures.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading course content</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Performance Monitor */}
      <PerformanceMonitor enabled={process.env.NODE_ENV === "development"} />

      <div className="max-w-7xl mx-auto p-2 sm:p-4 lg:p-6">
        {/* Header with course info and back button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/course-detail/${courseId}`)}
              className="w-fit"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Course
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                {course.title}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Lecture {currentLectureIndex + 1} of {lectures.length}
              </p>
            </div>
          </div>

          {/* Mark as completed button */}
          {currentLecture && (
            <Button
              onClick={handleMarkCompleted}
              disabled={
                isLectureCompleted(currentLecture.id) ||
                markLectureCompletedMutation.isPending
              }
              variant={
                isLectureCompleted(currentLecture.id) ? "outline" : "default"
              }
              className={`w-full sm:w-auto ${
                isLectureCompleted(currentLecture.id)
                  ? "bg-green-50 text-green-700 border-green-200"
                  : ""
              }`}
              size="sm"
            >
              {isLectureCompleted(currentLecture.id) ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Completed</span>
                  <span className="sm:hidden">✓</span>
                </>
              ) : markLectureCompletedMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span className="hidden sm:inline">Marking...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Mark Complete</span>
                  <span className="sm:hidden">Complete</span>
                </>
              )}
            </Button>
          )}
        </div>

        <div className="flex flex-col xl:flex-row gap-4 sm:gap-6">
          {/* Video section */}
          <div className="flex-1 xl:w-3/5">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {/* Video Player */}
                <div className="relative aspect-video bg-gray-900">
                  {currentLecture && currentLecture.videoUrl ? (
                    <>
                      <ReactPlayer
                        url={
                          useOriginalVideo
                            ? currentLecture.videoUrl
                            : optimizeCloudinaryVideo(currentLecture.videoUrl)
                        }
                        className="absolute inset-0"
                        width="100%"
                        height="100%"
                        controls={true}
                        playing={false}
                        pip={true}
                        light={
                          !videoError &&
                          (generateVideoThumbnail(currentLecture.videoUrl) ||
                            true)
                        }
                        progressInterval={1000} // Update progress every second
                        onReady={() => {
                          setVideoError(false);
                          // Measure video loading performance
                          if (videoLoadStart > 0 && currentLecture?.videoUrl) {
                            measureVideoLoading(
                              currentLecture.videoUrl,
                              videoLoadStart
                            );
                          }
                        }}
                        onProgress={handleVideoProgress}
                        onError={(error: unknown) => {
                          console.error("Video playback error:", error);
                          setVideoError(true);

                          if (!useOriginalVideo) {
                            // Try original video URL as fallback
                            setUseOriginalVideo(true);
                            toast.error(
                              "Video optimization failed. Trying original format..."
                            );
                          } else {
                            toast.error(
                              "Unable to load video. Please try refreshing the page."
                            );
                          }
                        }}
                        config={{
                          youtube: {
                            playerVars: {
                              disablekb: 1,
                              modestbranding: 1,
                              rel: 0,
                              showinfo: 0,
                              origin: window.location.origin,
                            },
                          },
                          vimeo: {
                            playerOptions: {
                              download: false,
                              responsive: true,
                            },
                          },
                          file: {
                            attributes: {
                              controlsList: "nodownload",
                              preload: shouldUseProgressiveLoading(
                                currentLecture.videoUrl
                              )
                                ? "metadata"
                                : "auto",
                              crossOrigin: "anonymous",
                              playsInline: true,
                            },
                            forceHLS: false, // Disable HLS to prevent errors with Cloudinary
                            forceDASH: false, // Disable DASH as well
                            forceVideo: true, // Force video element instead of HLS
                          },
                        }}
                      />

                      {/* Video Error Overlay */}
                      {videoError && useOriginalVideo && (
                        <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
                          <div className="text-center text-white p-4">
                            <PlayCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="text-sm mb-4">Video failed to load</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setVideoError(false);
                                setUseOriginalVideo(false);
                                window.location.reload();
                              }}
                            >
                              Retry
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-800 text-white">
                      <div className="text-center p-4">
                        <PlayCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-sm sm:text-base">
                          No video available for this lecture
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Progress overlay */}
                  {watchProgress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${watchProgress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Lecture Info */}
                <div className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg sm:text-xl text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {currentLecture?.title || "Loading..."}
                      </h3>
                      {currentLecture?.description && (
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                          {currentLecture.description}
                        </p>
                      )}

                      {/* Lecture badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        {currentLecture?.isFree && (
                          <Badge
                            variant="outline"
                            className="text-green-600 border-green-600 text-xs"
                          >
                            Free Preview
                          </Badge>
                        )}
                        {isLectureCompleted(currentLecture?.id || "") && (
                          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                        {watchProgress > 0 && watchProgress < 100 && (
                          <Badge
                            variant="outline"
                            className="text-blue-600 border-blue-600 text-xs"
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            {Math.round(watchProgress)}% watched
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Navigation buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="outline"
                      onClick={handlePreviousLecture}
                      disabled={currentLectureIndex === 0}
                      className="flex items-center justify-center gap-2 w-full sm:w-auto"
                      size="sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Previous Lecture</span>
                      <span className="sm:hidden">Previous</span>
                    </Button>

                    <Button
                      onClick={handleNextLecture}
                      disabled={currentLectureIndex === lectures.length - 1}
                      className="flex items-center justify-center gap-2 w-full sm:w-auto"
                      size="sm"
                    >
                      <span className="hidden sm:inline">Next Lecture</span>
                      <span className="sm:hidden">Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lecture Sidebar */}
          <div className="flex flex-col w-full xl:w-2/5">
            <Card>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <h2 className="font-semibold text-lg sm:text-xl mb-4 text-gray-900 dark:text-white">
                  Course Lectures
                </h2>

                {/* Progress summary */}
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Progress:
                    </span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {lectures.filter((l) => isLectureCompleted(l.id)).length}{" "}
                      / {lectures.length} completed
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          (lectures.filter((l) => isLectureCompleted(l.id))
                            .length /
                            lectures.length) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Lectures list */}
                <div className="space-y-2 max-h-64 sm:max-h-80 lg:max-h-96 overflow-y-auto">
                  {lectures.map((lecture, index) => {
                    const isUnlocked = isLectureUnlocked(
                      lecture.id,
                      lecture.isFree ?? false
                    );
                    const isCompleted = isLectureCompleted(lecture.id);
                    const isCurrent = lecture.id === currentLectureId;

                    return (
                      <div
                        key={lecture.id}
                        onClick={() => handleLectureSelect(index, lecture)}
                        className={`
                                                        p-2 sm:p-3 rounded-lg border transition-all cursor-pointer
                                                        ${
                                                          isCurrent
                                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                                            : isUnlocked
                                                            ? "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                                                            : "border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed"
                                                        }
                                                    `}
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          {/* Status icon */}
                          <div
                            className={`
                                                            flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full flex-shrink-0
                                                            ${
                                                              isCompleted
                                                                ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                                                                : isUnlocked
                                                                ? isCurrent
                                                                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                                                                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                                                : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                                                            }
                                                        `}
                          >
                            {isCompleted ? (
                              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            ) : isUnlocked ? (
                              <PlayCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            ) : (
                              <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
                            )}
                          </div>

                          {/* Lecture info */}
                          <div className="flex-1 min-w-0">
                            <h4
                              className={`
                                                                font-medium text-xs sm:text-sm truncate
                                                                ${
                                                                  isCurrent
                                                                    ? "text-blue-600 dark:text-blue-400"
                                                                    : isUnlocked
                                                                    ? "text-gray-900 dark:text-white"
                                                                    : "text-gray-500 dark:text-gray-400"
                                                                }
                                                            `}
                            >
                              {lecture.title}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Lecture {index + 1}
                              {lecture.isFree && " • Free"}
                            </p>
                          </div>

                          {/* Current indicator */}
                          {isCurrent && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseProgressPage;
