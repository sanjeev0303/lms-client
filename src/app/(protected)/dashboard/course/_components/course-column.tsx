import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Course } from "@/types/api";
import { Checkbox } from "@radix-ui/react-checkbox";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  BookOpen,
  Calendar,
  Edit,
  Eye,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import Link from "next/link";

interface CourseColumnsProps {
  onDeleteCourse?: (courseId: string) => void;
}

export const createColumns = ({
  onDeleteCourse,
}: CourseColumnsProps = {}): ColumnDef<Course>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Course Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-medium">{row.getValue("title")}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.category}
          </div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "isPublished",
    header: "Status",
    cell: ({ row }) => {
      const isPublished = row.getValue("isPublished") as boolean;
      return (
        <Badge
          variant={isPublished ? "default" : "secondary"}
          className={
            isPublished
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }
        >
          {isPublished ? "Published" : "Draft"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "level",
    header: "Level",
    cell: ({ row }) => {
      const level = row.getValue("level") as string;
      if (!level) return <span className="text-muted-foreground">-</span>;

      const levelColors = {
        BEGINNER: "bg-green-100 text-green-800",
        INTERMEDIATE: "bg-yellow-100 text-yellow-800",
        ADVANCED: "bg-red-100 text-red-800",
      };

      return (
        <Badge
          className={
            levelColors[level as keyof typeof levelColors] ||
            "bg-gray-100 text-gray-800"
          }
        >
          {level.toLowerCase()}
        </Badge>
      );
    },
  },
  {
    accessorKey: "price",
    header: () => <div className="text-right">Price</div>,
    cell: ({ row }) => {
      const price = row.getValue("price") as number;

      if (price === 0 || price === null || price === undefined) {
        return (
          <div className="text-right font-medium text-green-600">Free</div>
        );
      }

      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(price);

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "lectures",
    header: "Lectures",
    cell: ({ row }) => {
      const lectures = row.getValue("lectures") as any[];
      return (
        <div className="flex items-center space-x-1">
          <BookOpen className="w-4 h-4 text-muted-foreground" />
          <span>{lectures?.length || 0}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return (
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">{date.toLocaleDateString()}</span>
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const course = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(course.id)}
            >
              Copy course ID
            </DropdownMenuItem>
            <DropdownMenuSeparator /> */}
            <Link href={`/dashboard/course/${course.id}`}>
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                View course
              </DropdownMenuItem>
            </Link>
            <Link href={`/dashboard/course/edit-course/${course.id}`}>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit course
              </DropdownMenuItem>
            </Link>
            <Link href={`/dashboard/course/${course.id}/lecture`}>
              <DropdownMenuItem>
                <BookOpen className="mr-2 h-4 w-4" />
                Add lecture
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => {
                if (onDeleteCourse) {
                  if (
                    confirm(
                      "Are you sure you want to delete this course? This action cannot be undone."
                    )
                  ) {
                    onDeleteCourse(course.id);
                  }
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete course
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// Default columns without delete functionality for backward compatibility
export const columns = createColumns();
