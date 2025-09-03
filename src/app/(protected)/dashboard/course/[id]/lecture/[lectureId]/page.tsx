"use client";

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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useDeleteLecture, useLectureById, useUpdateLecture } from "@/hooks/lecture/useLecture";
import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, Loader2, Play, Save, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const LectureEditPage = () => {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const lectureId = params.lectureId as string;

  // State for lecture data
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // API hooks
  const {
    data: lectureData,
    isLoading,
    error,
    refetch,
  } = useLectureById(lectureId);
  const updateMutation = useUpdateLecture(lectureId, courseId);
  const deleteMutation = useDeleteLecture(courseId);

  // Update state when lecture data is loaded
  useEffect(() => {
    if (lectureData) {
      console.log("Loading lecture data:", lectureData);
      setTitle(lectureData.title || "");
      setDescription(lectureData.description || "");
      setVideoUrl(lectureData.videoUrl || "");
      setIsFree(lectureData.isFree || false);
    }
    refetch();
  }, [lectureData, lectureId, refetch]);

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("video/")) {
        toast.error("Please select a valid video file");
        return;
      }

      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        toast.error("Video file size must be less than 100MB");
        return;
      }

      setVideoFile(file);
    }
  };

  const handleSaveLecture = async () => {
    if (!title.trim()) {
      toast.error("Please enter a lecture title");
      return;
    }

    // Create FormData for file upload if video file is present
    if (videoFile) {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("isFree", isFree.toString());
      formData.append("video", videoFile);

      // Use the service/mutation to handle upload (headers/timeouts are handled centrally)
      updateMutation.mutate(formData, {
        onSuccess: () => {
          router.push(`/dashboard/course/${courseId}/lecture`);
        },
      });
      return;
    }

    // Use regular JSON update if no file upload
    const lectureUpdateData = {
      title: title.trim(),
      description: description.trim(),
      videoUrl,
      isFree,
    };

    updateMutation.mutate(lectureUpdateData, {
      onSuccess: () => {
        router.push(`/dashboard/course/${courseId}/lecture`);
      },
    });
  };

  const handleDeleteLecture = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this lecture? This action cannot be undone."
      )
    ) {
      return;
    }

    deleteMutation.mutate(lectureId, {
      onSuccess: () => {
        router.push(`/dashboard/course/${courseId}/lecture`);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 mx-auto max-w-4xl px-6 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-300">
            Loading lecture...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 mx-auto max-w-4xl px-6 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 dark:text-red-400 text-2xl">⚠</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Failed to load lecture
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Unable to load the lecture data. Please try again.
            </p>
            <Button
              onClick={() =>
                router.push(`/dashboard/course/${courseId}/lecture`)
              }
            >
              Back to Lectures
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 mx-auto max-w-4xl px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push(`/dashboard/course/${courseId}/lecture`)}
            className="mb-4 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lectures
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Edit Lecture
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Update your lecture content and settings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="destructive"
            onClick={handleDeleteLecture}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
          <Button
            onClick={handleSaveLecture}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update the basic details of your lecture
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="lectureTitle" className="text-sm font-medium">
                  Lecture Title *
                </Label>
                <Input
                  id="lectureTitle"
                  type="text"
                  placeholder="Enter lecture title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="lectureDescription"
                  className="text-sm font-medium"
                >
                  Description
                </Label>
                <Textarea
                  id="lectureDescription"
                  placeholder="Describe what students will learn in this lecture"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Video Content */}
          <Card>
            <CardHeader>
              <CardTitle>Video Content</CardTitle>
              <CardDescription>
                Upload or update the video for this lecture
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Video */}
              {videoUrl && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Current Video</Label>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Play className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                      Video uploaded
                    </span>
                    <Button variant="outline" size="sm">
                      Preview
                    </Button>
                  </div>
                </div>
              )}

              {/* Video URL Input */}
              <div className="space-y-2">
                <Label htmlFor="videoUrl" className="text-sm font-medium">
                  Video URL (Optional)
                </Label>
                <Input
                  id="videoUrl"
                  type="url"
                  placeholder="https://example.com/video.mp4"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="h-12"
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="videoFile" className="text-sm font-medium">
                  Upload New Video
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="videoFile"
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileChange}
                    className="h-12"
                  />
                  {videoFile && (
                    <span className="text-sm text-green-600 dark:text-green-400">
                      {videoFile.name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Supported formats: MP4, WebM, MOV. Max size: 100MB
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Lecture Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Configure lecture accessibility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isFree" className="text-sm font-medium">
                    Lecture Access
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {isFree
                      ? "Free - Students can watch this lecture for free"
                      : "Premium - Students need to purchase the course"}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-sm font-medium px-2 py-1 rounded ${
                        isFree
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      }`}
                    >
                      {isFree ? "Free" : "Premium"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Switch
                    id="isFree"
                    checked={isFree}
                    onCheckedChange={setIsFree}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {isFree ? "Free" : "Premium"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lecture Info */}
          <Card>
            <CardHeader>
              <CardTitle>Lecture Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lectureData && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Current Title
                  </span>
                  <p className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
                    {lectureData.title || "No title"}
                  </p>
                </div>
              )}
              {lectureData && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Current Status
                  </span>
                  <p className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
                    {lectureData.isFree ? "Free Lecture" : "Premium Lecture"}
                  </p>
                </div>
              )}
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Lecture ID
                </span>
                <p className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 break-all">
                  {lectureId}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Course ID
                </span>
                <p className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 break-all">
                  {courseId}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LectureEditPage;
