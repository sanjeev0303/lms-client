"use client";

import TextEditor from "@/components/global/text-editor";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { courseService } from "@/lib/api/services";
import { UpdateCourseFormData } from "@/types/api";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const EditCourseTab = () => {
  const params = useParams();
  const courseId = params.id as string;
  const router = useRouter();
  const { getToken } = useAuth();

  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [courseTitle, setCourseTitle] = useState<string>("");
  const [courseSubtitle, setCourseSubtitle] = useState<string>("");
  const [courseDescription, setCourseDescription] = useState<string>("");
  const [courseCategory, setCourseCategory] = useState<string>("");
  const [courseLevel, setCourseLevel] = useState<string>("");
  const [coursePrice, setCoursePrice] = useState<string>("");
  const [courseThumbnail, setCourseThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [originalData, setOriginalData] = useState<any>(null);

  // Fetch existing course data
  const {
    data: courseData,
    isLoading: isLoadingCourse,
    error: courseError,
  } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      console.log('🔍 EditCourseTab: Fetching course data for ID:', courseId);
      const token = await getToken();
      console.log('🔑 EditCourseTab: Token available:', !!token);

      try {
        const response = await courseService.getCourseById(
          courseId,
          token || undefined
        );
        console.log('✅ EditCourseTab: Course data fetched successfully:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ EditCourseTab: Error fetching course data:', error);
        throw error;
      }
    },
    enabled: !!courseId,
  });

  // Populate form with existing data when courseData is loaded
  useEffect(() => {
    if (courseData) {
      setOriginalData(courseData);
      setIsPublished(courseData.isPublished || false);
      setCourseTitle(courseData.title || "");
      setCourseSubtitle(courseData.subTitle || "");
      setCourseDescription(courseData.description || "");
      setCourseCategory(courseData.category || "");
      setCourseLevel(courseData.level || "");
      setCoursePrice(courseData.price ? courseData.price.toString() : "");
      setThumbnailPreview(courseData.thumbnail || "");
    }
  }, [courseData]);

  interface CourseData {
    isPublished?: boolean;
    courseTitle?: string;
    courseSubtitle?: string;
    courseDescription?: string;
    courseCategory?: string;
    courseLevel?: string;
    coursePrice?: string;
    courseThumbnail?: File | null;
  }

  const { mutate, isPending, error } = useMutation({
    mutationFn: async (data: CourseData) => {
      console.log('🚀 EditCourseTab: Starting course update mutation:', data);

      // Convert form data to UpdateCourseFormData interface
      const updateData: UpdateCourseFormData = {
        title: data.courseTitle,
        subTitle: data.courseSubtitle, // Added missing subTitle
        description: data.courseDescription,
        category: data.courseCategory,
        level: data.courseLevel, // Added missing level
        price: data.coursePrice,
        isPublished: data.isPublished?.toString(),
        thumbnail: data.courseThumbnail || undefined,
      };

      console.log('📋 EditCourseTab: Processed update data:', {
        ...updateData,
        thumbnail: updateData.thumbnail ? `File: ${updateData.thumbnail.name}` : 'No file'
      });

      const token = await getToken();
      console.log('🔑 EditCourseTab: Token available for update:', !!token);

      try {
        const response = await courseService.updateCourse(
          courseId,
          updateData,
          token || undefined
        );
        console.log('✅ EditCourseTab: Course updated successfully:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ EditCourseTab: Error updating course:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success("success", {
        description: "Course edited successfully!",
      });
      router.push("/dashboard/course");
    },
    onError: (error) => {
      console.error("Error updating course:", error);

      // More detailed error logging
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        toast.error("Error", {
          description: `Course update failed: ${error.message}`,
        });
      } else {
        console.error("Unknown error:", error);
        toast.error("Error", {
          description: "Course update failed! Please check your input and try again.",
        });
      }
    },
  });

  const handlePublishToggle = (checked: boolean) => {
    setIsPublished(checked);
  };

  const handleThumbnailChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setCourseThumbnail(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeThumbnail = () => {
    setCourseThumbnail(null);
    setThumbnailPreview("");
    // Reset the file input
    const fileInput = document.getElementById(
      "course-thumbnail"
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  }

  const handleSave = () => {
    // Only include fields that have changed from original data
    const hasChanges = {
      isPublished: originalData
        ? isPublished !== originalData.isPublished
        : isPublished !== false,
      courseTitle: originalData
        ? courseTitle !== originalData.title
        : courseTitle !== "",
      courseSubtitle: originalData
        ? courseSubtitle !== originalData.subTitle
        : courseSubtitle !== "",
      courseDescription: originalData
        ? courseDescription !== originalData.description
        : courseDescription !== "",
      courseCategory: originalData
        ? courseCategory !== originalData.category
        : courseCategory !== "",
      courseLevel: originalData
        ? courseLevel !== originalData.level
        : courseLevel !== "",
      coursePrice: originalData
        ? coursePrice !== originalData.price?.toString()
        : coursePrice !== "",
      courseThumbnail: courseThumbnail !== null,
    };

    // Build the data object with only changed fields
    const courseData: CourseData = {};

    if (hasChanges.isPublished) courseData.isPublished = isPublished;
    if (hasChanges.courseTitle) courseData.courseTitle = courseTitle;
    if (hasChanges.courseSubtitle) courseData.courseSubtitle = courseSubtitle;
    if (hasChanges.courseDescription)
      courseData.courseDescription = courseDescription;
    if (hasChanges.courseCategory) courseData.courseCategory = courseCategory;
    if (hasChanges.courseLevel) courseData.courseLevel = courseLevel;
    if (hasChanges.coursePrice) courseData.coursePrice = coursePrice;
    if (hasChanges.courseThumbnail)
      courseData.courseThumbnail = courseThumbnail;

    // Check if there are any changes to save
    const hasAnyChanges = Object.keys(courseData).length > 0;
    if (!hasAnyChanges) {
      toast.info("No changes detected", {
        description: "No modifications were made to the course.",
      });
      return;
    }

    // Log the data for debugging
    console.log("course data: ", {
      ...courseData,
      courseThumbnail: courseThumbnail
        ? {
            name: courseThumbnail.name,
            size: courseThumbnail.size,
            type: courseThumbnail.type,
            lastModified: courseThumbnail.lastModified,
          }
        : null,
      thumbnailPreview,
      timestamp: new Date().toISOString(),
      changesDetected: hasChanges,
    });

    // Call the mutation
    mutate(courseData);
  };

  return (
    <div className="space-y-6">
      {isLoadingCourse ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading course data...</p>
          </div>
        </div>
      ) : courseError ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p className="text-sm">
            <strong>Error:</strong> Failed to load course data. Please try
            refreshing the page.
          </p>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Course Settings</CardTitle>
                <CardDescription>
                  Configure your course visibility and publication status
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="publish-switch" className="text-sm font-medium">
                  {isPublished ? "Published" : "Draft"}
                </Label>
                <Switch
                  id="publish-switch"
                  checked={isPublished}
                  onCheckedChange={handlePublishToggle}
                />
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Basic Course Information</CardTitle>
              <CardDescription>
                Make changes to your course here. Click save when you're done
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="course-title">Course Title *</Label>
                  <Input
                    id="course-title"
                    placeholder="Enter course title"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course-subtitle">Course Subtitle</Label>
                  <Input
                    id="course-subtitle"
                    placeholder="Enter course subtitle"
                    value={courseSubtitle}
                    onChange={(e) => setCourseSubtitle(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="course-description">Course Description</Label>
                <TextEditor
                  value={courseDescription}
                  onChange={(value) => setCourseDescription(value)}
                  placeholder="Start writing your course description..."
                  className=""
                  readOnly={false}
                  preview="live"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course-thumbnail">Course Thumbnail</Label>
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center space-x-4">
                    <Input
                      id="course-thumbnail"
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                    {courseThumbnail && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeThumbnail}
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  {thumbnailPreview && (
                    <div className="relative w-48 h-32 rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={thumbnailPreview}
                        alt="Course thumbnail preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={removeThumbnail}
                          className="h-6 w-6 p-0"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground">
                    Upload an image file (PNG, JPG, GIF). Recommended size:
                    800x450px
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="course-category">Category</Label>
                  <Select
                    value={courseCategory}
                    onValueChange={setCourseCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="web-development">
                        Web Development
                      </SelectItem>
                      <SelectItem value="mobile-development">
                        Mobile Development
                      </SelectItem>
                      <SelectItem value="data-science">Data Science</SelectItem>
                      <SelectItem value="machine-learning">
                        Machine Learning
                      </SelectItem>
                      <SelectItem value="cybersecurity">
                        Cybersecurity
                      </SelectItem>
                      <SelectItem value="ui-ux-design">UI/UX Design</SelectItem>
                      <SelectItem value="digital-marketing">
                        Digital Marketing
                      </SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course-level">Level</Label>
                  <Select value={courseLevel} onValueChange={setCourseLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BEGINNER">Beginner</SelectItem>
                      <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                      <SelectItem value="ADVANCE">Advance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course-price">Price ($)</Label>
                  <Input
                    id="course-price"
                    type="number"
                    placeholder="0.00"
                    value={coursePrice}
                    onChange={(e) => setCoursePrice(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  <p className="text-sm">
                    <strong>Error:</strong>{" "}
                    {error instanceof Error
                      ? error.message
                      : "An error occurred while saving the course."}
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/course")}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={
                    isPending ||
                    !courseTitle.trim() ||
                    !courseCategory ||
                    !courseLevel
                  }
                  className="text-gray-900"
                >
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default EditCourseTab;
