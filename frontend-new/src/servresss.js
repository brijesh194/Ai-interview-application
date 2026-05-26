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

// --- API Endpoints ---

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
        if(!q) return res.status(404).send("Question not found");
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
        if(!q) return res.status(404).send("Question not found");
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

// --- Interview Routes ---
app.post('/api/start-interview', upload.single('resume'), async (req, res) => {
    try {
        const { jobDescription, difficulty, language, category } = req.body;
        let resumeText = "No Resume Provided";
        if (req.file) {
            const dataBuffer = fs.readFileSync(req.file.path);
            const pdfData = await pdf(dataBuffer);
            resumeText = pdfData.text;
            fs.unlinkSync(req.file.path);
        }
        const langInstruction = language === 'hi-IN' || language === 'Hinglish' ? "in Hinglish" : "in English";
        const customPrompt = `Generate 5 interview questions ${langInstruction} for ${category || jobDescription}. Level: ${difficulty}. Resume: ${resumeText}`;
        const interviewData = await generateQuestions(customPrompt, jobDescription || category, "START");
        res.status(200).json({ success: true, questions: interviewData.questions || [] });
    } catch (error) { res.status(500).json({ error: "Failed to start interview" }); }
});

app.post('/api/next-question', async (req, res) => {
    try {
        const { userAnswer, category, jd, difficulty, language } = req.body;
        const dynamicPrompt = `User Answer: ${userAnswer}. Ask next question for ${category || jd} in ${language}. Return JSON: {"nextQuestion": "...", "isCodingRound": boolean}`;
        const response = await generateQuestions(dynamicPrompt, null, "DYNAMIC_MODE");
        res.status(200).json(response);
    } catch (error) { res.status(200).json({ nextQuestion: "Technical issue, please continue.", isCodingRound: false }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server flying on port ${PORT}`));