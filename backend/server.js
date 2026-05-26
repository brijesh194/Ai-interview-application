const express = require('express');
const multer = require('multer');
const fs = require('fs');
const pdf = require('pdf-parse');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const { generateQuestions } = require('./utils/geminiConfig');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// ✅ ROOT ROUTE (FIX for "Cannot GET /")
app.get("/", (req, res) => {
    res.send("AI Interview Backend is running 🚀");
});

// 1. MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/interviewer_pro')
    .then(() => console.log("MongoDB Connected! ✅🔥"))
    .catch(err => console.log("DB Connection Error: ❌", err));

// 2. Question Schema
const QuestionSchema = new mongoose.Schema({
    category: String,
    question: String,
    answer: String,
    likes: { type: Number, default: 0 },
    ratings: { type: Number, default: 4 },
    comments: [{
        text: String,
        date: { type: Date, default: Date.now }
    }]
});

const Question = mongoose.model('Question', QuestionSchema);

app.get("/", (req, res) => {
    res.send("AI Interview Backend is running 🚀");

});

// 🔥 PRACTICE QUESTIONS (Infinite Generation Logic)
app.post('/api/practice-questions', async (req, res) => {
    const { category, currentCount = 0 } = req.body;
    try {
        // Step 1: Check DB mein kitne questions hain is category ke
        let questions = await Question.find({ category });

        // Step 2: Agar user ko aur chahiye aur DB mein khatam ho gaye hain
        // Ya agar pehli baar mein 0 hain
        if (questions.length <= currentCount) {
            console.log(`Bhai, ${category} ke liye naye questions generate ho rahe hain... 🧠`);

            const prompt = `
                Provide 15 UNIQUE and high-quality interview questions and answers for: ${category}.
                Important: Make sure these questions are different from basic ones and cover advanced topics too.
                Format: Return ONLY JSON: {"questions": [{"question": "...", "answer": "..."}]}
            `;

            const aiResponse = await generateQuestions(prompt, null, "PRACTICE_MODE");

            // AI ke response ko format karke category attach karo
            const formatted = aiResponse.questions.map(q => ({ ...q, category }));

            // DB mein save karo taaki next time AI ko call na karna pade
            const newBatch = await Question.insertMany(formatted);

            // Pura updated data bhejo
            questions = await Question.find({ category });
        }

        res.json({ questions });
    } catch (err) {
        console.error("PRACTICE ERROR:", err);
        res.status(500).send("Error fetching questions");
    }
});

// 🔥 LIKE API
app.post('/api/questions/like/:id', async (req, res) => {
    try {
        const q = await Question.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { new: true });
        if (!q) return res.status(404).send("Question not found");
        res.json(q);
    } catch (err) { res.status(500).send(err.message); }
});

// 🔥 UNLIKE API
app.post('/api/questions/unlike/:id', async (req, res) => {
    try {
        const q = await Question.findByIdAndUpdate(req.params.id, { $inc: { likes: -1 } }, { new: true });
        if (!q) return res.status(404).send("Question not found");
        res.json(q);
    } catch (err) { res.status(500).send(err.message); }
});

// 🔥 COMMENT API
app.post('/api/questions/comment/:id', async (req, res) => {
    try {
        const { text } = req.body;
        const q = await Question.findById(req.params.id);
        if (!q) return res.status(404).send("Question not found");
        q.comments.push({ text });
        await q.save();
        res.json(q);
    } catch (err) { res.status(500).send(err.message); }
});

// 🔥 TOP QUESTIONS API
app.get('/api/top-questions', async (req, res) => {
    try {
        // Top 10 Liked Questions (Sirf wo jinke 2 se zyada likes hain)
        const top = await Question.find({ likes: { $gte: 2 } })
            .sort({ likes: -1 })
            .limit(10);
        res.json(top);
    } catch (err) { res.status(500).send("Error fetching top questions"); }
});


// --- 1. Start Interview Route ---
app.post('/api/start-interview', upload.single('resume'), async (req, res) => {
    try {
        const { jobDescription, difficulty, language, category } = req.body;

        // Validation: Ya toh file + JD ho, ya selectedCategory ho
        if (!req.file && !category) {
            return res.status(400).json({ error: "Bhai, ya toh resume dalo ya koi category select karo!" });
        }

        let resumeText = "No Resume Provided (Category Mode)";

        // Agar file aayi hai toh process karo
        if (req.file) {
            const resumePath = req.file.path;
            const dataBuffer = fs.readFileSync(resumePath);
            const pdfData = await pdf(dataBuffer);
            resumeText = pdfData.text;
            if (fs.existsSync(resumePath)) fs.unlinkSync(resumePath);
        }

        const langInstruction = language === 'hi-IN' || language === 'Hinglish'
            ? "STRICTLY ask all questions in Hinglish (a mix of Hindi and English words)."
            : "Ask all questions in professional English.";

        // 🔥 Logic Update: Govt Category vs Tech JD
        const contextType = category ? `Govt Exam Category: ${category}` : `Technical Job Role: ${jobDescription}`;

        const customPrompt = `
            Context: Initial Interview Generation.
            Target: ${contextType}
            Level: ${difficulty || 'Junior'}
            Language Instruction: ${langInstruction}
            Resume Text: ${resumeText}
            
            Task: Generate 5 relevant interview questions. 
            Note: If it's for Govt categories (UPP, SSC, Railway), focus on Aptitude, Situational Judgment, and General Knowledge.
            Crucial: Questions must follow the Language Instruction.
        `;

        console.log(`Generating Questions for ${category || 'Tech Job'}... 🧠`);
        const interviewData = await generateQuestions(customPrompt, jobDescription || category, "START");

        res.status(200).json({ success: true, questions: interviewData.questions || [] });

    } catch (error) {
        console.error("START ERROR:", error.message);
        res.status(500).json({ error: "Failed to start interview" });
    }
});

// --- 2. Next Question Route ---
app.post('/api/next-question', async (req, res) => {
    try {
        const { currentQuestion, userAnswer, history, jd, category, difficulty, language, timeTaken } = req.body;

        const langInstruction = language === 'hi-IN' || language === 'Hinglish'
            ? "Ask in Hinglish (Hindi + English mix)."
            : "Ask in professional English.";

        const dynamicPrompt = `
            Interviewer Mode. 
            Category/Role: ${category || jd}
            Level: ${difficulty}. 
            User's Last Answer: ${userAnswer}
            
            TASK:
            1. Evaluate the user's answer.
            2. Ask the next logical technical question.
            3. Set "isCodingRound" true ONLY if coding required.
            2. Ask the next logical question relevant to ${category || jd}.
            3. Set "isCodingRound" to true ONLY if it's a technical coding role. For Govt exams (UPP, SSC), it must be FALSE.

            Return ONLY JSON: {"nextQuestion": "string", "isCodingRound": boolean}
        `;

        const response = await generateQuestions(dynamicPrompt, null, "DYNAMIC_MODE");
        res.status(200).json(response);
    } catch (error) {
        res.status(200).json({ 
            nextQuestion: "Agla sawal: Aapne technical challenges kaise handle kiye?", 
            isCodingRound: false 
        });
    }
});

// --- 3. Interview Analysis Route ---
app.post('/api/analyze-interview', async (req, res) => {
    try {
        const { history, jd, category, difficulty, emotionSummary } = req.body;

        const analysisPrompt = `
            Analyze this ${difficulty} level interview for: ${category || jd}.
            Interview History: ${JSON.stringify(history)}
            Emotions Summary: ${JSON.stringify(emotionSummary)}

            Provide a detailed score out of 10 and a review of strengths and weaknesses.
            Note: For Govt Exams, evaluate communication and situational logic. For Tech, evaluate technical depth.

            Return ONLY valid JSON.
        `;

        const analysis = await generateQuestions(analysisPrompt, null, "ANALYSIS_MODE");
        const finalData = typeof analysis === 'string' ? JSON.parse(analysis) : analysis;
        res.status(200).json(finalData);

    } catch (error) {
        console.error("ANALYSIS ERROR:", error.message);
        res.status(500).json({ error: "Failed to analyze" });
    }
});

// ✅ IMPORTANT: Dynamic PORT (Render fix)
// Port declaration moved to bottom after all routes.
app.post('/api/practice-questions', async (req, res) => {
    const { category } = req.body;
    try {
        const prompt = `
            You are an expert Mentor and Interviewer. Provide 15 UNIQUE interview questions for: ${category}.
            
            STRICT ANSWER GUIDELINES:
            1. Language: Hinglish (Hindi + English mix) if it's a Govt Exam, otherwise professional English.
            2.QUALITY: Answers must be detailed, human-like, and professional.
            3. EXAMPLES: If a concept can be explained with an example (like code in Tech or a real-life scenario in Govt exams), YOU MUST include it.
            4. STRUCTURE: Use sub-headings or small paragraphs. Avoid long robotic bullet points.
            5. DIFFICULTY: Assign a difficulty level (Easy, Medium, or Hard) to each question based on the depth.
            6. Format: Return ONLY a JSON array of objects: 
               {"questions": [{"question": "...", "answer": "..."}]}
        `;

        const response = await generateQuestions(prompt, null, "PRACTICE_MODE");
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch practice questions" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server is flying on port ${PORT}`));
