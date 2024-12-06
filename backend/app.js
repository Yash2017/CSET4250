import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import fs from "fs";
import OpenAI from "openai";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

const fileName = "quizes.json";
const instructions_assistant =
  'You are tasked with creating quizzes based solely on the content of the provided PDF documents. The quizzes must strictly adhere to the information from the given PDFs. Input: PDF Name: (e.g., "Document1.pdf") Difficulty Level: (e.g., Easy, Medium, Hard) Output: Return a JSON object with the following format: { "quizId": 1, "courseName": "Introduction to AI", "topic": "Neural Networks", "subtopic": "Basics", "difficulty": "Medium", "quiz": [ { "questionId": 1, "question": "What is the capital of France?", "options": [ { "optionId": 1, "text": "Paris", "correctAnswer": true, "explanation": "Paris is the capital of France, known for its cultural and historical significance." }, { "optionId": 2, "text": "Berlin", "correctAnswer": false, "explanation": "Berlin is the capital of Germany, not France." }, { "optionId": 3, "text": "Madrid", "correctAnswer": false, "explanation": "Madrid is the capital of Spain, not France." }, { "optionId": 4, "text": "Rome", "correctAnswer": false, "explanation": "Rome is the capital of Italy, not France." } ] } ] } Instructions: Ensure all questions are accurate and strictly based on the specified PDF document. The number of questions should depend on the difficulty level: Easy: 3-5 questions. Medium: 5-7 questions. Hard: 8-10 questions. For each question, provide: Options: Four choices (one correct answer and three distractors). Explanations: Brief reasoning for each option indicating why it is correct or incorrect. Ensure the JSON output is clean and formatted correctly. Do not include any text outside the JSON structure. Example: If you are provided "SampleDoc.pdf" and a difficulty level of "Medium," the output might look like: { "quiz": [ { "question": "Which entity manages the operations discussed in SampleDoc.pdf?", "options": [ { "text": "Entity A", "correctAnswer": true, "explanation": "Entity A is explicitly mentioned as the operations manager in the document." }, { "text": "Entity B", "correctAnswer": false, "explanation": "Entity B was mentioned in a different context, not operations management." }, { "text": "Entity C", "correctAnswer": false, "explanation": "Entity C is involved in support, not operations management." }, { "text": "Entity D", "correctAnswer": false, "explanation": "Entity D is not mentioned in the context of the operations management." } ] } ] } Follow these guidelines to generate quiz questions. Only provide JSON output; no additional text should accompany it. Don\'t start generating until i give you the difficulty level and the pdf name. reply with yes if you understand. the quiz-id should be unique and would be different for every quiz. it should be a number. Only and only return the JSON ouptut. Please do not return anything else.';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API,
});

// console.log("Loaded API Key:", process.env.OPENAI_API);

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

const thread_feedback = await openai.beta.threads.create();

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

  console.log(pdfName);

  if (!pdfName || !difficultyLevel || !quizMaterial || !specificContent) {
    return res.status(400).json({
      error:
        "Missing pdfName or difficultyLevel or quizMaterial or specificContent in request body.",
    });
  }

  // Instructions for notes-based quizzes
  const instructions_assistant_notes = `
  You are tasked with creating quizzes based solely on the provided notes or pdf content or lecture transcript.
  The quizzes must strictly adhere to the information from the given notes or the pdf document or lecture transcript.
  
  Input:
  Notes Content: (The entire text of the notes is provided below) or PDF Name: (eg. "Document1.pdf")
  Difficulty Level: (e.g., Easy, Medium, Hard)

  Output: 
  Return a JSON object with the following format:
  {
    "quizId": 1,
    "courseName": "CSET 1100",
    "topic": "Notes",
    "subtopic": "User-chosen note title",
    "difficulty": "Medium",
    "quiz": [
      {
        "questionId": 1,
        "question": "What is the capital of France?",
        "options": [
          {
            "optionId": 1,
            "text": "Paris",
            "correctAnswer": true,
            "explanation": "Paris is the capital of France, known for its cultural and historical significance."
          },
          {
            "optionId": 2,
            "text": "Berlin",
            "correctAnswer": false,
            "explanation": "Berlin is the capital of Germany, not France."
          },
          {
            "optionId": 3,
            "text": "Madrid",
            "correctAnswer": false,
            "explanation": "Madrid is the capital of Spain, not France."
          },
          {
            "optionId": 4,
            "text": "Rome",
            "correctAnswer": false,
            "explanation": "Rome is the capital of Italy, not France."
          }
        ]
      }
    ]
  }

  Instructions:
  Ensure all questions are accurate and strictly based on the notes provided.
  The number of questions should depend on the difficulty level:
  Easy: 3-5 questions.
  Medium: 5-7 questions.
  Hard: 8-10 questions.

  For each question, provide:
  - Four choices (one correct answer, three distractors)
  - Explanations: Brief reasoning for each option indicating why it is correct or incorrect.

  Ensure the JSON output is clean and formatted correctly. 
  Do not include any text outside the JSON structure.
  Don't start generating until i give you the difficulty level and the notes content.
  Reply with 'yes' if you understand. Only and only return the JSON output.
  `;

  try {
    let userPrompt;
    let instructionsToUse = instructions_assistant_notes;
    // If using notes, change the instructions and provide notes content in the prompt
    if (quizMaterial === "Notes") {
      instructionsToUse = instructions_assistant_notes;
      userPrompt = `Below are the notes content you should base your quiz on:\n\n${pdfName}\n\nDifficulty: ${difficultyLevel}`;
    } else if (quizMaterial == "Lecture Videos") {
      await transcribe(null, pdfName, false);
      let transcriptions = readTranscriptionsFromFile();
      userPrompt = `This is the video transcript: ${transcriptions[pdfName]} and this is the difficulty level: ${difficultyLevel}`;
    } else {
      // Default behavior for PDFs
      userPrompt = `PDF name: ${pdfName}, Difficulty: ${difficultyLevel}`;
    }

    // Send user message
    const message = await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: userPrompt,
    });

    // Query OpenAI with chosen instructions
    let run = await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: "asst_GInlAeDRqre4JT1xQo2n5I9S",
      instructions: instructionsToUse,
    });

    if (run.status === "completed") {
      const messages = await openai.beta.threads.messages.list(run.thread_id);
      for (const message of messages.data.reverse()) {
        if (message.role == "assistant") {
          const existingQuizzes = readQuizzesFromFile();

          const newQuiz = JSON.parse(message.content[0].text.value);
          // Assign a random quizId and add extra fields
          newQuiz.quizId = Math.floor(Math.random() * (200 - 1) + 1);
          newQuiz.courseName = "CSET 1100";
          newQuiz.topic = quizMaterial;
          newQuiz.subtopic = specificContent;
          newQuiz.difficulty = difficultyLevel;

          const updatedQuizzes = [...existingQuizzes, newQuiz];

          await writeQuizzesToFile(updatedQuizzes);

          return res.status(200).json({
            quiz: newQuiz,
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
function isEmptyObject(obj) {
  return !Object.keys(obj).length;
}
app.post("/get-quiz-feedback", async (req, res) => {
  try {
    const { quiz, answersSelected } = req.body;
    if (isEmptyObject(answersSelected)) {
      return res.status(200).json({
        feedback:
          "You didn't select any answers! Please go back and revise the material",
      });
    }

    // Instructions for the assistant on how to provide feedback
    const instructions_feedback = `
      You are a strict teacher for CSET 1100.
      The "quiz" object contains the entire quiz including questions and options.
      The "answersSelected" object shows which answers the student selected by questionId.
      Based on this information, provide a single paragraph of feedback.
      In your feedback, point the student to what concept should the student revise.  tell me how they can improve from their mistakes
      Return only the paragraph of feedback and nothing else.
    `;

    // Construct the user message that includes the quiz and answersSelected
    const feedbackMessage = `
      quiz: ${JSON.stringify(quiz)}
      answersSelected: ${JSON.stringify(answersSelected)}
    `;

    // Create a user message for the assistant
    const message = await openai.beta.threads.messages.create(
      thread_feedback.id,
      {
        role: "user",
        content: feedbackMessage,
      }
    );

    // Create and poll a run for the assistant with the feedback instructions
    let feedbackRun = await openai.beta.threads.runs.createAndPoll(
      thread_feedback.id,
      {
        assistant_id: "asst_QOyMGEpMNZa2BrK3KdXVvnS7",
        instructions: instructions_feedback,
      }
    );

    if (feedbackRun.status === "completed") {
      // Retrieve all messages and find the assistant's response
      const messages = await openai.beta.threads.messages.list(
        feedbackRun.thread_id
      );
      for (const msg of messages.data.reverse()) {
        if (msg.role === "assistant") {
          // The assistant's response should be a single paragraph of feedback
          console.log(msg.content[0].text.value);
          return res.status(200).json({ feedback: msg.content[0].text.value });
        }
      }
    } else {
      return res
        .status(500)
        .json({ error: "An error occurred while generating the feedback." });
    }
  } catch (error) {
    console.error("Error generating feedback:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while generating the feedback." });
  }
});
// Route to handle audio file uploads and transcription (disabled since upload isn't used)

// // Hardcoded audio transcription route
// app.get("/test-audio-transcription", async (req, res) => {
//   try {
//     // Hardcode your local audio file path
//     const audioFilePath = "C:\\Users\\bilal\\Downloads\\New Recording 30.m4a";

//     // Send the audio file to OpenAI Whisper API with language specified
//     const transcription = await openai.audio.transcriptions.create({
//       file: fs.createReadStream(audioFilePath), // Provide the hardcoded file path
//       model: "whisper-1", // Specify the Whisper model
//       response_format: "json", // Specify the desired response format
//       language: "en", // Specify the language of the audio file (e.g., Arabic)
//     });

//     // Return only the transcription result
//     return res.status(200).json(transcription);
//   } catch (error) {
//     console.error("Error during transcription:", error);
//     return res
//       .status(500)
//       .json({ error: "An error occurred during transcription." });
//   }
// });

const audioFiles = {
  1: "/Users/yash/Downloads/CSET 4350/audio1.mp3",
  2: "/Users/yash/Downloads/CSET 4350/audio1.mp3",
  // we can modify the paths and more tomorrow. Note a 30 minute video took about 2-3 minutes to transcribe
};

// Route to handle transcription by ID
const transcriptionsFile = "transcriptions.json";

const readTranscriptionsFromFile = () => {
  try {
    if (!fs.existsSync(transcriptionsFile)) {
      return {}; // return empty object if file doesn't exist
    }
    const data = fs.readFileSync(transcriptionsFile, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading transcriptions file:", error);
    return {};
  }
};

const writeTranscriptionsToFile = async (transcriptions) => {
  try {
    await fs.writeFileSync(
      transcriptionsFile,
      JSON.stringify(transcriptions, null, 2)
    );
  } catch (error) {
    console.error("Error writing transcriptions file:", error);
  }
};

async function transcribe(res, audioId, query) {
  try {
    if (!audioFiles[audioId]) {
      if (query) {
        return res
          .status(404)
          .json({ error: "Audio file not found for the given ID." });
      }
    }

    // Load existing transcriptions
    let transcriptions = readTranscriptionsFromFile();

    // Check if transcription for this audioId exists already
    if (transcriptions[audioId]) {
      // If yes, return it directly
      if (query) {
        return res.status(200).json({
          id: audioId,
          transcription: transcriptions[audioId],
          source: "cache", // optional field to indicate it's from cache
        });
      } else return transcriptions[audioId];
    }

    const audioFilePath = audioFiles[audioId];
    console.log("Processing file:", audioFilePath);

    // If not cached, call OpenAI Whisper API to transcribe
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: "whisper-1",
      response_format: "json",
      language: "en", // Default language
    });

    // Save the transcription text in our JSON file
    transcriptions[audioId] = transcription.text;
    await writeTranscriptionsToFile(transcriptions);

    // Return the transcription
    if (query) {
      return res.status(200).json({
        id: audioId,
        transcription: transcription.text,
        source: "fresh", // optional field to indicate newly fetched
      });
    } else return transcription.text;
  } catch (error) {
    console.error("Error during transcription:", error);
    return res
      .status(500)
      .json({ error: "An error occurred during transcription." });
  }
}

app.get("/transcribe-audio/:id", async (req, res) => {
  const audioId = parseInt(req.params.id, 10);
  await transcribe(res, audioId, true);
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
