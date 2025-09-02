"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useCreatorCourses } from "@/hooks/course/useCourse";
import { Course } from "@/types/api";
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from "@tanstack/react-table";
import {
    ArrowDownRight,
    ArrowUpRight,
    BookOpen,
    Calendar,
    ChevronLeft,
    ChevronRight,
    DollarSign,
    TrendingUp,
    Users
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const DashboardPage = () => {
  // Fetch real course data
  const {
    data: courses = [],
    isLoading,
    isError,
    error,
  } = useCreatorCourses();

  // Calculate real dashboard stats
  const dashboardStats = useMemo(() => {
    const totalCourses = courses.length;
    const publishedCourses = courses.filter((course: Course) => course.isPublished).length;
    const draftCourses = totalCourses - publishedCourses;
    const totalLectures = courses.reduce((acc: number, course: Course) => acc + (course.lectures?.length || 0), 0);
    const totalEnrolledStudents = courses.reduce((acc: number, course: Course) => {
      return acc + (course._count?.enrollments || 0);
    }, 0);
    const totalRevenue = courses.reduce((acc: number, course: Course) => {
      return acc + (course.revenue || 0);
    }, 0);

    return [
      {
        title: "Total Revenue",
        value: `₹${totalRevenue.toLocaleString()}`,
        change: `+₹${totalRevenue.toLocaleString()}`,
        changeType: (totalRevenue > 0 ? "positive" : "neutral") as "positive" | "negative" | "neutral",
        icon: DollarSign,
        color: "green",
      },
      {
        title: "Total Students",
        value: totalEnrolledStudents.toString(),
        change: `${totalEnrolledStudents > 0 ? '+' : ''}${totalEnrolledStudents}`,
        changeType: (totalEnrolledStudents > 0 ? "positive" : "neutral") as "positive" | "negative" | "neutral",
        icon: Users,
        color: "blue",
      },
      {
        title: "Total Courses",
        value: totalCourses.toString(),
        change: "+0%", // We'll need historical data to calculate this properly
        changeType: "neutral" as "positive" | "negative" | "neutral",
        icon: BookOpen,
        color: "purple",
      },
      {
        title: "Published Courses",
        value: publishedCourses.toString(),
        change: `${publishedCourses > 0 ? '+' : ''}${publishedCourses}`,
        changeType: (publishedCourses > 0 ? "positive" : "neutral") as "positive" | "negative" | "neutral",
        icon: TrendingUp,
        color: "orange",
      },
    ];
  }, [courses]);

  const columnHelper = createColumnHelper<Course>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: "Course",
        cell: (info) => (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-medium">{info.getValue()}</div>
              <div className="text-sm text-muted-foreground">
                {info.row.original.category}
              </div>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("lectures", {
        header: "Lectures",
        cell: (info) => (
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <span>{info.getValue()?.length || 0}</span>
          </div>
        ),
      }),
      columnHelper.accessor("_count", {
        header: "Students",
        cell: (info) => (
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">
              {info.getValue()?.enrollments || 0}
            </span>
            <span className="text-xs text-muted-foreground">enrolled</span>
          </div>
        ),
      }),
      columnHelper.accessor("level", {
        header: "Level",
        cell: (info) => {
          const level = info.getValue();
          if (!level) return <span className="text-muted-foreground">-</span>;
          return (
            <Badge variant="outline" className="capitalize">
              {level.toLowerCase()}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("isPublished", {
        header: "Status",
        cell: (info) => (
          <Badge
            variant={info.getValue() ? "default" : "secondary"}
            className={
              info.getValue()
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }
          >
            {info.getValue() ? "Published" : "Draft"}
          </Badge>
        ),
      }),
      columnHelper.accessor("price", {
        header: "Price",
        cell: (info) => (
          <span className="font-medium">
            {info.getValue() ? `₹${info.getValue()}` : "Free"}
          </span>
        ),
      }),
      columnHelper.accessor("revenue", {
        header: "Revenue",
        cell: (info) => (
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-green-600">
              ₹{(info.getValue() || 0).toLocaleString()}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor("updatedAt", {
        header: "Last Updated",
        cell: (info) => (
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              {new Date(info.getValue()).toLocaleDateString()}
            </span>
          </div>
        ),
      }),
    ],
    [columnHelper]
  );

  const [sorting, setSorting] = useState<SortingState>([]);
  const [filtering, setFiltering] = useState("");

  const table = useReactTable({
    data: courses,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      globalFilter: filtering,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFiltering,
  });

  return (
    <div className="min-h-screen">
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's what's happening with your courses.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button asChild>
              <Link href="/dashboard/course/create">
                <BookOpen className="w-4 h-4 mr-2" />
                Create Course
              </Link>
            </Button>
          </div>
        </div>

        {/* Error State */}
        {isError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="text-red-800">
                Error loading dashboard data: {error?.message || "Unknown error"}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Stats Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <div className="flex items-center space-x-1 text-sm">
                          {stat.changeType === "positive" ? (
                            <ArrowUpRight className="w-4 h-4 text-green-500" />
                          ) : stat.changeType === "negative" ? (
                            <ArrowDownRight className="w-4 h-4 text-red-500" />
                          ) : (
                            <div className="w-4 h-4" />
                          )}
                          <span
                            className={
                              stat.changeType === "positive"
                                ? "text-green-600"
                                : stat.changeType === "negative"
                                ? "text-red-600"
                                : "text-gray-600"
                            }
                          >
                            {stat.change}
                          </span>
                          <span className="text-muted-foreground">
                            {stat.title === "Total Revenue" ? "earned" :
                             stat.title === "Total Students" ? "enrolled" :
                             "courses"}
                          </span>
                        </div>
                      </div>
                      <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                        <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Courses Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Course Management</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage and track all your courses
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  value={filtering}
                  onChange={(e) => setFiltering(e.target.value)}
                  placeholder="Search courses..."
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse flex space-x-4">
                    <div className="rounded-lg bg-gray-200 h-10 w-10"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="text-center py-8">
                <div className="text-red-600 mb-2">Failed to load courses</div>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead key={header.id} className="font-semibold">
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                          <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                            className="hover:bg-gray-50"
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={columns.length}
                            className="h-24 text-center"
                          >
                            {courses.length === 0 ? (
                              <div className="flex flex-col items-center justify-center space-y-3">
                                <BookOpen className="w-12 h-12 text-gray-400" />
                                <div>
                                  <p className="text-lg font-medium text-gray-900">No courses yet</p>
                                  <p className="text-sm text-gray-500">Get started by creating your first course</p>
                                </div>
                                <Button asChild>
                                  <Link href="/dashboard/course/create">
                                    Create Course
                                  </Link>
                                </Button>
                              </div>
                            ) : (
                              "No courses found."
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing{" "}
                    {table.getState().pagination.pageIndex *
                      table.getState().pagination.pageSize +
                      1}{" "}
                    to{" "}
                    {Math.min(
                      (table.getState().pagination.pageIndex + 1) *
                        table.getState().pagination.pageSize,
                      table.getFilteredRowModel().rows.length
                    )}{" "}
                    of {table.getFilteredRowModel().rows.length} courses
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
