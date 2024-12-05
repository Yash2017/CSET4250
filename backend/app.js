import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import fs from "fs";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const fileName = "quizes.json";
const instructions_assistant =
  'You are tasked with creating quizzes based solely on the content of the provided PDF documents. The quizzes must strictly adhere to the information from the given PDFs. Input: PDF Name: (e.g., "Document1.pdf") Difficulty Level: (e.g., Easy, Medium, Hard) Output: Return a JSON object with the following format: { "quizId": 1, "courseName": "Introduction to AI", "topic": "Neural Networks", "subtopic": "Basics", "difficulty": "Medium", "quiz": [ { "questionId": 1, "question": "What is the capital of France?", "options": [ { "optionId": 1, "text": "Paris", "correctAnswer": true, "explanation": "Paris is the capital of France, known for its cultural and historical significance." }, { "optionId": 2, "text": "Berlin", "correctAnswer": false, "explanation": "Berlin is the capital of Germany, not France." }, { "optionId": 3, "text": "Madrid", "correctAnswer": false, "explanation": "Madrid is the capital of Spain, not France." }, { "optionId": 4, "text": "Rome", "correctAnswer": false, "explanation": "Rome is the capital of Italy, not France." } ] } ] } Instructions: Ensure all questions are accurate and strictly based on the specified PDF document. The number of questions should depend on the difficulty level: Easy: 3-5 questions. Medium: 5-7 questions. Hard: 8-10 questions. For each question, provide: Options: Four choices (one correct answer and three distractors). Explanations: Brief reasoning for each option indicating why it is correct or incorrect. Ensure the JSON output is clean and formatted correctly. Do not include any text outside the JSON structure. Example: If you are provided "SampleDoc.pdf" and a difficulty level of "Medium," the output might look like: { "quiz": [ { "question": "Which entity manages the operations discussed in SampleDoc.pdf?", "options": [ { "text": "Entity A", "correctAnswer": true, "explanation": "Entity A is explicitly mentioned as the operations manager in the document." }, { "text": "Entity B", "correctAnswer": false, "explanation": "Entity B was mentioned in a different context, not operations management." }, { "text": "Entity C", "correctAnswer": false, "explanation": "Entity C is involved in support, not operations management." }, { "text": "Entity D", "correctAnswer": false, "explanation": "Entity D is not mentioned in the context of the operations management." } ] } ] } Follow these guidelines to generate quiz questions. Only provide JSON output; no additional text should accompany it. Don\'t start generating until i give you the difficulty level and the pdf name. reply with yes if you understand. the quiz-id should be unique and would be different for every quiz. it should be a number. Only and only return the JSON ouptut. Please do not return anything else.';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API,
});

const readQuizzesFromFile = () => {
  try {
    if (!fs.existsSync(fileName)) {
      // If file doesn't exist, return an empty array
      return [];
    }
    const data = fs.readFileSync(fileName, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading quizzes file:", error);
    return [];
  }
};

const writeQuizzesToFile = async (quizzes) => {
  try {
    await fs.writeFileSync(fileName, JSON.stringify(quizzes, null, 2));
  } catch (error) {
    console.error("Error writing quizzes file:", error);
  }
};

const thread = await openai.beta.threads.create();

const app = express();

// Middleware to parse JSON requests
app.use(express.json());

app.use(cors());

// Test route to check if the server is working
app.get("/", async (req, res) => {
  res.send("Backend server is running!");
});

app.post("/generate-quiz", async (req, res) => {
  const { pdfName, difficultyLevel, quizMaterial, specificContent } = req.body;

  if (!pdfName || !difficultyLevel || !quizMaterial || !specificContent) {
    return res.status(400).json({
      error:
        "Missing pdfName or difficultyLevel or quiz material or specific content in request body.",
    });
  }

  try {
    const message = await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: `PDF name: ${pdfName} , Difficulty: ${difficultyLevel}`,
    });
    // Query OpenAI
    let run = await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: "asst_GInlAeDRqre4JT1xQo2n5I9S",
      instructions: instructions_assistant,
    });

    if (run.status === "completed") {
      const messages = await openai.beta.threads.messages.list(run.thread_id);
      for (const message of messages.data.reverse()) {
        if (message.role == "assistant") {
          const existingQuizzes = readQuizzesFromFile();

          //console.log(message.content[0].text.value);

          // Append the new quiz to the existing quizzes
          const updatedQuizzes = [
            ...existingQuizzes,
            JSON.parse(message.content[0].text.value),
          ];

          updatedQuizzes[updatedQuizzes.length - 1].quizId = Math.floor(
            Math.random() * (200 - 1) + 1
          );

          updatedQuizzes[updatedQuizzes.length - 1].courseName = "CSET 1100";

          updatedQuizzes[updatedQuizzes.length - 1].topic = quizMaterial;

          updatedQuizzes[updatedQuizzes.length - 1].subtopic = specificContent;

          updatedQuizzes[updatedQuizzes.length - 1].difficulty =
            difficultyLevel;

          console.log(updatedQuizzes);

          // Write the updated quizzes back to the file
          await writeQuizzesToFile(updatedQuizzes);

          return res.status(200).json({
            quiz: JSON.parse(message.content[0].text.value),
          });
        }
      }
    } else {
      return res
        .status(500)
        .json({ error: "An error occurred while generating the quiz." });
    }
  } catch (error) {
    console.error("Error querying OpenAI or saving the file:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while generating the quiz." });
  }
});

app.get("/get-quizzes", (req, res) => {
  try {
    const quizzes = readQuizzesFromFile();
    return res.status(200).json({ quizzes });
  } catch (error) {
    console.error("Error retrieving quizzes:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while retrieving the quizzes." });
  }
});

// API Route to get all quizzes
// app.get("/api/quizzes", (req, res) => {
//   const quizzesPath = path.join(__dirname, "data", "quizzes.json");
//   console.log(`Reading file from: ${quizzesPath}`); // Log the file path

//   fs.readFile(quizzesPath, "utf8", (err, data) => {
//     if (err) {
//       console.error("Error reading file:", err); // Log the error
//       res.status(500).json({ error: "Unable to fetch quizzes." });
//     } else {
//       try {
//         const quizzes = JSON.parse(data); // Parse JSON data
//         console.log("Successfully read quizzes:", quizzes); // Log successful read
//         res.json(quizzes); // Send quizzes as response
//       } catch (parseError) {
//         console.error("Error parsing JSON:", parseError); // Log JSON parsing errors
//         res.status(500).json({ error: "Invalid JSON format in quizzes file." });
//       }
//     }
//   });
// });

// API Route to get a single quiz by ID
// app.get("/api/quizzes/:id", (req, res) => {
//   const quizzesPath = path.join(__dirname, "data", "quizzes.json");
//   const quizId = parseInt(req.params.id);

//   console.log(`Fetching quiz with ID: ${quizId}`); // Log the requested quiz ID

//   fs.readFile(quizzesPath, "utf8", (err, data) => {
//     if (err) {
//       console.error("Error reading file:", err); // Log the error
//       res.status(500).json({ error: "Unable to fetch quiz." });
//     } else {
//       try {
//         const quizzes = JSON.parse(data).quizzes; // Parse JSON data
//         const quiz = quizzes.find((q) => q.quizId === quizId);

//         if (quiz) {
//           console.log(`Successfully found quiz with ID: ${quizId}`); // Log successful fetch
//           res.json(quiz); // Send the specific quiz as response
//         } else {
//           console.warn(`Quiz with ID: ${quizId} not found.`); // Log warning for missing quiz
//           res.status(404).json({ error: "Quiz not found." });
//         }
//       } catch (parseError) {
//         console.error("Error parsing JSON:", parseError); // Log JSON parsing errors
//         res.status(500).json({ error: "Invalid JSON format in quizzes file." });
//       }
//     }
//   });
// });

// Route to display all quizzes as an HTML page
// app.get("/quizzes", (req, res) => {
//   const quizzesPath = path.join(__dirname, "data", "quizzes.json");
//   fs.readFile(quizzesPath, "utf8", (err, data) => {
//     if (err) {
//       console.error("Error reading file:", err);
//       res.status(500).send("<h1>Error loading quizzes.</h1>");
//     } else {
//       try {
//         const quizzes = JSON.parse(data).quizzes;
//         let htmlContent = "<h1>Available Quizzes</h1><ul>";
//         quizzes.forEach((quiz) => {
//           htmlContent += `
//             <li>
//               <strong>${quiz.courseName} (${quiz.topic})</strong><br>
//               <em>Difficulty:</em> ${quiz.difficulty}<br>
//               <a href="/quizzes/${quiz.quizId}">Take Quiz</a>
//             </li><br>
//           `;
//         });
//         htmlContent += "</ul>";
//         res.send(htmlContent);
//       } catch (parseError) {
//         console.error("Error parsing JSON:", parseError);
//         res.status(500).send("<h1>Error parsing quiz data.</h1>");
//       }
//     }
//   });
// });

// Route to display a single quiz as an HTML page
// app.get("/quizzes/:id", (req, res) => {
//   const quizzesPath = path.join(__dirname, "data", "quizzes.json");
//   const quizId = parseInt(req.params.id);

//   fs.readFile(quizzesPath, "utf8", (err, data) => {
//     if (err) {
//       console.error("Error reading file:", err);
//       res.status(500).send("<h1>Error loading quiz data.</h1>");
//     } else {
//       try {
//         const quizzes = JSON.parse(data).quizzes;
//         const quiz = quizzes.find((q) => q.quizId === quizId);

//         if (quiz) {
//           let htmlContent = `<h1>${quiz.courseName} - ${quiz.topic}</h1><ul>`;
//           quiz.questions.forEach((question, index) => {
//             htmlContent += `
//               <li>
//                 <strong>Q${index + 1}: ${question.questionText}</strong><br>
//                 <ul>
//                   ${question.options
//                     .map((option) => `<li>${option}</li>`)
//                     .join("")}
//                 </ul>
//               </li><br>
//             `;
//           });
//           htmlContent += '</ul><a href="/quizzes">Back to All Quizzes</a>';
//           res.send(htmlContent);
//         } else {
//           res.status(404).send("<h1>Quiz not found.</h1>");
//         }
//       } catch (parseError) {
//         console.error("Error parsing JSON:", parseError);
//         res.status(500).send("<h1>Error parsing quiz data.</h1>");
//       }
//     }
//   });
// });

// Start the server
const PORT = 5001; // You can use any port
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
