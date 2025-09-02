import { Search } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const HeroSection = () => {
  return (
    <div className="w-full relative bg-gradient-to-r from-blue-500 to-blue-600 dark:from-gray-800 dark:to-gray-900 py-16 px-4 text-center">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-white text-4xl font-bold mb-4">
          Find the Best Courses for You
        </h2>
        <p className="text-gray-200 dark:text-gray-400 mb-8">
          Discover, Learn, and Upskill with our wide range of courses
        </p>

        <form action={""}>
          <div className="flex items-center bg-white dark:bg-gray-800 rounded-full shadow-lg overflow-hidden max-w-xl mx-auto mb-6">
            <Input
              type="text"
              className="rounded-l-full flex-grow border-none focus-visible:ring-0 px-6 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Search Courses"
            />
            <Button className="bg-blue-600 dark:bg-gray-700 text-white px-6 py-3 rounded-r-full hover:bg-blue-700 hover:dark:bg-gray-800">
              <span>
                <Search size={4} />
              </span>
            </Button>
          </div>
        </form>
        <Button
          size={"lg"}
          className="bg-white dark:bg-gray-800 text-blue-600 dark:text-gray-100 hover:bg-gray-300 hover:dark:bg-gray-400 hover:dark:text-gray-900 rounded-full"
        >
          Explore Courses
        </Button>
      </div>
    </div>
  );
};

export default HeroSection;
