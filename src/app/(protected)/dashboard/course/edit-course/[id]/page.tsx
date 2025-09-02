"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams } from "next/navigation";
import EditCourseTab from "../../_components/edit-course-tab";

const CourseEditPage = () => {
  const { id } = useParams();

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-bold text-xl">
          Add detail information regarding course.
        </h1>
        <Link href={`/dashboard/course/${id}/lecture`}>
          <Button variant={"link"} className="text-lg hover:text-blue-600">
            Go to lecture
          </Button>
        </Link>
      </div>
      <EditCourseTab />
    </div>
  );
};

export default CourseEditPage;
