"use client"

import { usePublishedCourses } from "@/hooks/course/useCourse";
import { Course } from "@/types/api";
import CourseCard from "./course-card";
import { CourseCardSkeleton } from "@/components/ui/enhanced-skeleton";

const CoursesSection = () => {
  const { data: courses, isLoading, error } = usePublishedCourses();

  if (error) {
    return (
      <section className="bg-background">
        <div className="max-w-7xl mx-auto p-6">
          <h2 className="font-bold text-3xl text-center mb-10">Our Courses</h2>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Failed to load courses. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <h2 className="font-bold text-3xl text-center mb-10">Our Courses</h2>
        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-8 grid-cols-1 loading-container">
            {Array.from({ length: 6 }).map((_, index) => (
              <CourseCardSkeleton key={index} />
            ))}
          </div>
        ) : courses && courses.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-8 grid-cols-1">
            {courses.map((course: Course, idx: number) => (
              <CourseCard key={course.id} course={course} priority={idx === 0} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No published courses available at the moment.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default CoursesSection;
