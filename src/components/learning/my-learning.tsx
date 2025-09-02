"use client";

import { Button } from "@/components/ui/button";
import { useEnrolledCourses } from "@/hooks/course/useCourse";
import { useRouter } from "next/navigation";
import CourseCard from "../course/course-card";
import LearningSkeleton from "./learning-skeleton";

const LearningPage = () => {
  const router = useRouter();
  const { data: enrolledCourses, isLoading } = useEnrolledCourses();

  const handleBrowseCourses = () => {
    router.push("/");
  };

  const handleExploreCourses = () => {
    router.push("/");
  };

  return (
    <div className="max-w-5xl mx-auto my-12 px-4 md:px-0">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-bold text-3xl text-gray-800 tracking-tight dark:text-gray-200">
          My Learning
        </h1>
        <Button
          onClick={handleBrowseCourses}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition dark:bg-gray-600 dark:text-gray-200"
        >
          Browse Courses
        </Button>
      </div>
      <div className="my-5">
        {isLoading ? (
          <LearningSkeleton />
        ) : !enrolledCourses || enrolledCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-lg shadow dark:bg-background">
            <p className="text-lg text-gray-500 mb-4 dark:text-gray-200">
              You are not enrolled in any course.
            </p>
            <Button
              onClick={handleExploreCourses}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Explore Courses
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8 grid-cols-1">
            {enrolledCourses.map((course: any) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningPage;
