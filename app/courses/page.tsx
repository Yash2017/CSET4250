"use client";

import { useState, useEffect } from "react";
import { Play, FileQuestion, Plus, FileIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Document, Page, pdfjs } from "react-pdf";
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

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function Component() {
  const router = useRouter();
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
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [quizzes, setQuizzes] = useState([]);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [isTakingQuiz, setIsTakingQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState(null);
  const [timer, setTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);

  // New state variable to track the submission/loading state when submitting the quiz
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  // New states for transcript loading
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptData, setTranscriptData] = useState(null);

  const courseId = 1;
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
      duration: "35:41",
      url: "https://example.com/video1",
      transcript:
        "Welcome to CSET 1100: Introduction to Computer Science! ... (full transcript)",
    },
    {
      id: 2,
      title: "Data Types and Variables",
      duration: "2:40",
      url: "https://example.com/video2",
      transcript: "This is the transcript for Data Types and Variables...",
    },
    {
      id: 3,
      title: "Control Structures",
      duration: "38:01",
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
        "CSET 1100 introduces the fundamentals of programming and computing, focusing on the basics of Python. Key points include ...",
    },
    {
      id: 2,
      title: "Week 2: Introduction to programming languages",
      lastModified: "2023-09-12",
      content:
        "We explored the fundamentals of programming languages, focusing on their levels ...",
    },
    {
      id: 3,
      title: "Week 3: Introduction to Programming in Python",
      lastModified: "2023-09-19",
      content:
        "This lecture introduced elementary programming concepts, focusing on primitive data types, variables, and operations ...",
    },
  ]);

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

  const lectureContent = [
    {
      id: 1,
      title: "Lecture 1: Introduction to Computer Science",
      filename: "lecture1_intro_cs.pdf",
      url: "https://example.com/pdfs/lecture1_intro_cs.pdf",
    },
    {
      id: 2,
      title: "Lecture 2: Fundamentals of Programming",
      filename: "lecture2_programming_fundamentals.pdf",
      url: "https://example.com/pdfs/lecture2_programming_fundamentals.pdf",
    },
    {
      id: 3,
      title: "Lecture 3: Data Structures and Algorithms",
      filename: "lecture3_data_structures_algorithms.pdf",
      url: "https://example.com/pdfs/lecture3_data_structures_algorithms.pdf",
    },
  ];

  useEffect(() => {
    fetchQuizzes();
  }, []);

  useEffect(() => {
    if (isTakingQuiz && timeLeft > 0) {
      const countdown = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(countdown);
    } else if (timeLeft === 0 && isTakingQuiz) {
      handleSubmitQuiz();
    }
  }, [isTakingQuiz, timeLeft]);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch("http://localhost:5001/get-quizzes");
      if (!response.ok) {
        throw new Error("Failed to fetch quizzes");
      }
      const data = await response.json();
      setQuizzes(data.quizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    }
  };

  const handleGenerateQuiz = async () => {
    try {
      setLoading(true);

      let contentToSend = "";
      if (quizMaterial === "Notes") {
        // quizContent looks like "note-1" for note with id = 1
        const noteId = parseInt(quizContent.split("-")[1], 10);
        const selectedNoteObj = notes.find((n) => n.id === noteId);
        if (selectedNoteObj) {
          contentToSend = selectedNoteObj.content;
        }
      } else if (quizMaterial === "Lecture Videos") {
        // quizContent looks like "lecture-1" for video with id = 1
        const videoId = parseInt(quizContent.split("-")[1], 10);
        const selectedVideo = lectureVideos.find((v) => v.id === videoId);
        if (selectedVideo) {
          contentToSend = String(selectedVideo.id);
        }
      } else {
        contentToSend = quizContent;
      }

      const response = await fetch("http://localhost:5001/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pdfName:
            quizMaterial === "Lecture Videos" || quizMaterial === "Notes"
              ? contentToSend
              : quizContent,
          difficultyLevel: quizDifficulty,
          quizMaterial: quizMaterial,
          specificContent: quizContent,
        }),
      });

      if (!response.ok) {
        setLoading(false);
        throw new Error("Failed to generate quiz");
      }
      const data = await response.json();
      setIsQuizDialogOpen(false);
      fetchQuizzes();
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error generating quiz:", error);
    }
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
    const savedResults = localStorage.getItem(`quizResults-${quiz.quizId}`);
    if (savedResults) {
      setQuizResults(JSON.parse(savedResults));
    } else {
      setQuizResults(null);
    }
  };

  const openLectureDialog = async (lecture) => {
    // When user clicks "View Transcript"
    setSelectedLecture(lecture);
    setTranscriptLoading(true);
    setTranscriptData(null);

    try {
      const response = await fetch(
        `http://localhost:5001/transcribe-audio/${lecture.id}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch transcript");
      }
      const data = await response.json();
      setTranscriptData(data.transcription);
    } catch (error) {
      console.error("Error fetching transcript:", error);
      setTranscriptData("Error fetching transcript. Please try again later.");
    } finally {
      setTranscriptLoading(false);
    }
  };

  const openFullNoteDialog = (note) => {
    setSelectedNote(note);
    setIsFullNoteDialogOpen(true);
  };

  const openHomeworkDialog = (hw) => {
    setSelectedHomework(hw);
  };

  const openPDFDialog = (pdf) => {
    setSelectedPDF(pdf);
    setPageNumber(1);
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const startQuiz = () => {
    setIsTakingQuiz(true);
    setQuizAnswers({});
    setQuizResults(null);
    let totalTime = 300;
    if (selectedQuiz.difficulty === "medium") {
      totalTime = 420;
    } else if (selectedQuiz.difficulty === "hard") {
      totalTime = 600;
    }
    setTimeLeft(totalTime);
  };

  const handleOptionChange = (questionId, optionId) => {
    setQuizAnswers({
      ...quizAnswers,
      [questionId]: optionId,
    });
  };

  const handleSubmitQuiz = async () => {
    // Stop the quiz timer and show a loader
    setIsTakingQuiz(false);
    setSubmittingQuiz(true);

    let correctAnswers = 0;
    selectedQuiz.quiz.forEach((q) => {
      const userAnswer = quizAnswers[q.questionId];
      const correctOption = q.options.find((o) => o.correctAnswer);
      if (userAnswer == correctOption.optionId) {
        correctAnswers += 1;
      }
    });
    const score = ((correctAnswers / selectedQuiz.quiz.length) * 100).toFixed(
      2
    );

    // Now fetch feedback from the backend
    try {
      const response = await fetch("http://localhost:5001/get-quiz-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quizId: selectedQuiz.quizId,
          quiz: selectedQuiz,
          answersSelected: quizAnswers,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get quiz feedback");
      }

      const data = await response.json();
      const feedback = data.feedback || "No feedback provided.";

      const results = {
        score,
        totalQuestions: selectedQuiz.quiz.length,
        correctAnswers,
        answers: quizAnswers,
        quiz: selectedQuiz,
        feedback: feedback,
      };
      setQuizResults(results);
      localStorage.setItem(
        `quizResults-${selectedQuiz.quizId}`,
        JSON.stringify(results)
      );
    } catch (error) {
      console.error("Error fetching quiz feedback:", error);
      // Even if feedback fails, show partial results
      const results = {
        score,
        totalQuestions: selectedQuiz.quiz.length,
        correctAnswers,
        answers: quizAnswers,
        quiz: selectedQuiz,
        feedback: "No feedback available due to an error.",
      };
      setQuizResults(results);
      localStorage.setItem(
        `quizResults-${selectedQuiz.quizId}`,
        JSON.stringify(results)
      );
    } finally {
      setSubmittingQuiz(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 overflow-auto">
      <header className="bg-gray-800 p-4 shadow-md">
        <div className="container mx-auto">
          <Button
            variant="link"
            className="text-blue-400 hover:underline mb-2 p-0"
            onClick={() => router.push("/")}
          >
            &larr; Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="text-sm text-gray-400">
            {course.term} | {course.instructor}
          </p>
        </div>
      </header>
      <main className="container mx-auto p-4">
        <Tabs defaultValue="notes" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
            <TabsTrigger value="videos">Lecture Videos</TabsTrigger>
            <TabsTrigger value="homework">Homework</TabsTrigger>
            <TabsTrigger value="lecture-content">Lecture Content</TabsTrigger>
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
                Generate New Quiz
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz) => (
                <Card
                  key={quiz.quizId}
                  className="cursor-pointer hover:bg-gray-300 hover:shadow-md transition-colors border border-gray-700"
                  onClick={() => openQuizDialog(quiz)}
                >
                  <CardHeader>
                    <CardTitle>{quiz.topic}</CardTitle>
                    <CardDescription>Subtopic: {quiz.subtopic}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Difficulty: {quiz.difficulty}</p>
                    <p>Questions: {quiz.quiz.length}</p>
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
                  className="cursor-pointer hover:bg-gray-300 hover:shadow-md transition-colors border border-gray-700"
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
                      View Transcript
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
          <TabsContent value="lecture-content">
            <h2 className="text-2xl font-semibold mb-4">Lecture Content</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {lectureContent.map((content) => (
                <Card
                  key={content.id}
                  className="cursor-pointer hover:bg-gray-300 hover:shadow-md transition-colors border border-gray-700"
                  onClick={() => openPDFDialog(content)}
                >
                  <CardHeader>
                    <CardTitle>{content.title}</CardTitle>
                    <CardDescription>{content.filename}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      <FileIcon className="mr-2 h-4 w-4" /> View PDF
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Generate Quiz Dialog */}
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
                className="block text-sm font-medium "
              >
                Quiz Material
              </label>
              <Select onValueChange={setQuizMaterial} disabled={loading}>
                <SelectTrigger id="quizMaterial">
                  <SelectValue placeholder="Select quiz material" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lecture Content">
                    Lecture Content
                  </SelectItem>
                  <SelectItem value="Lecture Videos">Lecture Videos</SelectItem>
                  <SelectItem value="Notes">Notes</SelectItem>
                  <SelectItem value="Homework">Homework</SelectItem>
                  <SelectItem value="Past Exams">Past Exams</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {quizMaterial && (
              <div>
                <label
                  htmlFor="quizContent"
                  className="block text-sm font-medium "
                >
                  Specific Content
                </label>
                <Select onValueChange={setQuizContent} disabled={loading}>
                  <SelectTrigger id="quizContent">
                    <SelectValue placeholder="Select specific content" />
                  </SelectTrigger>
                  <SelectContent>
                    {quizMaterial === "Lecture Videos" &&
                      lectureVideos.map((video) => (
                        <SelectItem
                          key={video.id}
                          value={`lecture-${video.id}`}
                        >
                          {video.title}
                        </SelectItem>
                      ))}
                    {quizMaterial === "Notes" &&
                      notes.map((note) => (
                        <SelectItem key={note.id} value={`note-${note.id}`}>
                          {note.title}
                        </SelectItem>
                      ))}
                    {quizMaterial === "Homework" &&
                      homework.map((hw) => (
                        <SelectItem key={hw.id} value={`homework-${hw.id}`}>
                          {hw.title}
                        </SelectItem>
                      ))}
                    {quizMaterial === "Past Exams" && (
                      <SelectItem value="all-exams">All Past Exams</SelectItem>
                    )}
                    {quizMaterial === "Lecture Content" &&
                      lectureContent.map((lc) => (
                        <SelectItem key={lc.id} value={lc.title}>
                          {lc.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label
                htmlFor="quizDifficulty"
                className="block text-sm font-medium "
              >
                Difficulty Level
              </label>
              <Select onValueChange={setQuizDifficulty} disabled={loading}>
                <SelectTrigger id="quizDifficulty">
                  <SelectValue placeholder="Select difficulty level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleGenerateQuiz}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
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
              <label htmlFor="noteTitle" className="block text-sm font-medium ">
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
                className="block text-sm font-medium"
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

      {/* Quiz Dialog */}
      <Dialog open={!!selectedQuiz} onOpenChange={() => setSelectedQuiz(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{selectedQuiz?.topic}</DialogTitle>
            <DialogDescription>
              Subtopic: {selectedQuiz?.subtopic} | Difficulty:{" "}
              {selectedQuiz?.difficulty}
            </DialogDescription>
          </DialogHeader>
          {submittingQuiz ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-10">
              <Loader2 className="h-10 w-10 animate-spin" />
              <p className="">Submitting your quiz and fetching feedback...</p>
            </div>
          ) : isTakingQuiz ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p>
                  Time Left: {Math.floor(timeLeft / 60)}:
                  {String(timeLeft % 60).padStart(2, "0")}
                </p>
                <Button onClick={handleSubmitQuiz} variant="destructive">
                  Submit Quiz
                </Button>
              </div>
              {selectedQuiz?.quiz.map((q, index) => (
                <div key={q.questionId} className="bg-gray-300 p-4 rounded-lg">
                  <p className="font-medium mb-2">
                    {index + 1}. {q.question}
                  </p>
                  <RadioGroup
                    onValueChange={(value) =>
                      handleOptionChange(q.questionId, value)
                    }
                    value={quizAnswers[q.questionId] || ""}
                  >
                    {q.options.map((option) => (
                      <div
                        key={option.optionId}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem
                          value={option.optionId.toString()}
                          id={`question-${q.questionId}-option-${option.optionId}`}
                        />
                        <Label
                          htmlFor={`question-${q.questionId}-option-${option.optionId}`}
                          className="flex-grow p-2 rounded-md"
                        >
                          {option.text}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}
            </div>
          ) : quizResults ? (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">
                Your Score: {quizResults.score}%
              </h3>
              <p className="text-sm bg-gray-300 p-3 rounded-lg">
                Feedback: {quizResults.feedback}
              </p>
              {selectedQuiz?.quiz.map((q, index) => {
                const userAnswer = quizResults.answers[q.questionId];
                const correctOption = q.options.find((o) => o.correctAnswer);
                return (
                  <div
                    key={q.questionId}
                    className="bg-gray-300 p-4 rounded-lg"
                  >
                    <p className="font-medium mb-2">
                      {index + 1}. {q.question}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((option) => {
                        const isUserAnswer =
                          option.optionId.toString() === userAnswer;
                        const isCorrect = option.correctAnswer;
                        let bgClass = "";
                        if (isUserAnswer && isCorrect) {
                          bgClass = "bg-green-600";
                        } else if (isUserAnswer && !isCorrect) {
                          bgClass = "bg-red-600";
                        } else if (isCorrect) {
                          bgClass = "bg-green-600";
                        }
                        return (
                          <div
                            key={option.optionId}
                            className={`p-2 rounded-md ${bgClass}`}
                          >
                            <p>
                              {option.text}{" "}
                              {option.correctAnswer && (
                                <span className="text-green-600">
                                  (Correct)
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-black">
                              Explanation: {option.explanation}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div>
              <Button
                onClick={startQuiz}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Take Quiz
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lecture Dialog */}
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
          <div className="space-y-4 overflow-auto max-h-80">
            <h3 className="text-lg font-semibold mb-2">Transcript</h3>
            {transcriptLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p>Generating transcript...</p>
              </div>
            ) : (
              <p className="text-sm">{transcriptData}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Note Dialog */}
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
            <p className="">{selectedNote?.content}</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Homework Dialog */}
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

      {/* PDF Viewer Dialog */}
      <Dialog open={!!selectedPDF} onOpenChange={() => setSelectedPDF(null)}>
        <DialogContent className="max-w-4xl h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{selectedPDF?.title}</DialogTitle>
            <DialogDescription>
              Filename: {selectedPDF?.filename}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Document
              file={selectedPDF?.url}
              onLoadSuccess={onDocumentLoadSuccess}
              className="max-h-[60vh] overflow-auto"
            >
              <Page pageNumber={pageNumber} />
            </Document>
            <div className="mt-4 flex justify-between items-center">
              <p>
                Page {pageNumber} of {numPages}
              </p>
              <div>
                <Button
                  onClick={() => setPageNumber(pageNumber - 1)}
                  disabled={pageNumber <= 1}
                  className="mr-2"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setPageNumber(pageNumber + 1)}
                  disabled={pageNumber >= numPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
