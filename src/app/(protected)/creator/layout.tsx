import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creator Hub - LMS",
  description: "Manage your courses and content as an instructor",
};

export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full">
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
