'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { lectureService, courseService, progressService } from '@/lib/api/services'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Lock, PlayCircle, CheckCircle2 } from 'lucide-react'
import { Lecture, Course, LectureProgress, CourseProgress } from '@/types/api'

export default function LecturePage() {
  const { courseId, lectureId } = useParams()
  const router = useRouter()
  const { isSignedIn, getToken } = useAuth()

  const [lecture, setLecture] = useState<Lecture | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [progress, setProgress] = useState<CourseProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const token = isSignedIn ? await getToken() : undefined

        // Fetch lecture details
        const lectureResponse = await lectureService.getLectureById(lectureId as string, token || undefined)
        setLecture(lectureResponse.data)

        // Fetch course details
        const courseResponse = await courseService.getCourseById(courseId as string, token || undefined)
        setCourse(courseResponse.data)

        // Fetch progress (only if signed in)
        if (isSignedIn && token) {
          try {
            const progressResponse = await progressService.getCourseProgress(courseId as string, token)
            setProgress(progressResponse.data || null)
          } catch (progressError) {
            console.log('No progress data available')
            setProgress(null)
          }
        }

      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load lecture')
      } finally {
        setLoading(false)
      }
    }

    if (courseId && lectureId) {
      fetchData()
    }
  }, [courseId, lectureId, isSignedIn])

  const currentProgress = progress?.lectures?.find(p => p.lectureId === lectureId)
  const canAccess = lecture?.isFree || currentProgress?.isCompleted || (lecture?.isFree ?? false)

  const handleCompleteLesson = async () => {
    if (!isSignedIn || !lectureId || !courseId) return

    try {
      setCompleting(true)
      const token = await getToken()
      await progressService.updateLectureProgress(lectureId as string, { isCompleted: true }, token || undefined)

      // Update local progress state
      setProgress(prev => {
        if (!prev || !prev.lectures) return prev
        return {
          ...prev,
          lectures: prev.lectures.map(p =>
            p.lectureId === lectureId
              ? { ...p, isCompleted: true }
              : p
          )
        }
      })
    } catch (error) {
      console.error('Error completing lecture:', error)
      setError('Failed to mark lecture as complete')
    } finally {
      setCompleting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!lecture || !course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-600 mb-4">Lecture not found</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/course-detail/${courseId}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Course
        </Button>

        <h1 className="text-3xl font-bold mb-2">{lecture.title}</h1>
        <p className="text-gray-600">{course.title}</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Video Player */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              {canAccess ? (
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  {lecture.videoUrl ? (
                    <video
                      controls
                      className="w-full h-full"
                      src={lecture.videoUrl}
                      poster="/video-placeholder.jpg"
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="flex items-center justify-center h-full text-white">
                      <div className="text-center">
                        <PlayCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>Video will be available soon</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Lock className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">This lecture is locked</h3>
                    <p className="text-gray-600 mb-4">
                      {!isSignedIn
                        ? 'Sign in and enroll in this course to access this lecture'
                        : 'Complete previous lectures or enroll in this course to unlock'
                      }
                    </p>
                    {!isSignedIn && (
                      <Button onClick={() => router.push('/login')}>
                        Sign In
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lecture Description */}
          {lecture.description && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>About this Lecture</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{lecture.description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Lecture Info */}
          <Card>
            <CardHeader>
              <CardTitle>Lecture Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                {lecture.isFree ? (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                    Free
                  </span>
                ) : (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                    Premium
                  </span>
                )}
              </div>

              {isSignedIn && currentProgress && (
                <div className="flex items-center gap-2">
                  {currentProgress.isCompleted ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 text-sm">Completed</span>
                    </>
                  ) : (
                    <>
                      <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
                      <span className="text-gray-600 text-sm">Not completed</span>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              {canAccess && isSignedIn && !currentProgress?.isCompleted && (
                <Button
                  className="w-full mb-3"
                  onClick={handleCompleteLesson}
                  disabled={completing}
                >
                  {completing ? 'Marking Complete...' : 'Mark as Complete'}
                </Button>
              )}

              {!isSignedIn && (
                <div className="space-y-3">
                  <Button
                    className="w-full"
                    onClick={() => router.push('/login')}
                  >
                    Sign In to Track Progress
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/course-detail/${courseId}`)}
                  >
                    View Course Details
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
