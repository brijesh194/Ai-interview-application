const Groq = require("groq-sdk");
require("dotenv").config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const generateQuestions = async (inputA, inputB, mode = "START", category = null) => {
  try {
    console.log(`Calling Groq AI (${mode})... ⚡`);
    
    let systemPrompt = "";
    let userPrompt = "";

    if (mode === "DYNAMIC_MODE") {
      // Dynamic mode logic for both Tech and Govt
      systemPrompt = `You are a professional interviewer. 
      Analyze the user's last answer and ask the next logical follow-up question. 
      If the context is technical/coding, set 'isCodingRound' to true if needed. 
      If the context is Government Exams (GK, GS, Situational), set 'isCodingRound' to false.
      Return strictly JSON with 'nextQuestion' and 'isCodingRound' keys.`;
      userPrompt = inputA; 
    } 
    else if (mode === "ANALYSIS_MODE") {
      systemPrompt = "You are a Senior Recruiter and Evaluator. Provide a professional interview performance analysis based on the history provided. Return JSON format only.";
      userPrompt = inputA;
    }
    else {
      // 🔥 START MODE: Smart Detection for Resume vs Govt Category
      if (category && category !== "") {
        // CASE 1: Government Exam Category Mode
        systemPrompt = `You are an expert interviewer for Government Exams like ${category}. 
        Your goal is to assess the candidate's knowledge in General Studies, Current Affairs, 
        Department-specific rules, and Situational Judgment. Return strictly as JSON object.`;
        
        userPrompt = `Generate 5 challenging interview questions for a candidate preparing for the ${category} exam. 
        Focus on: 
        1. General Knowledge/Current Affairs 
        2. Situational/Scenario-based questions (e.g., Law & Order for Police) 
        3. Basic Aptitude or Mental Ability.
        Format: {"questions": ["q1", "q2", "q3", "q4", "q5"]}`;
      } 
      else {
        // CASE 2: Normal Resume Mode (Tech/Private Jobs)
        systemPrompt = "You are a professional technical interviewer. Return strictly as JSON object.";
        userPrompt = `Analyze this Resume: ${inputA} and Job Description: ${inputB}. 
            Generate 5 specific technical interview questions based on the candidate's skills.
            Format: {"questions": ["q1", "q2", "q3", "q4", "q5"]}`;
      }
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    const content = chatCompletion.choices[0].message.content;
    return JSON.parse(content);

  } catch (error) {
    console.error("Groq AI Error:", error.message);
    
    // Fallback logic for Govt/Tech
    if (mode === "DYNAMIC_MODE") {
        return { nextQuestion: "Please explain your point in more detail?", isCodingRound: false };
    }
    return { 
        questions: [
          "Tell me about your preparation strategy.", 
          "How do you handle high-pressure situations?",
          "Why do you want to join this department?",
          "What are your top 3 strengths?",
          "How will you contribute to society through this role?"
        ] 
    };
  }
};

module.exports = { generateQuestions };