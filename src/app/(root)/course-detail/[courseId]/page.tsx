"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useCourseDetail,
  useCourseEnrollment,
  useCourseLectures,
  useCourseProgress,
  useCurrentUser,
} from "@/hooks";
import { Lecture } from "@/types/api";
import {
  CheckCircle,
  Clock,
  Lock,
  PlayCircle,
  Star,
  Users,
} from "lucide-react";
import Image from "next/image";
import { notFound, useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import ReactPlayer from "react-player";
import { CourseDetailSkeleton } from "../_components/course-detali-skeleton";
import PurchaseCourseButton from "../_components/purchase-course-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CourseDetailPageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseId } = use(params);
  const router = useRouter();

  const {
    data: course,
    isLoading: courseLoading,
    error: courseError,
  } = useCourseDetail(courseId);

  const {
    data: lecturesData,
    isLoading: lecturesLoading,
    error: lecturesError,
  } = useCourseLectures(courseId);

  const { data: currentUser } = useCurrentUser();

  const { data: enrollmentData, isLoading: enrollmentLoading } =
    useCourseEnrollment(courseId);

  // Get lecture progress data to show unlock status
  const { data: lectureProgressData, isLoading: progressLoading } =
    useCourseProgress(courseId);

  // Normalize lectures early so hooks below can depend on them consistently across renders
  let lectures: Lecture[] = [];
  if (lecturesData && Array.isArray(lecturesData)) {
    lectures = lecturesData.map((lecture) => ({
      ...lecture,
      isFree: lecture.isFree ?? false,
      duration:
        typeof lecture.duration === "number"
          ? lecture.duration.toString()
          : lecture.duration,
      order: lecture.order ?? 0,
      isPublished: lecture.isPublished ?? false,
    }));
  } else {
    lectures = [];
  }

  // Compute first free lecture for preview (safe even when empty)
  const firstFreeLecture = lectures.find((lecture: Lecture) => lecture.isFree);

  // Video preview: determine a reachable URL once, otherwise fall back to thumbnail
  const [videoUrlToPlay, setVideoUrlToPlay] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const checkReachable = async (url: string) => {
      const t = setTimeout(() => controller.abort(), 3000);
      try {
        await fetch(url, {
          method: "HEAD",
          signal: controller.signal,
          cache: "no-store",
        });
        clearTimeout(t);
        return true;
      } catch {
        clearTimeout(t);
        return false;
      }
    };

    const init = async () => {
      const raw = firstFreeLecture?.videoUrl?.trim();
      if (!raw || !/^https?:\/\//i.test(raw)) {
        if (!cancelled) setVideoUrlToPlay(null);
        return;
      }
      if (await checkReachable(raw)) {
        if (!cancelled) setVideoUrlToPlay(raw);
        return;
      }
      const hls = raw.replace(/\.mp4(\?.*)?$/i, ".m3u8$1");
      if (hls !== raw && (await checkReachable(hls))) {
        if (!cancelled) setVideoUrlToPlay(hls);
        return;
      }
      if (!cancelled) setVideoUrlToPlay(null);
    };

    init();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [firstFreeLecture?.videoUrl]);

  // Early returns AFTER all hooks above to keep hook order consistent
  if (courseLoading || lecturesLoading || (currentUser && progressLoading)) {
    return <CourseDetailSkeleton />;
  }

  if (courseError || !course) {
    notFound();
  }

  const totalLectures = lectures.length;
  const freeLectures = lectures.filter(
    (lecture: Lecture) => lecture.isFree
  ).length;
  const isEnrolled = enrollmentData?.isEnrolled || false;

  // Helper function to check if a lecture is unlocked
  const isLectureUnlocked = (lectureId: string, isFree: boolean): boolean => {
    // Free lectures are always unlocked; enrolled users have access to all content
    if (isFree) return true;
    return isEnrolled;
  };

  // Helper function to check if a lecture is completed
  const isLectureCompleted = (lectureId: string): boolean => {
    const lectureProgressList = lectureProgressData?.lectures ?? [];
    const progressRecord = lectureProgressList.find((p) => p.lectureId === lectureId);
    return !!progressRecord?.isCompleted;
  };

  const unlockedLectures = lectures.filter((lecture: Lecture) =>
    isLectureUnlocked(lecture.id, lecture.isFree ?? false)
  ).length;

  // Handle lecture navigation
  const handleLectureClick = (lecture: Lecture) => {
    const isUnlocked = isLectureUnlocked(lecture.id, lecture.isFree ?? false);

    if (isUnlocked) {
      // Navigate to the lecture page
      router.push(`/course/${courseId}/lecture/${lecture.id}`);
    } else {
      // Show message that lecture is locked (optional - could open purchase modal)
      // Could implement a toast notification here instead of console.log
    }
  };

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Section */}
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {course.title}
                    </h1>
                    {course.subTitle && (
                      <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
                        {course.subTitle}
                      </p>
                    )}
                    {course.description && (
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {course.description}
                      </p>
                    )}
                  </div>

                  {/* Course Stats */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>
                        {course._count?.enrollments || 0} student
                        {(course._count?.enrollments || 0) !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <PlayCircle className="w-4 h-4" />
                      <span>
                        {totalLectures} lecture{totalLectures !== 1 ? "s" : ""}
                        {isEnrolled && (
                          <span className="text-green-600 dark:text-green-400 ml-1">
                            ({unlockedLectures} unlocked)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {course.level
                          ? course.level.charAt(0).toUpperCase() +
                            course.level.slice(1).toLowerCase()
                          : "All levels"}
                      </span>
                    </div>
                    {freeLectures > 0 && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>
                          {freeLectures} free preview
                          {freeLectures !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                    {isEnrolled && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                          Enrolled
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Enhanced Instructor Info */}
                  {course.creator ? (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-start space-x-4">
                        {/* Instructor Avatar with graceful fallback */}
                        <Avatar className="h-16 w-16 border-2 border-gray-200 dark:border-gray-700">
                          <AvatarImage
                            src={(course.creator as any)?.photoUrl || (course.creator as any)?.imageUrl || (course.creator as any)?.avatar || undefined}
                            alt={course.creator.name || "Course Instructor"}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-semibold">
                            {(course.creator.name?.charAt(0) || (course.creator as any)?.firstName?.charAt(0) || (course.creator.email?.charAt(0)) || "👨‍🏫").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                            {course.creator.name || `${(course.creator as any)?.firstName || ""} ${(course.creator as any)?.lastName || ""}`.trim() || "Course Instructor"}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Course Instructor & Content Creator
                          </p>
                          {course.creator.email && (
                            <p className="text-sm text-gray-500 dark:text-gray-500 mb-2 flex items-center gap-1">
                              <span>📧</span>
                              <a
                                href={`mailto:${course.creator.email}`}
                                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              >
                                {course.creator.email}
                              </a>
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                            <span className="flex items-center gap-1">
                              <span>📅</span>
                              Created:{" "}
                              {new Date(course.createdAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <span>🔄</span>
                              Updated:{" "}
                              {new Date(course.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                          {/* Instructor badges */}
                          <div className="mt-3 flex items-center gap-2 text-xs">
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium">
                              👨‍🏫 Instructor
                            </span>
                            {course._count?.enrollments &&
                              course._count.enrollments > 0 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 font-medium">
                                  👥 {course._count.enrollments} student
                                  {course._count.enrollments !== 1 ? "s" : ""}
                                </span>
                              )}
                            {course._count?.lectures &&
                              course._count.lectures > 0 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-medium">
                                  🎥 {course._count.lectures} lecture
                                  {course._count.lectures !== 1 ? "s" : ""}
                                </span>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-center py-4 text-gray-500 dark:text-gray-400">
                        <span>👨‍🏫 Instructor information not available</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Course Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                  Course Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Course Category and Level Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        Category:{" "}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 capitalize">
                        {course.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        Level:{" "}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 capitalize">
                        {course.level?.toLowerCase() || "All levels"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        Total Lectures:{" "}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {totalLectures}
                        {isEnrolled && (
                          <span className="text-green-600 dark:text-green-400 ml-1">
                            ({unlockedLectures} unlocked)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        Free Previews:{" "}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {freeLectures} lecture{freeLectures !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Content */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                  Course Content
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {totalLectures} lectures • {freeLectures} free preview
                  {freeLectures !== 1 ? "s" : ""}
                  {isEnrolled && (
                    <span className="text-green-600 dark:text-green-400 ml-1">
                      • {unlockedLectures} unlocked for you
                    </span>
                  )}
                </p>
                {/* Progress Summary for Enrolled Users */}
                {isEnrolled && lectureProgressData && (
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                      🎉 Your Course Progress
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-lg text-green-600 dark:text-green-400">
                          {unlockedLectures}
                        </div>
                        <div className="text-green-700 dark:text-green-300">
                          Unlocked
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg text-blue-600 dark:text-blue-400">
                          {
                            lectures.filter((l) => isLectureCompleted(l.id))
                              .length
                          }
                        </div>
                        <div className="text-blue-700 dark:text-blue-300">
                          Completed
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg text-purple-600 dark:text-purple-400">
                          {Math.round(
                            (lectures.filter((l) => isLectureCompleted(l.id))
                              .length /
                              totalLectures) *
                              100
                          )}
                          %
                        </div>
                        <div className="text-purple-700 dark:text-purple-300">
                          Progress
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lectures && lectures.length > 0 ? (
                    lectures.map((lecture: Lecture, index: number) => {
                      const isUnlocked = isLectureUnlocked(
                        lecture.id,
                        lecture.isFree ?? false
                      );
                      const isCompleted = isLectureCompleted(lecture.id);

                      return (
                        <div
                          key={lecture.id}
                          onClick={() => handleLectureClick(lecture)}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            isUnlocked
                              ? "border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 cursor-pointer hover:scale-[1.02]"
                              : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-not-allowed opacity-75"
                          }`}
                          title={
                            isUnlocked
                              ? "Click to watch this lecture"
                              : "Purchase course to unlock this lecture"
                          }
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                                isCompleted
                                  ? "bg-green-500 text-white"
                                  : isUnlocked
                                  ? "bg-green-100 dark:bg-green-800 hover:bg-green-200 dark:hover:bg-green-700"
                                  : "bg-gray-100 dark:bg-gray-700"
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : isUnlocked ? (
                                <PlayCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                              ) : (
                                <Lock className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <h4
                                className={`font-medium ${
                                  isUnlocked
                                    ? "text-gray-900 dark:text-white"
                                    : "text-gray-500 dark:text-gray-400"
                                }`}
                              >
                                {lecture.title}
                              </h4>
                              {lecture.description && (
                                <p
                                  className={`text-sm ${
                                    isUnlocked
                                      ? "text-gray-600 dark:text-gray-300"
                                      : "text-gray-400 dark:text-gray-500"
                                  }`}
                                >
                                  {lecture.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {isCompleted && (
                              <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">
                                Completed
                              </span>
                            )}
                            {lecture.isFree && (
                              <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded flex items-center gap-1">
                                <PlayCircle className="w-3 h-3" />
                                Watch Free
                              </span>
                            )}
                            {!lecture.isFree && isUnlocked && !isCompleted && (
                              <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded flex items-center gap-1">
                                <PlayCircle className="w-3 h-3" />
                                Watch Now
                              </span>
                            )}
                            {!isUnlocked && !lecture.isFree && (
                              <span className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                                Locked
                              </span>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Lecture {index + 1}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No lectures available yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Video Preview & Purchase */}
            <Card className="sticky top-8">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Video Preview with Course Thumbnail */}
                  <div
                    className={`relative aspect-video bg-gray-900 rounded-lg overflow-hidden ${
                      firstFreeLecture
                        ? "cursor-pointer hover:scale-[1.02] transition-transform"
                        : ""
                    }`}
                  >
                    {firstFreeLecture && videoUrlToPlay ? (
                      <div className="w-full h-full">
                        <ReactPlayer
                          url={videoUrlToPlay}
                          width="100%"
                          height="100%"
                          controls={true}
                          light={course.thumbnail || "/default-course-thumbnail.svg"}
                          muted={false}
                          volume={1}
                          playsinline
                          pip={true}
                          onError={() => {
                            setVideoUrlToPlay(null);
                          }}
                          config={{
                            file: { attributes: { crossOrigin: "anonymous" } },
                          }}
                          style={{ backgroundColor: "#1a1a1a" }}
                        />
                      </div>
                    ) : (
                      <Image
                        src={
                          course.thumbnail || "/default-course-thumbnail.svg"
                        }
                        alt={course.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 33vw"
                        priority
                        className="object-cover z-10"
                      />
                    )}
                    {/* Overlay for free preview indication */}
                    {firstFreeLecture && videoUrlToPlay && (
                      <div className="absolute top-4 left-4 z-20">
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                          <PlayCircle className="w-4 h-4" />
                          Free Preview
                        </span>
                      </div>
                    )}
                    {firstFreeLecture && !videoUrlToPlay && (
                      <div className="absolute top-4 left-4 z-20">
                        <span className="bg-gray-700 text-white px-3 py-1 rounded-full text-sm font-medium">
                          Preview unavailable
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {course.price && course.price > 0
                        ? `$${course.price}`
                        : "Free"}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {course.price && course.price > 0
                        ? "Full lifetime access"
                        : "Free course access"}
                    </p>
                  </div>

                  {/* Purchase/Continue Button */}
                  <PurchaseCourseButton
                    courseId={course.id}
                    isEnrolled={isEnrolled}
                    isLoading={enrollmentLoading}
                    course={{
                      id: course.id,
                      title: course.title,
                      price: course.price,
                      thumbnail: course.thumbnail,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
