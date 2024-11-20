const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Test route to check if the server is working
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// API Route to get all quizzes
app.get('/api/quizzes', (req, res) => {
  const quizzesPath = path.join(__dirname, 'data', 'quizzes.json');
  console.log(`Reading file from: ${quizzesPath}`); // Log the file path

  fs.readFile(quizzesPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err); // Log the error
      res.status(500).json({ error: 'Unable to fetch quizzes.' });
    } else {
      try {
        const quizzes = JSON.parse(data); // Parse JSON data
        console.log('Successfully read quizzes:', quizzes); // Log successful read
        res.json(quizzes); // Send quizzes as response
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError); // Log JSON parsing errors
        res.status(500).json({ error: 'Invalid JSON format in quizzes file.' });
      }
    }
  });
});

// API Route to get a single quiz by ID
app.get('/api/quizzes/:id', (req, res) => {
  const quizzesPath = path.join(__dirname, 'data', 'quizzes.json');
  const quizId = parseInt(req.params.id);

  console.log(`Fetching quiz with ID: ${quizId}`); // Log the requested quiz ID

  fs.readFile(quizzesPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err); // Log the error
      res.status(500).json({ error: 'Unable to fetch quiz.' });
    } else {
      try {
        const quizzes = JSON.parse(data).quizzes; // Parse JSON data
        const quiz = quizzes.find((q) => q.quizId === quizId);

        if (quiz) {
          console.log(`Successfully found quiz with ID: ${quizId}`); // Log successful fetch
          res.json(quiz); // Send the specific quiz as response
        } else {
          console.warn(`Quiz with ID: ${quizId} not found.`); // Log warning for missing quiz
          res.status(404).json({ error: 'Quiz not found.' });
        }
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError); // Log JSON parsing errors
        res.status(500).json({ error: 'Invalid JSON format in quizzes file.' });
      }
    }
  });
});

// Route to display all quizzes as an HTML page
app.get('/quizzes', (req, res) => {
  const quizzesPath = path.join(__dirname, 'data', 'quizzes.json');
  fs.readFile(quizzesPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      res.status(500).send('<h1>Error loading quizzes.</h1>');
    } else {
      try {
        const quizzes = JSON.parse(data).quizzes;
        let htmlContent = '<h1>Available Quizzes</h1><ul>';
        quizzes.forEach((quiz) => {
          htmlContent += `
            <li>
              <strong>${quiz.courseName} (${quiz.topic})</strong><br>
              <em>Difficulty:</em> ${quiz.difficulty}<br>
              <a href="/quizzes/${quiz.quizId}">Take Quiz</a>
            </li><br>
          `;
        });
        htmlContent += '</ul>';
        res.send(htmlContent);
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        res.status(500).send('<h1>Error parsing quiz data.</h1>');
      }
    }
  });
});

// Route to display a single quiz as an HTML page
app.get('/quizzes/:id', (req, res) => {
  const quizzesPath = path.join(__dirname, 'data', 'quizzes.json');
  const quizId = parseInt(req.params.id);

  fs.readFile(quizzesPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      res.status(500).send('<h1>Error loading quiz data.</h1>');
    } else {
      try {
        const quizzes = JSON.parse(data).quizzes;
        const quiz = quizzes.find((q) => q.quizId === quizId);

        if (quiz) {
          let htmlContent = `<h1>${quiz.courseName} - ${quiz.topic}</h1><ul>`;
          quiz.questions.forEach((question, index) => {
            htmlContent += `
              <li>
                <strong>Q${index + 1}: ${question.questionText}</strong><br>
                <ul>
                  ${question.options.map((option) => `<li>${option}</li>`).join('')}
                </ul>
              </li><br>
            `;
          });
          htmlContent += '</ul><a href="/quizzes">Back to All Quizzes</a>';
          res.send(htmlContent);
        } else {
          res.status(404).send('<h1>Quiz not found.</h1>');
        }
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        res.status(500).send('<h1>Error parsing quiz data.</h1>');
      }
    }
  });
});

// Start the server
const PORT = 5000; // You can use any port
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
