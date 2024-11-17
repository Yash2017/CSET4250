"use client";

import { useState } from "react";
import {
  Book,
  Video,
  FileText,
  BrainCircuit,
  Play,
  FileQuestion,
  PresentationIcon,
  Folder,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export function CoursePage() {
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isFullNoteDialogOpen, setIsFullNoteDialogOpen] = useState(false);
  const [quizMaterial, setQuizMaterial] = useState("");
  const [quizContent, setQuizContent] = useState("");
  const [quizDifficulty, setQuizDifficulty] = useState("");
  const [newNote, setNewNote] = useState({ title: "", content: "" });
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [selectedHomework, setSelectedHomework] = useState(null);

  const courseId = 1; // This would typically come from the route params
  const course = {
    id: 1,
    title: "CSET 1100: Introduction to Computer Science",
    term: "Fall 2024",
    instructor: "Professor Robert Langenderfer",
  };

  const lectureVideos = [
    {
      id: 1,
      title: "Introduction to Programming Concepts",
      duration: "45:00",
      url: "https://example.com/video1",
      transcript:
        "This is the transcript for Introduction to Programming Concepts...",
    },
    {
      id: 2,
      title: "Data Types and Variables",
      duration: "50:30",
      url: "https://example.com/video2",
      transcript: "This is the transcript for Data Types and Variables...",
    },
    {
      id: 3,
      title: "Control Structures",
      duration: "55:15",
      url: "https://example.com/video3",
      transcript: "This is the transcript for Control Structures...",
    },
  ];

  const [notes, setNotes] = useState([
    {
      id: 1,
      title: "Week 1: CS Fundamentals",
      lastModified: "2023-09-05",
      content:
        "Introduction to computer science and its core principles. Topics covered: algorithms, data structures, and computational thinking.",
    },
    {
      id: 2,
      title: "Week 2: Algorithms Basics",
      lastModified: "2023-09-12",
      content:
        "Basic algorithm concepts including time complexity, space complexity, and Big O notation. Examples of common algorithms like binary search and bubble sort.",
    },
    {
      id: 3,
      title: "Week 3: Object-Oriented Programming",
      lastModified: "2023-09-19",
      content:
        "Introduction to OOP principles: encapsulation, inheritance, and polymorphism. Examples in Java and Python to illustrate these concepts.",
    },
  ]);

  const quizzes = [
    {
      id: 1,
      title: "Quiz 1: Programming Basics",
      score: "85%",
      date: "2023-09-10",
      questions: [
        {
          question: "What is a variable?",
          options: ["A container for data", "A loop", "A function", "A class"],
          correct: 0,
          selected: 0,
        },
        {
          question: "Which of these is not a data type?",
          options: ["Integer", "String", "Boolean", "Alphabet"],
          correct: 3,
          selected: 2,
        },
      ],
    },
    {
      id: 2,
      title: "Quiz 2: Data Structures",
      score: "92%",
      date: "2023-09-17",
      questions: [
        {
          question: "What is an array?",
          options: [
            "A data type",
            "A collection of elements",
            "A function",
            "A loop",
          ],
          correct: 1,
          selected: 1,
        },
        {
          question: "Which data structure uses LIFO?",
          options: ["Queue", "Stack", "Linked List", "Tree"],
          correct: 1,
          selected: 1,
        },
      ],
    },
    {
      id: 3,
      title: "Quiz 3: OOP Concepts",
      score: "88%",
      date: "2023-09-24",
      questions: [
        {
          question: "What is encapsulation?",
          options: [
            "Hiding implementation details",
            "Inheriting properties",
            "Creating objects",
            "Overriding methods",
          ],
          correct: 0,
          selected: 0,
        },
        {
          question: "Which keyword is used for inheritance in Java?",
          options: ["extends", "implements", "inherits", "super"],
          correct: 0,
          selected: 2,
        },
      ],
    },
  ];

  const homework = [
    {
      id: 1,
      title: "Homework 1: Basic Algorithms",
      dueDate: "2023-09-15",
      submitted: true,
      grade: "95%",
      question: "Implement a binary search algorithm in Python.",
      submission:
        "def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1",
    },
    {
      id: 2,
      title: "Homework 2: OOP Concepts",
      dueDate: "2023-09-22",
      submitted: false,
      question:
        "Create a class hierarchy to model a university system with students, professors, and courses.",
      submission: "",
    },
  ];

  const handleGenerateQuiz = () => {
    console.log("Generating quiz with:", {
      quizMaterial,
      quizContent,
      quizDifficulty,
    });
    setIsQuizDialogOpen(false);
  };

  const handleAddNote = () => {
    if (newNote.title && newNote.content) {
      setNotes([
        ...notes,
        {
          ...newNote,
          id: notes.length + 1,
          lastModified: new Date().toISOString().split("T")[0],
        },
      ]);
      setNewNote({ title: "", content: "" });
      setIsNoteDialogOpen(false);
    }
  };

  const openQuizDialog = (quiz) => {
    setSelectedQuiz(quiz);
  };

  const openLectureDialog = (lecture) => {
    setSelectedLecture(lecture);
  };

  const openFullNoteDialog = (note) => {
    setSelectedNote(note);
    setIsFullNoteDialogOpen(true);
  };

  const openHomeworkDialog = (hw) => {
    setSelectedHomework(hw);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="bg-gray-800 p-4 shadow-md">
        <div className="container mx-auto">
          <Link
            href="/dashboard"
            className="text-blue-400 hover:underline mb-2 inline-block"
          >
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="text-sm text-gray-400">
            {course.term} | {course.instructor}
          </p>
        </div>
      </header>
      <main className="container mx-auto p-4">
        <Tabs defaultValue="notes" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
            <TabsTrigger value="videos">Lecture Videos</TabsTrigger>
            <TabsTrigger value="homework">Homework</TabsTrigger>
          </TabsList>
          <TabsContent value="notes" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Notes</h2>
              <Button
                onClick={() => setIsNoteDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" /> Add New Note
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {notes.map((note) => (
                <Card key={note.id} className="border border-gray-700">
                  <CardHeader>
                    <CardTitle>{note.title}</CardTitle>
                    <CardDescription>
                      Last modified: {note.lastModified}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-3">{note.content}</p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => openFullNoteDialog(note)}
                    >
                      View Full Note
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="quizzes" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Quizzes</h2>
              <Button
                onClick={() => setIsQuizDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <FileQuestion className="mr-2 h-4 w-4" /> Generate New Quiz
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz) => (
                <Card
                  key={quiz.id}
                  className="cursor-pointer hover:bg-gray-700 hover:shadow-md transition-colors border border-gray-700"
                  onClick={() => openQuizDialog(quiz)}
                >
                  <CardHeader>
                    <CardTitle>{quiz.title}</CardTitle>
                    <CardDescription>Date: {quiz.date}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Score: {quiz.score}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="videos">
            <h2 className="text-2xl font-semibold mb-4">Lecture Videos</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {lectureVideos.map((video) => (
                <Card
                  key={video.id}
                  className="cursor-pointer hover:bg-gray-700 hover:shadow-md transition-colors border border-gray-700"
                  onClick={() => openLectureDialog(video)}
                >
                  <CardHeader>
                    <CardTitle>{video.title}</CardTitle>
                    <CardDescription>
                      Duration: {video.duration}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      <Play className="mr-2 h-4 w-4" /> Watch Lecture
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="homework">
            <h2 className="text-2xl font-semibold mb-4">Homework</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {homework.map((hw) => (
                <Card key={hw.id} className="border border-gray-700">
                  <CardHeader>
                    <CardTitle>{hw.title}</CardTitle>
                    <CardDescription>Due: {hw.dueDate}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {hw.submitted ? (
                      <p className="text-blue-400">
                        Submitted (Grade: {hw.grade})
                      </p>
                    ) : (
                      <p className="text-yellow-400">Not Submitted</p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => openHomeworkDialog(hw)}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate New Quiz</DialogTitle>
            <DialogDescription>
              Select the material, specific content, and difficulty level for
              your new quiz.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="quizMaterial"
                className="block text-sm font-medium text-gray-300"
              >
                Quiz Material
              </label>
              <Select onValueChange={setQuizMaterial}>
                <SelectTrigger id="quizMaterial">
                  <SelectValue placeholder="Select quiz material" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lectureVideos">Lecture Videos</SelectItem>
                  <SelectItem value="notes">Notes</SelectItem>
                  <SelectItem value="homework">Homework</SelectItem>
                  <SelectItem value="pastExams">Past Exams</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {quizMaterial && (
              <div>
                <label
                  htmlFor="quizContent"
                  className="block text-sm font-medium text-gray-300"
                >
                  Specific Content
                </label>
                <Select onValueChange={setQuizContent}>
                  <SelectTrigger id="quizContent">
                    <SelectValue placeholder="Select specific content" />
                  </SelectTrigger>
                  <SelectContent>
                    {quizMaterial === "lectureVideos" &&
                      lectureVideos.map((video) => (
                        <SelectItem
                          key={video.id}
                          value={`lecture-${video.id}`}
                        >
                          {video.title}
                        </SelectItem>
                      ))}
                    {quizMaterial === "notes" &&
                      notes.map((note) => (
                        <SelectItem key={note.id} value={`note-${note.id}`}>
                          {note.title}
                        </SelectItem>
                      ))}
                    {quizMaterial === "homework" &&
                      homework.map((hw) => (
                        <SelectItem key={hw.id} value={`homework-${hw.id}`}>
                          {hw.title}
                        </SelectItem>
                      ))}
                    {quizMaterial === "pastExams" && (
                      <SelectItem value="all-exams">All Past Exams</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label
                htmlFor="quizDifficulty"
                className="block text-sm font-medium text-gray-300"
              >
                Difficulty Level
              </label>
              <Select onValueChange={setQuizDifficulty}>
                <SelectTrigger id="quizDifficulty">
                  <SelectValue placeholder="Select difficulty level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleGenerateQuiz}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Generate Quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Note</DialogTitle>
            <DialogDescription>
              Enter the title and content for your new note.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="noteTitle"
                className="block text-sm font-medium text-gray-300"
              >
                Note Title
              </label>
              <Input
                id="noteTitle"
                value={newNote.title}
                onChange={(e) =>
                  setNewNote({ ...newNote, title: e.target.value })
                }
                placeholder="Enter note title"
              />
            </div>
            <div>
              <label
                htmlFor="noteContent"
                className="block text-sm font-medium text-gray-300"
              >
                Note Content
              </label>
              <Textarea
                id="noteContent"
                value={newNote.content}
                onChange={(e) =>
                  setNewNote({ ...newNote, content: e.target.value })
                }
                placeholder="Enter note content"
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleAddNote}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedQuiz} onOpenChange={() => setSelectedQuiz(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedQuiz?.title}</DialogTitle>
            <DialogDescription>
              Date: {selectedQuiz?.date} | Score: {selectedQuiz?.score}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedQuiz?.questions.map((q, index) => (
              <div key={index} className="bg-gray-700 p-4 rounded-lg">
                <p className="font-medium mb-2">{q.question}</p>
                <RadioGroup>
                  {q.options.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem
                        value={optionIndex.toString()}
                        id={`question-${index}-option-${optionIndex}`}
                        className="sr-only"
                      />
                      <Label
                        htmlFor={`question-${index}-option-${optionIndex}`}
                        className={`flex-grow p-2 rounded-md ${
                          optionIndex === q.selected
                            ? optionIndex === q.correct
                              ? "bg-blue-600"
                              : "bg-red-600"
                            : optionIndex === q.correct
                            ? "bg-blue-600"
                            : ""
                        }`}
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedLecture}
        onOpenChange={() => setSelectedLecture(null)}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedLecture?.title}</DialogTitle>
            <DialogDescription>
              Duration: {selectedLecture?.duration}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="aspect-video bg-gray-700 flex items-center justify-center">
              <Play className="w-12 h-12" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Transcript</h3>
              <p className="text-sm text-gray-300">
                {selectedLecture?.transcript}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isFullNoteDialogOpen}
        onOpenChange={setIsFullNoteDialogOpen}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedNote?.title}</DialogTitle>
            <DialogDescription>
              Last modified: {selectedNote?.lastModified}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-gray-300">{selectedNote?.content}</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedHomework}
        onOpenChange={() => setSelectedHomework(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedHomework?.title}</DialogTitle>
            <DialogDescription>
              Due: {selectedHomework?.dueDate} | Status:{" "}
              {selectedHomework?.submitted
                ? `Submitted (Grade: ${selectedHomework.grade})`
                : "Not Submitted"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Question</h3>
              <p className="text-gray-300">{selectedHomework?.question}</p>
            </div>
            {selectedHomework?.submitted && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Your Submission</h3>
                <pre className="bg-gray-700 p-4 rounded-lg overflow-x-auto">
                  <code className="text-sm">
                    {selectedHomework?.submission}
                  </code>
                </pre>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
