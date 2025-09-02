"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateCourse } from "@/hooks/course/useCourse";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const CreateCoursePage = () => {
  const router = useRouter();
  const [courseTitle, setCourseTitle] = useState("");
  const [category, setCategory] = useState("");

  const { mutate, isPending } = useCreateCourse();

  const handleCreateCourse = () => {
    const courseData = {
      title: courseTitle,
      category: category,
    };
    mutate(courseData);
  };

  const getSelectedCategory = (value: string) => {
    setCategory(value);
  };

  return (
    <div className="flex-1 mx-auto max-w-2xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Create Your Course
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Add course details to get started with your new course
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="space-y-6">
          {/* Course Title Section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              Course Title
              <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              name="courseTitle"
              placeholder="Enter your course name"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              className="h-12 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 transition-colors"
            />
          </div>

          {/* Category Section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              Course Category
              <span className="text-red-500">*</span>
            </Label>
            <Select onValueChange={getSelectedCategory}>
              <SelectTrigger className="w-full h-12 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 transition-colors">
                <SelectValue placeholder="Select a course category" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                <SelectGroup>
                  <SelectLabel className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide px-2 py-1">
                    Categories
                  </SelectLabel>

                  {/* Web Development */}
                  <SelectItem
                    value="frontend-development"
                    className="py-3 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    🌐 Frontend Development
                  </SelectItem>
                  <SelectItem
                    value="backend-development"
                    className="py-3 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    ⚙️ Backend Development
                  </SelectItem>
                  <SelectItem
                    value="fullstack-development"
                    className="py-3 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    🔗 Full Stack Development
                  </SelectItem>
                  <SelectItem
                    value="react-development"
                    className="py-3 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    ⚛️ React Development
                  </SelectItem>
                  <SelectItem
                    value="nodejs-development"
                    className="py-3 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    🟢 Node.js Development
                  </SelectItem>
                  <SelectItem
                    value="javascript-fundamentals"
                    className="py-3 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    📝 JavaScript Fundamentals
                  </SelectItem>
                  <SelectItem
                    value="web-apis"
                    className="py-3 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    🔌 Web APIs & Integration
                  </SelectItem>

                  {/* AI & Machine Learning */}
                  <SelectItem
                    value="machine-learning"
                    className="py-3 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    🤖 Machine Learning
                  </SelectItem>
                  <SelectItem
                    value="deep-learning"
                    className="py-3 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    🧠 Deep Learning
                  </SelectItem>
                  <SelectItem
                    value="artificial-intelligence"
                    className="py-3 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    🤖 Artificial Intelligence
                  </SelectItem>
                  <SelectItem
                    value="nlp"
                    className="py-3 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    💬 Natural Language Processing
                  </SelectItem>
                  <SelectItem
                    value="computer-vision"
                    className="py-3 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    👁️ Computer Vision
                  </SelectItem>
                  <SelectItem
                    value="generative-ai"
                    className="py-3 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    ✨ Generative AI
                  </SelectItem>
                  <SelectItem
                    value="llm-development"
                    className="py-3 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    🔤 LLM Development
                  </SelectItem>
                  <SelectItem
                    value="ai-ethics"
                    className="py-3 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    ⚖️ AI Ethics & Safety
                  </SelectItem>

                  {/* Other Categories */}
                  <SelectItem
                    value="mobile-development"
                    className="py-3 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    📱 Mobile Development
                  </SelectItem>
                  <SelectItem
                    value="data-science"
                    className="py-3 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    📊 Data Science
                  </SelectItem>
                  <SelectItem
                    value="cybersecurity"
                    className="py-3 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    🔒 Cybersecurity
                  </SelectItem>
                  <SelectItem
                    value="ui-ux-design"
                    className="py-3 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    🎨 UI/UX Design
                  </SelectItem>
                  <SelectItem
                    value="digital-marketing"
                    className="py-3 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    📈 Digital Marketing
                  </SelectItem>
                  <SelectItem
                    value="business"
                    className="py-3 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    💼 Business
                  </SelectItem>
                  <SelectItem
                    value="cloud-computing"
                    className="py-3 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    ☁️ Cloud Computing
                  </SelectItem>
                  <SelectItem
                    value="devops"
                    className="py-3 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    🔧 DevOps
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
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
            onClick={handleCreateCourse}
            disabled={isPending}
            className="flex-1 sm:flex-none h-12 px-8 text-base font-medium bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                <span>Creating Course...</span>
              </>
            ) : (
              <>
                <span>Create Course</span>
                <span className="ml-2">→</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateCoursePage;
