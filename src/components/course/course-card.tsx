import { Course } from "@/types/api";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";


interface CourseCardProps {
  course?: Course;
  priority?: boolean;
}

const CourseCard = ({ course, priority = false }: CourseCardProps) => {
  // Default values if no course is provided (for backward compatibility)
  const defaultCourse = {
    title: "NextJs Complete Course in Hindi",
    thumbnail:
      "/default-course-thumbnail.svg",
    creator: {
      id: "default",
      name: "Instructor Name",
      email: "instructor@example.com",
    },
    level: "BEGINNER" as const,
    price: 499,
  };

  const displayCourse = course || defaultCourse;

  const instructorName =
    (displayCourse.creator as any)?.name ||
    `${(displayCourse.creator as any)?.firstName || ""} ${(displayCourse.creator as any)?.lastName || ""}`.trim() ||
    "Instructor";

  const instructorAvatar =
    (displayCourse.creator as any)?.photoUrl ||
    (displayCourse.creator as any)?.imageUrl ||
    (displayCourse.creator as any)?.avatar ||
    undefined;

  return (
    <Link href={course ? `/course-detail/${course.id}` : "#"} className="block">
      <div className="w-full max-w-sm mx-auto overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200 dark:border-gray-700">
        {/* Course Image */}
        <div className="relative w-full h-48 overflow-hidden">
          <Image
            src={displayCourse.thumbnail || defaultCourse.thumbnail}
            alt={displayCourse.title}
            fill
            className="object-cover transition-transform duration-300 hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={priority}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        <div className="p-4 space-y-5">
          {/* Course Title */}
          <h1 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer leading-tight hover:underline">
            {displayCourse.title}
          </h1>

          {/* Course Subtitle */}
          {(displayCourse as Course).subTitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {(displayCourse as Course).subTitle}
            </p>
          )}

          {/* Course Stats */}
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            {((displayCourse as Course).lectures ||
              (displayCourse as Course)._count?.lectures) && (
              <div className="flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span>
                  {Array.isArray((displayCourse as Course).lectures)
                    ? (displayCourse as Course).lectures?.length
                    : (displayCourse as Course)._count?.lectures || 0}{" "}
                  lectures
                </span>
              </div>
            )}
            {(displayCourse as Course)._count?.enrollments && (
              <div className="flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                  />
                </svg>
                <span>
                  {(displayCourse as Course)._count?.enrollments} students
                </span>
              </div>
            )}
          </div>

          {/* Instructor Info and Badge */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage
                  src={instructorAvatar}
                  alt={`${instructorName} avatar`}
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.src = "/default-course-thumbnail.svg";
                  }}
                />
                <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs font-medium">
                  {instructorName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-600 dark:text-gray-300 truncate font-medium">
                {instructorName}
              </span>
            </div>

            <Badge className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap">
              {displayCourse.level?.toLowerCase().replace("_", " ") ||
                "Beginner"}
            </Badge>
          </div>

          {/* Price and Rating */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                ₹{displayCourse.price || 0}
              </span>
              {displayCourse.price && displayCourse.price > 0 && (
                <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                  ₹{Math.round((displayCourse.price || 0) * 1.5)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <svg
                className="w-4 h-4 text-yellow-400 fill-current"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                4.5
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
