import { CoursePage } from "@/pages/course-page";
import { Book } from "lucide-react";
import Link from "next/link";
export default function Page() {
  const courses = [
    {
      id: 1,
      title: "CSET 1100: Introduction to Computer Science",
      term: "Fall 2024",
      instructor: "Professor Robert Langenderfer",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="bg-gray-800 p-4 shadow-md">
        <h1 className="text-2xl font-bold">EduAssist</h1>
      </header>
      <main className="container mx-auto p-4">
        <h2 className="text-xl font-semibold mb-4">My Courses</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses`}
              className="block bg-gray-800 p-4 rounded-lg shadow-md hover:bg-gray-700 transition-colors"
            >
              <h3 className="text-lg font-semibold mb-2">{course.title}</h3>
              <p className="text-sm text-gray-400">{course.term}</p>
              <p className="text-sm text-gray-400">{course.instructor}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
