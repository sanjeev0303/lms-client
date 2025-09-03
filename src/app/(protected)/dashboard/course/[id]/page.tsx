"use client";

import { Button } from "@/components/ui/button";
import { courseService } from "@/lib/api/services";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  Clock,
  DollarSign,
  Download,
  Edit3,
  Eye,
  Menu,
  PlayCircle,
  Plus,
  Settings,
  Share2,
  Star,
  Target,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const DashboardCoursePage = () => {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { getToken } = useAuth();

  // Fetch existing course data
  const {
    data: courseData,
    isLoading: isLoadingCourse,
    error: courseError,
    refetch,
  } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const token = await getToken();
      const response = await courseService.getCourseById(
        courseId,
        token || undefined
      );
      return response.data;
    },
    enabled: !!courseId,
  });


  const course = courseData;

  useEffect(() => {
    refetch();
  }, [courseId]);

  // Use mock analytics data for now
  const realAnalyticsData = {
    totalEnrolled: 0,
    completionRate: 0,
    avgRating: 0,
    totalRevenue: 0,
    viewsThisMonth: 0,
    enrollmentsThisMonth: 0,
    recentActivity: [],
  };

  const recentActivity: any[] = [];

  if (isLoadingCourse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-black dark:to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-lg">
            Loading course data...
          </p>
        </div>
      </div>
    );
  }

  if (courseError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 dark:from-black dark:to-gray-900 flex items-center justify-center p-4">
        <div className="text-center bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg max-w-md w-full">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 dark:text-red-400 text-xl sm:text-2xl">
              ⚠
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Error Loading Course
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
            Failed to load course data. Please try again.
          </p>
        </div>
      </div>
    );
  }

  // Course is already defined above
  if (!course) return null;

  const StatCard = ({
    icon: Icon,
    title,
    value,
    change,
    color = "emerald",
  }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: string | number;
    change?: number;
    color?: string;
  }) => {
    const colorClasses = {
      emerald: {
        bg: "bg-emerald-100 dark:bg-emerald-900",
        text: "text-emerald-600 dark:text-emerald-400",
      },
      green: {
        bg: "bg-green-100 dark:bg-green-900",
        text: "text-green-600 dark:text-green-400",
      },
      yellow: {
        bg: "bg-yellow-100 dark:bg-yellow-900",
        text: "text-yellow-600 dark:text-yellow-400",
      },
      orange: {
        bg: "bg-orange-100 dark:bg-orange-900",
        text: "text-orange-600 dark:text-orange-400",
      },
      purple: {
        bg: "bg-purple-100 dark:bg-purple-900",
        text: "text-purple-600 dark:text-purple-400",
      },
      indigo: {
        bg: "bg-indigo-100 dark:bg-indigo-900",
        text: "text-indigo-600 dark:text-indigo-400",
      },
    };

    const currentColor =
      colorClasses[color as keyof typeof colorClasses] || colorClasses.emerald;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className={`p-2 sm:p-3 rounded-xl ${currentColor.bg}`}>
            <Icon className={`w-4 h-4 sm:w-6 sm:h-6 ${currentColor.text}`} />
          </div>
          {change !== undefined && (
            <span
              className={`text-xs sm:text-sm font-medium ${
                change > 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {change > 0 ? "+" : ""}
              {change}%
            </span>
          )}
        </div>
        <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
          {value}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
          {title}
        </p>
      </div>
    );
  };

  const TabButton = ({
    id,
    label,
    isActive,
    onClick,
  }: {
    id: string;
    label: string;
    isActive: boolean;
    onClick: (id: string) => void;
  }) => (
    <button
      onClick={() => onClick(id)}
      className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all text-xs sm:text-sm whitespace-nowrap ${
        isActive
          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-800"
          : "text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
      }`}
    >
      {label}
    </button>
  );

  const LectureItem = ({
    title,
    duration,
    views,
    isPublished,
  }: {
    title: string;
    duration: string;
    views: number;
    isPublished: boolean;
  }) => (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors gap-3 sm:gap-0">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 dark:bg-emerald-900 rounded-xl flex items-center justify-center flex-shrink-0">
          <PlayCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
            {title}
          </h4>
          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              {duration}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
              {views} views
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-2">
        <span
          className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
            isPublished
              ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
              : "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
          }`}
        >
          {isPublished ? "Published" : "Draft"}
        </span>
        <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors">
          <Edit3 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div>
        <Button
          variant={"link"}
          onClick={() => router.push("/dashboard/course")}
        >
          <div className="flex gap-1 items-center hover:underline">
            <span>
              {" "}
              <ArrowLeft />{" "}
            </span>
            <span>Back to Course</span>
          </div>
        </Button>
      </div>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-gray-100 dark:from-black dark:via-gray-900 dark:to-black">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-6 lg:py-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 sm:gap-4 lg:gap-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 lg:gap-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const placeholder = document.createElement("div");
                        placeholder.className =
                          "w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500";
                        placeholder.innerHTML =
                          '<svg class="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>';
                        target.parentElement!.appendChild(placeholder);
                      }}
                    />
                  ) : (
                    <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 dark:text-gray-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white truncate">
                      {course.title}
                    </h1>
                    <span
                      className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium self-start ${
                        course.isPublished
                          ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                          : "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                      }`}
                    >
                      {course.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-3 sm:mb-4 text-sm sm:text-base line-clamp-2">
                    {course.description}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-2 sm:gap-4 lg:gap-6 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                      {course.level || "Not specified"}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                      {course.category || "Uncategorized"}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-lg">₹</span>
                      <span className="ml-[1px]">{course.price || "0"}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                      Created {new Date(course.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <button className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg sm:rounded-xl transition-colors text-xs sm:text-sm">
                  <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  Share
                </button>
                <button className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg sm:rounded-xl transition-colors text-xs sm:text-sm">
                  <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                  Settings
                </button>
                <button
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 bg-emerald-600 text-white rounded-lg sm:rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 dark:shadow-emerald-800 text-xs sm:text-sm font-medium"
                  onClick={() =>
                    router.push(`/dashboard/course/edit-course/${courseId}`)
                  }
                >
                  <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                  Edit Course
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-6 lg:py-8">
          {/* Analytics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <StatCard
              icon={Users}
              title="Total Enrolled"
              value={realAnalyticsData.totalEnrolled.toLocaleString()}
              change={12}
              color="emerald"
            />
            <StatCard
              icon={TrendingUp}
              title="Completion Rate"
              value={`${realAnalyticsData.completionRate}%`}
              change={5}
              color="green"
            />
            <StatCard
              icon={Star}
              title="Average Rating"
              value={realAnalyticsData.avgRating}
              change={0.2}
              color="yellow"
            />
            <StatCard
              icon={DollarSign}
              title="Total Revenue"
              value={`₹${realAnalyticsData.totalRevenue.toLocaleString()}`}
              change={18}
              color="orange"
            />
            <StatCard
              icon={Eye}
              title="Views This Month"
              value={realAnalyticsData.viewsThisMonth.toLocaleString()}
              change={-3}
              color="purple"
            />
            <StatCard
              icon={Award}
              title="New Enrollments"
              value={realAnalyticsData.enrollmentsThisMonth}
              change={25}
              color="indigo"
            />
          </div>

          {/* Navigation Tabs */}
          <div className="relative mb-6 sm:mb-8">
            <div className="flex items-center gap-1 sm:gap-2 bg-white dark:bg-gray-800 p-1 sm:p-2 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-x-auto scrollbar-hide">
              <TabButton
                id="overview"
                label="Overview"
                isActive={activeTab === "overview"}
                onClick={setActiveTab}
              />
              <TabButton
                id="lectures"
                label="Lectures"
                isActive={activeTab === "lectures"}
                onClick={setActiveTab}
              />
              <TabButton
                id="students"
                label="Students"
                isActive={activeTab === "students"}
                onClick={setActiveTab}
              />
              <TabButton
                id="reviews"
                label="Reviews"
                isActive={activeTab === "reviews"}
                onClick={setActiveTab}
              />
              <TabButton
                id="analytics"
                label="Analytics"
                isActive={activeTab === "analytics"}
                onClick={setActiveTab}
              />
            </div>
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
            {/* Main Content */}
            <div className="xl:col-span-2 order-2 xl:order-1">
              {activeTab === "overview" && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Quick Stats */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
                      Course Performance
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                            Engagement Rate
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                            85%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-emerald-600 h-2 rounded-full transition-all"
                            style={{ width: "85%" }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                            Completion Rate
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                            78%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: "78%" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
                      Recent Activity
                    </h3>
                    {false ? ( // Analytics loading disabled for now
                      <div className="space-y-3 sm:space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="animate-pulse flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
                          >
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : recentActivity.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          No recent activity
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 sm:space-y-4">
                        {recentActivity.map((activity: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
                          >
                            <div
                              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                activity.type === "enrollment"
                                  ? "bg-emerald-100 dark:bg-emerald-900"
                                  : activity.type === "review"
                                  ? "bg-yellow-100 dark:bg-yellow-900"
                                  : activity.type === "completion"
                                  ? "bg-green-100 dark:bg-green-900"
                                  : "bg-gray-100 dark:bg-gray-600"
                              }`}
                            >
                              {activity.type === "enrollment" ? (
                                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
                              ) : activity.type === "review" ? (
                                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400" />
                              ) : activity.type === "completion" ? (
                                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                              ) : (
                                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                                  {activity.user}
                                </span>
                                <div className="flex items-center gap-2">
                                  {activity.type === "enrollment" && (
                                    <span className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                                      enrolled in the course
                                    </span>
                                  )}
                                  {activity.type === "review" && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                                        left a review
                                      </span>
                                      <div className="flex">
                                        {[...Array(activity.rating || 5)].map(
                                          (_, i) => (
                                            <Star
                                              key={i}
                                              className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400"
                                            />
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  {activity.type === "completion" && (
                                    <span className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                                      completed the course
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                {activity.time}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "lectures" && (
                <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                      Course Lectures
                    </h3>
                    <button
                      className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg sm:rounded-xl hover:bg-emerald-700 transition-colors text-xs sm:text-sm font-medium"
                      onClick={() =>
                        router.push(`/dashboard/course/${courseId}/lecture`)
                      }
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                      Add Lecture
                    </button>
                  </div>

                  {!course.lectures || course.lectures.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      <h4 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No lectures yet
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
                        Start building your course by adding your first lecture.
                      </p>
                      <button className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-emerald-600 text-white rounded-lg sm:rounded-xl hover:bg-emerald-700 transition-colors mx-auto text-xs sm:text-sm font-medium">
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        Create First Lecture
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {course.lectures.map((lecture: any, index: number) => (
                        <LectureItem
                          key={lecture.id || index}
                          title={
                            lecture.title ||
                            lecture.title ||
                            `Lecture ${index + 1}`
                          }
                          duration="10:30"
                          views={0}
                          isPublished={true}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {(activeTab === "students" ||
                activeTab === "reviews" ||
                activeTab === "analytics") && (
                <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="text-center py-8 sm:py-12">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h4 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {activeTab === "students"
                        ? "Student Management"
                        : activeTab === "reviews"
                        ? "Course Reviews"
                        : "Detailed Analytics"}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                      This section is coming soon with advanced features.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="xl:col-span-1 order-1 xl:order-2">
              <div className="space-y-4 sm:space-y-6">
                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    <button className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg sm:rounded-xl transition-colors">
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <span
                        className="font-medium text-gray-900 dark:text-white text-sm sm:text-base"
                        onClick={() =>
                          router.push(`/dashboard/course/${courseId}/lecture`)
                        }
                      >
                        Add New Lecture
                      </span>
                    </button>
                    <button
                      className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg sm:rounded-xl transition-colors"
                      onClick={() =>
                        router.push(`/dashboard/course/edit-course/${courseId}`)
                      }
                    >
                      <Edit3 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                        Edit Course Info
                      </span>
                    </button>
                    <button className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg sm:rounded-xl transition-colors">
                      <Download className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                      <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                        Export Data
                      </span>
                    </button>
                    <button className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg sm:rounded-xl transition-colors">
                      <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                      <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                        Share Course
                      </span>
                    </button>
                  </div>
                </div>

                {/* Course Info */}
                <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                    Course Details
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                        Course ID
                      </span>
                      <p className="font-mono text-xs sm:text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2 rounded-lg mt-1 break-all">
                        {courseId}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                        Last Updated
                      </span>
                      <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                        {new Date(
                          course.updatedAt || course.createdAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                        Status
                      </span>
                      <p
                        className={`font-medium text-sm sm:text-base ${
                          course.isPublished
                            ? "text-green-600 dark:text-green-400"
                            : "text-yellow-600 dark:text-yellow-400"
                        }`}
                      >
                        {course.isPublished ? "Published" : "Draft"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                        Total Lectures
                      </span>
                      <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                        {course.lectures ? course.lectures.length : 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Performance Summary - Mobile/Tablet only */}
                <div className="xl:hidden bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                    Quick Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {realAnalyticsData.totalEnrolled.toLocaleString()}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                        Students
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
                        {realAnalyticsData.completionRate}%
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                        Completion
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-lg sm:text-xl font-bold text-yellow-600 dark:text-yellow-400">
                        {realAnalyticsData.avgRating}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                        Rating
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-lg sm:text-xl font-bold text-orange-600 dark:text-orange-400">
                        ₹{realAnalyticsData.totalRevenue.toLocaleString()}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                        Revenue
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Menu Toggle - Only visible on smaller screens */}
                <div className="xl:hidden">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {sidebarOpen ? (
                      <>
                        <X className="w-4 h-4" />
                        Hide Details
                      </>
                    ) : (
                      <>
                        <Menu className="w-4 h-4" />
                        Show More Details
                      </>
                    )}
                  </button>
                </div>

                {/* Additional Info - Collapsible on mobile */}
                <div className={`xl:block ${sidebarOpen ? "block" : "hidden"}`}>
                  <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                      Recent Updates
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Course content updated
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            2 days ago
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            New student enrolled
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            1 week ago
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Course published
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            2 weeks ago
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Custom scrollbar styles for horizontal scroll */}
        <style jsx>{`
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          /* Custom responsive breakpoints */
          @media (max-width: 640px) {
            .scrollbar-hide {
              scrollbar-width: thin;
            }
          }

          /* Smooth animations */
          * {
            transition-property: background-color, border-color, color, fill,
              stroke, opacity, box-shadow, transform;
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
            transition-duration: 150ms;
          }

          /* Focus styles for accessibility */
          button:focus {
            outline: 2px solid #10b981;
            outline-offset: 2px;
          }

          /* Loading animation optimization */
          .animate-spin {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          /* Hover effects for better UX */
          @media (hover: hover) {
            .hover\\:shadow-md:hover {
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
                0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
          }

          /* Mobile touch optimizations */
          @media (max-width: 768px) {
            button {
              min-height: 44px; /* Minimum touch target size */
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default DashboardCoursePage;
