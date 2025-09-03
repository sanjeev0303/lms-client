import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';
import { Button } from "@/components/ui/button";
import { Edit, PlayCircle, Trash2, GripVertical, Loader2 } from "lucide-react";

interface Lecture {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  isFree: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

interface SortableLectureItemProps {
  lecture: Lecture;
  index: number;
  onEdit: (lectureId: string) => void;
  onDelete: (lectureId: string) => void;
  isDeleting: boolean;
}

const SortableLectureItem: React.FC<SortableLectureItemProps> = ({
  lecture,
  index,
  onEdit,
  onDelete,
  isDeleting
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lecture.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
        isDragging ? 'shadow-lg bg-white dark:bg-gray-800 rounded-lg' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <GripVertical className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>

          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <PlayCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                #{index + 1}
              </span>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                {lecture.title}
              </h3>
            </div>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Created: {new Date(lecture.createdAt).toLocaleDateString()}
              </span>
              {lecture.videoUrl && (
                <span className="text-sm text-green-600 dark:text-green-400">
                  Video uploaded
                </span>
              )}
              <span
                className={`text-sm px-2 py-1 rounded-full ${
                  lecture.isFree
                    ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                {lecture.isFree ? "Free Preview" : "Premium"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(lecture.id)}
            className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900"
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(lecture.id)}
            disabled={isDeleting}
            className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-1" />
            )}
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

interface SortableLectureListProps {
  lectures: Lecture[];
  onReorder: (reorderedLectures: Lecture[]) => void;
  onEdit: (lectureId: string) => void;
  onDelete: (lectureId: string) => void;
  deletingId: string | null;
  isReordering: boolean;
}

export const SortableLectureList: React.FC<SortableLectureListProps> = ({
  lectures,
  onReorder,
  onEdit,
  onDelete,
  deletingId,
  isReordering
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = lectures.findIndex((lecture) => lecture.id === active.id);
      const newIndex = lectures.findIndex((lecture) => lecture.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedLectures = [...lectures];
        const [movedLecture] = reorderedLectures.splice(oldIndex, 1);
        reorderedLectures.splice(newIndex, 0, movedLecture);

        // Update positions to be 1-indexed
        const lecturesWithNewPositions = reorderedLectures.map((lecture, index) => ({
          ...lecture,
          position: index + 1
        }));

        onReorder(lecturesWithNewPositions);
      }
    }
  };

  if (lectures.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <PlayCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No lectures yet
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Create your first lecture to get started with your course.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {isReordering && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 p-3">
          <div className="flex items-center justify-center text-sm text-blue-700 dark:text-blue-300">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Updating lecture order...
          </div>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={lectures.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {lectures.map((lecture, index) => (
            <SortableLectureItem
              key={lecture.id}
              lecture={lecture}
              index={index}
              onEdit={onEdit}
              onDelete={onDelete}
              isDeleting={deletingId === lecture.id}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};
