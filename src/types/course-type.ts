export type Lecture = {
    id: string;
    title: string;
    description?: string;
    content?: string;
    videoUrl?: string;
    duration?: string | number; // Updated to match API types
    order?: number; // Added order property
    isPublished?: boolean; // Added isPublished property
    isFree?: boolean; // Made optional to match API types
    courseId: string;
    createdAt: string;
    updatedAt: string;
};

export type Course = {
    id: string;
    title: string;
    subTitle?: string;
    description?: string;
    category: string;
    level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCE";
    price?: number;
    thumbnail?: string;
    isPublished: boolean;
    creatorId: string;
    createdAt: string;
    updatedAt: string;
    lectures?: Lecture[];
    reviews?: unknown[];
    creator?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        imageUrl?: string;
        avatar?: string;
    };
    _count?: {
        lectures: number;
        enrollments: number;
        orders?: number;
    };
    orders?: unknown[];
    revenue?: number;
};
