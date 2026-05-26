import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import './App.css';
// App.jsx mein check karo

import axios from 'axios';
import Editor from "@monaco-editor/react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import {
  Upload, FileText, Play, CheckCircle, Loader2,
  Mic, MicOff, Volume2, ChevronRight, RotateCcw,
  LayoutDashboard, Video, ShieldCheck, Award, TrendingUp, XCircle,
  BrainCircuit, MessageSquare, UserCheck, Activity, Globe, BarChart3, Clock, AlertTriangle, Layers, Search, BookOpen, Home
} from 'lucide-react';


const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
}

// --- NEW COMPONENT: PRACTICE PAGE ---
function PracticePage() {
  const [selectedCat, setSelectedCat] = useState('HTML');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visibleAnswers, setVisibleAnswers] = useState({});

  // 🔥 NEW STATE: For searching categories
  const [searchTerm, setSearchTerm] = useState('');

  const [commentText, setCommentText] = useState({});
  const [activeCommentBox, setActiveCommentBox] = useState(null);

  const [copiedId, setCopiedId] = useState(null); // Track karega ki kaunsa copy hua

  // Yahan tum jitni marzi categories add karo, search bar sab handle kar lega
  const cats = [
    'HTML', 'CSS',
    'JavaScript', 'Java Developer', 'React.js', 'Python', 'Node.js', 'Spring Boot', 'Ruby Developer', 'Swift Developer', 'Kotlin Developer', 'Scala Developer', 'TypeScript Developer', 'Angular Developer', 'Vue.js Developer', 'Django Developer', 'Flask Developer', 'Ruby on Rails Developer', 'Laravel Developer', 'Full Stack Java Developer', 'Data Scientist', 'Data Analyst', 'React Native Developer',
    'UPPSC', 'UPSC', 'Banking', 'NDA', 'Indian Army', 'Navy', 'Software Engineer', 'Data Scientist', 'UI/UX Designer', 'Game Development', 'Blockchain Developer', 'Digital Marketing', 'Graphic Designing', 'Video Editing', 'Business Analyst', 'Product Manager', 
    'Android Developer', 'iOS Developer', 'Flutter Developer', 'React Native Developer', 'Data Structures & Algorithms (DSA)', 'Machine Learning', 'Artificial Intelligence', 'Data Science', 'DevOps Engineer', 'Cloud Engineer (AWS / Azure / GCP)', 'Cyber Security', 'Network Security', 'Ethical Hacking',
    'Database Administrator (DBA)', 'QA / Software Testing', 'CDS', 'UP Police (UPP)', 'SSC / SSC GD', 'Railway (RRB)', 'SSC CGL', 'SSC CHSL', 'SSC MTS', 'Railway NTPC', 'Group D', 'ALP / Technician', 'UP Lekhpal', 'VDO', 'UPSSSC PET', 'Judiciary (PCS J)', 'CLAT (Law entrance)', 'NEET (Doctor)', 'Nursing', 'Pharmacist', 'UPTET / CTET (Teaching)', 'RBI Grade B', 'Fireman / Jail Warder']

  // 🔥 FILTER LOGIC: Categories ko search ke hisab se filter karna
  const filteredCats = cats.filter(c =>
    c.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchQuestions = async (category) => {
    setLoading(true);
    try {
      const res = await axios.post('https://ai-interview-application-1-7eg8.onrender.com/api/practice-questions', { category });
      setQuestions(res.data.questions);
    } catch (err) {
      alert("Error fetching questions!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuestions(selectedCat); }, [selectedCat]);
  const [likedQuestions, setLikedQuestions] = useState([]);

  const handleLikeToggle = async (id, index) => {
    const isAlreadyLiked = likedQuestions.includes(id);
    const endpoint = isAlreadyLiked ? 'unlike' : 'like';

    try {
      const res = await axios.post(`https://ai-interview-application-1-7eg8.onrender.com/api/questions/${endpoint}/${id}`);

      // Local State update karo
      const updatedQuestions = [...questions];
      updatedQuestions[index].likes = res.data.likes;
      setQuestions(updatedQuestions);

      // Liked list update karo
      if (isAlreadyLiked) {
        setLikedQuestions(prev => prev.filter(qId => qId !== id));
      } else {
        setLikedQuestions(prev => [...prev, id]);
      }
    } catch (err) {
      console.error("Action failed");
    }
  };

  // 🔥 LIKE FUNCTION (MongoDB Update)
  const handleLike = async (id, index) => {
    try {
      const res = await axios.post(`https://ai-interview-application-1-7eg8.onrender.com/api/questions/like/${id || index}`);
      // Update local state to show instant like
      const newQuestions = [...questions];
      newQuestions[index].likes = (newQuestions[index].likes || 0) + 1;
      setQuestions(newQuestions);
    } catch (err) { console.log("Like failed"); }
  };

  // 🔥 COMMENT FUNCTION
  const handleComment = async (id, index) => {
    const text = commentText[index];
    if (!text) return;
    try {
      await axios.post(`https://ai-interview-application-1-7eg8.onrender.com/api/questions/comment/${id || index}`, { text });
      alert("Comment posted!");
      setCommentText({ ...commentText, [index]: "" });
    } catch (err) { console.log("Comment failed"); }
  };


  // PracticePage ke andar ye function update karo
  const loadMoreQuestions = async () => {
    setLoading(true);
    try {
      const res = await axios.post('https://ai-interview-application-1-7eg8.onrender.com/api/practice-questions', {
        category: selectedCat,
        currentCount: questions.length // Batana ki abhi hamare paas kitne hain
      });
      setQuestions(res.data.questions);
    } catch (err) {
      alert("Error loading more questions!");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id); // Icon ke pas message dikhane ke liye ID set karo

    // 2 second baad message gayab karne ke liye
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const toggleAnswer = (index) => {
    setVisibleAnswers(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <header className="mb-12 text-center">
        <h2 className="text-4xl font-black text-white mb-4 italic">Community <span className="text-blue-500">Learning Hub</span></h2>
        <p className="text-slate-500 font-medium">Practice most-liked questions and improve with AI-humanized answers.</p>

        <div className="max-w-md mx-auto mt-8 relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={18} className="text-blue-500" />
          </div>
          <input
            type="text"
            placeholder="Search topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-blue-500 transition-all text-white"
          />
        </div>
      </header>

      <div className="flex flex-wrap gap-3 justify-center mb-12 max-h-[160px] overflow-y-auto p-2 custom-scrollbar">
        {filteredCats.map(c => (
          <button
            key={c}
            onClick={() => setSelectedCat(c)}
            className={`px-6 py-2.5 rounded-xl font-bold text-[10px] uppercase border transition-all ${selectedCat === c ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-800/40 border-slate-700 text-slate-500 hover:border-blue-500/50'}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-8 max-w-4xl mx-auto">
        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
        ) : (
          questions.map((item, index) => (
            <div key={index} className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 backdrop-blur-sm border-l-4 border-l-blue-600/30 hover:border-l-blue-600 transition-all group">
              <h3 className="text-xl font-bold text-slate-100 mb-6 leading-relaxed">
                <span className="text-blue-500/50 font-mono text-sm mr-2">Q{index + 1}</span> {item.question}

              </h3>


              <div className="flex flex-wrap items-center gap-6">
                <button
                  onClick={() => toggleAnswer(index)}
                  className="bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600 hover:text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all"
                >
                  {visibleAnswers[index] ? 'Hide Answer' : 'Show Answer'}
                </button>

                {/* LIKE & RATING SECTION */}
                <div className="flex items-center gap-4 ml-auto">

                  <div className="relative flex items-center">
                    {/* 🔥 Copied Message (Floating near icon) */}
                    {copiedId === (item._id || index) && (
                      <span className="absolute right-10 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-md animate-in fade-in zoom-in duration-300">
                        Copied!
                      </span>
                    )}

                    <button
                      onClick={() => copyToClipboard(`Question: ${item.question}\n\nAnswer: ${item.answer}`, (item._id || index))}
                      className={`p-2 rounded-xl transition-all ${copiedId === (item._id || index) ? 'text-blue-400' : 'text-slate-500 hover:text-white'}`}
                      title="Copy to Clipboard"
                    >
                      {copiedId === (item._id || index) ? <CheckCircle size={18} /> : <FileText size={18} />}
                    </button>
                  </div>

                  <button
                    onClick={() => handleLikeToggle(item._id, index)}
                    className={`flex items-center gap-2 transition-all ${likedQuestions.includes(item._id) ? "text-red-500 scale-110" : "text-slate-500 hover:text-red-400"}`}
                  >
                    <TrendingUp size={18} fill={likedQuestions.includes(item._id) ? "currentColor" : "none"} />
                    <span className="text-xs font-black">{item.likes || 0}</span>
                  </button>

                  <button onClick={() => setActiveCommentBox(activeCommentBox === index ? null : index)} className="flex items-center gap-2 text-slate-500 hover:text-blue-500 transition-all">
                    <MessageSquare size={18} />
                    <span className="text-xs font-black">{item.comments?.length || 0}</span>
                  </button>

                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => <Award key={s} size={14} className={s <= (item.ratings || 4) ? "text-yellow-500" : "text-slate-700"} />)}
                  </div>
                </div>
              </div>

              {/* Comment Input */}
              {activeCommentBox === index && (
                <div className="mt-4 flex gap-2 animate-in fade-in slide-in-from-top-2">
                  <input
                    className="flex-1 bg-black/40 border border-slate-800 rounded-xl px-4 py-2 text-xs outline-none focus:border-blue-500"
                    placeholder="Add a helpful comment..."
                    value={commentText[index] || ""}
                    onChange={(e) => setCommentText({ ...commentText, [index]: e.target.value })}
                  />
                  <button onClick={() => handleComment(item._id, index)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold">POST</button>
                </div>
              )}

              {visibleAnswers[index] && (
                <div className="mt-8 p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                  <p className="text-slate-300 leading-relaxed text-sm font-medium">
                    <span className="text-blue-500 font-black block mb-3 text-[10px] uppercase tracking-widest">Master Answer:</span>
                    {item.answer}
                  </p>
                </div>
              )}


            </div>
          ))
        )}
      </div>
      {questions.length > 0 && (
        <div className="flex justify-center mt-12 mb-20">
          <button
            onClick={loadMoreQuestions}
            disabled={loading}
            className="group relative px-10 py-4 bg-slate-900 border border-blue-500/30 rounded-2xl font-black text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-[0_0_20px_rgba(59,130,246,0.1)]"
          >
            {loading ? <Loader2 className="animate-spin" /> : "EXPLORE MORE QUESTIONS +"}

            {/* Glow effect */}
            <div className="absolute inset-0 rounded-2xl bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        </div>
      )}
    </div>


  );
}

// --- TOP QUESTIONS PAGE COMPONENT ---
function TopQuestions() {
  const [topList, setTopList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('https://ai-interview-application-1-7eg8.onrender.com/api/top-questions')
      .then(res => {
        setTopList(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-16 px-6 min-h-screen">
      <div className="text-center mb-16">
        <h2 className="text-5xl font-black text-white mb-4 italic uppercase tracking-tighter">
          Hall of <span className="text-yellow-500">Fame</span> ⭐
        </h2>
        <p className="text-slate-500 font-mono text-sm tracking-widest uppercase">Community's Most Liked Interview Questions</p>
      </div>

      <div className="grid gap-8">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-yellow-500" size={48} /></div>
        ) : topList.length > 0 ? (
          topList.map((q, i) => (
            <div key={q._id} className="relative group">
              {/* Rank Badge */}
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-slate-950 border-2 border-yellow-500/50 rounded-2xl flex items-center justify-center font-black text-yellow-500 z-10 shadow-[0_0_20px_rgba(234,179,8,0.2)] group-hover:border-yellow-500 transition-all">
                #{i + 1}
              </div>

              <div className="pl-14 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 backdrop-blur-xl group-hover:border-yellow-500/20 transition-all duration-500">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] bg-slate-800/50 px-4 py-1.5 rounded-full border border-slate-700">
                    {q.category}
                  </span>
                  <div className="flex items-center gap-2 text-yellow-500 font-black text-sm">
                    <TrendingUp size={16} /> {q.likes} Likes
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 leading-tight">{q.question}</h3>
                <div className="p-6 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl">
                  <p className="text-slate-400 text-sm leading-relaxed">{q.answer}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-slate-900/20 rounded-[3rem] border border-dashed border-slate-800">
            <p className="text-slate-500 italic">Abhi koi trending question nahi hai. Practice page par jaakar like karo!</p>
          </div>
        )}
      </div>
    </div>
  );
}


// --- WRAPPER COMPONENT FOR INTERVIEW FLOW ---
const InterviewHome = () => {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [answers, setAnswers] = useState({});
  const [emotion, setEmotion] = useState("Neutral");
  const [history, setHistory] = useState([]);
  const [isCodingRound, setIsCodingRound] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [difficulty, setDifficulty] = useState('Junior');
  const [language, setLanguage] = useState('en-US');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const categoriesList = [
    { id: 'html', name: 'HTML/CSS' },
    // { id: 'css', name: 'CSS' },
    { id: 'javascript', name: 'JavaScript' },
    { id: 'React.js', name: 'React.js' },
    { id: 'java', name: 'Java Developer' },
    {id: 'c++', name: 'C++ Developer' },
    {id: 'c#', name: 'C# Developer' },
    { id: 'golang', name: 'Golang Developer' },
    {id: 'php', name: 'PHP Developer' },
    {id: 'ruby', name: 'Ruby Developer' },
    {id: 'swift', name: 'Swift Developer' },
    {id: 'kotlin', name: 'Kotlin Developer' },
    {id: 'scala', name: 'Scala Developer' },
    {id: 'typescript', name: 'TypeScript Developer' },
    {id: 'angular', name: 'Angular Developer' },
    {id: 'vue.js', name: 'Vue.js Developer' },
    {id: 'spring', name: 'Spring Framework' },
    {id: 'springBoot', name: 'Spring Boot' },
    {id: 'django', name: 'Django Developer' },
    {id: 'flask', name: 'Flask Developer' },
    {id: 'ruby_on_rails', name: 'Ruby on Rails Developer' },
    {id: 'laravel', name: 'Laravel Developer' },
    {id: 'Full Stack Java Developer', name: 'Full Stack Java Developer' },
    {id: 'Node.js', name: 'Node.js Developer' },
    { id: 'python', name: 'Python Developer' },
    { id: 'dsa', name: 'Data Structures & Algorithms' },
    { id: 'node.js', name: 'Node.js' },
    { id: 'fullstack', name: 'Full Stack Developer' },
    { id: 'Software Engineer', name: 'Software Engineer' },
    { id: 'devops', name: 'DevOps Engineer' },
    { id: 'Android Developer', name: 'Android Developer' },
    { id: 'iOS Developer', name: 'iOS Developer' },
    { id: 'Flutter Developer', name: 'Flutter Developer' },
    { id: 'data_science', name: 'Data Scientist' },
    { id: 'data_analyst', name: 'Data Analyst' },
    { id: 'React Native Developer', name: 'React Native Developer' },

    { id: 'machine_learning', name: 'Machine Learning Engineer' },
    { id: 'Artificial Intelligence', name: 'Artificial Intelligence' },
    { id: 'cloud_computing', name: 'Cloud Computing' },
    { id: 'Deep Learning', name: 'Deep Learning' },
    { id: 'DevOps Engineer', name: 'DevOps Engineer' },
    { id: 'Cloud Engineer (AWS / Azure / GCP)', name: 'Cloud Engineer (AWS / Azure / GCP)' },
    { id: 'Site Reliability Engineer (SRE)', name: 'Site Reliability Engineer (SRE)' },
    { id: 'Cybersecurity Specialist', name: 'Cybersecurity Specialist' },
    { id: 'Ethical Hacking', name: 'Ethical Hacking' },
    { id: 'Network Security', name: 'Network Security' },

    { id: 'Database Administrator (DBA)', name: 'Database Administrator (DBA)' },
    { id: 'Big Data (Hadoop, Spark)', name: 'Big Data (Hadoop, Spark)' },

    { id: 'UI/UX Designer', name: 'UI/UX Designer' },
    { id: 'Game Development', name: 'Game Development' },
    { id: 'Blockchain Developer', name: 'Blockchain Developer' },
    { id: 'Digital Marketing', name: 'Digital Marketing' },
    { id: 'Graphic Designing', name: 'Graphic Designing' },
    { id: 'Video Editing', name: 'Video Editing' },
    { id: 'Business Analyst', name: 'Business Analyst' },
    { id: 'Product Manager', name: 'Product Manager' },


    { id: 'upp', name: 'UP Police (UPP)' },
    { id: 'ssc_gd', name: 'SSC GD / Constable' },
    { id: 'army', name: 'Indian Army / Agniveer' },
    { id: 'nda', name: 'NDA / CDS (Defence)' },
    { id: 'airforce', name: 'Indian Air Force' },
    { id: 'navy', name: 'Indian Navy' },
    { id: 'paramilitary', name: 'Paramilitary Forces' },

    { id: 'uppsc', name: 'UPPSC / PCS' },
    { id: 'upsc', name: 'UPSC (Civil Services)' },

    { id: 'lekhpal', name: 'UP Lekhpal / VDO' },
    { id: 'ssc_cgl', name: 'SSC CGL / CHSL' },
    { id: 'SSC MTS', name: 'SSC MTS' },

    { id: 'banking', name: 'IBPS / SBI PO & Clerk' },
    { id: 'insurance', name: 'Insurance (LIC / GIC)' },
    { id: 'IBPS PO / Clerk', name: 'IBPS PO / Clerk' },
    { id: 'RBI Grade B', name: 'RBI Grade B' },


    { id: 'rbi', name: 'RBI Grade B' },
    { id: 'uptet', name: 'UPTET / CTET (Teaching)' },
    { id: 'railway', name: 'Railway (NTPC/Group D)' },
    { id: 'medical', name: 'Medical / Nursing' },
    { id: 'NEET (Doctor)', name: 'NEET (Doctor)' },
    { id: 'Nursing', name: 'Nursing' },


    { id: 'law', name: 'Law / Judiciary' },
    { id: 'fireman', name: 'Fireman / Jail Warder' },
    { id: 'pet', name: 'UPSSSC PET' }
  ];

  const [emotionLog, setEmotionLog] = useState([]);
  const [interviewAnalysis, setInterviewAnalysis] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [proctoringMessage, setProctoringMessage] = useState("");
  const videoRef = useRef(null);

  const speak = (text) => {
    if (!text || !isInterviewStarted) return;
    window.speechSynthesis.cancel();
    setTimeout(() => {
      const msg = new SpeechSynthesisUtterance(text);
      msg.rate = 0.95;
      msg.pitch = 1;
      window.speechSynthesis.speak(msg);
    }, 150);
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isInterviewStarted) {
        alert("CHEATING DETECTED: Interview terminated for tab switching.");
        window.location.reload();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isInterviewStarted]);

  const runProctoring = async () => {
    if (videoRef.current && isInterviewStarted && !showResult && videoRef.current.readyState === 4) {
      try {
        const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 })).withFaceLandmarks();
        if (!detection) {
          setProctoringMessage("FACE NOT DETECTED");
          setWarnings(prev => prev + 2);
        } else {
          const landmarks = detection.landmarks;
          const nose = landmarks.getNose();
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();
          const eyeCenter = (leftEye[0].x + rightEye[3].x) / 2;
          const noseTip = nose[3].x;
          const faceRotation = Math.abs(noseTip - eyeCenter);
          const sensitivityThreshold = 12;
          if (faceRotation > sensitivityThreshold) {
            setProctoringMessage("WARNING: LOOK AT THE SCREEN");
            setWarnings(prev => prev + 1);
          } else {
            setProctoringMessage("");
            setWarnings(prev => Math.max(0, prev - 0.5));
          }
        }
        if (warnings > 10) {
          alert("CHEATING DETECTED: Interview terminated for looking away.");
          window.location.reload();
        }
      } catch (err) { console.log("Detection skip..."); }
    }
  };

  useEffect(() => {
    let proctorInterval;
    if (isInterviewStarted) { proctorInterval = setInterval(runProctoring, 2000); }
    return () => clearInterval(proctorInterval);
  }, [isInterviewStarted, currentQuestionIndex]);

  useEffect(() => {
  let timer;

  // 1. Timer logic (sirf tab chale jab time bacha ho aur AI na soch raha ho)
  if (isInterviewStarted && timeLeft > 0 && !isTimeUp && !isAiThinking) {
    timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
  } 
  
  // 2. 🔥 Auto-Next Logic (Sawal skip na ho uske liye "isAiThinking" check lagaya hai)
  else if (timeLeft === 0 && isInterviewStarted && !isAiThinking && !isTimeUp) {
    // isTimeUp ko true karo taaki ye block dubara na chale
    setIsTimeUp(true); 
    
    if (isListening) toggleListening();
    
    speak("Time is up! Moving to the next question.");

    // Chota sa delay taaki user ko "Time Up" sunai de, phir sirf EK baar nextQuestion call ho
    const autoNextTimeout = setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        // Double check taaki api call ke beech me naya sawal na mang le
        nextQuestion(); 
      } else {
        finishInterview();
      }
    }, 1500);

    return () => clearTimeout(autoNextTimeout);
  }

  return () => clearTimeout(timer);
}, [timeLeft, isTimeUp, isInterviewStarted, isAiThinking, currentQuestionIndex]);

  useEffect(() => { setTimeLeft(120); setIsTimeUp(false); }, [currentQuestionIndex]);

  useEffect(() => { if (isInterviewStarted && questions[currentQuestionIndex]) { speak(questions[currentQuestionIndex]); } }, [currentQuestionIndex, isInterviewStarted]);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
      } catch (err) { console.error("Models failed", err); }
    };
    loadModels();
  }, []);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => { if (videoRef.current) videoRef.current.srcObject = stream; })
      .catch((err) => console.error(err));
  };

  const handleVideoPlay = () => {
    setInterval(async () => {
      if (videoRef.current && !videoRef.current.paused) {
        const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
        if (detections.length > 0) {
          const expressions = detections[0].expressions;
          const max = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
          setEmotion(max);
          if (isInterviewStarted) {
            const confidenceScore = (expressions.happy + expressions.neutral) * 100;
            const stressScore = (expressions.sad + expressions.fearful + expressions.angry + expressions.disgusted) * 100;
            setEmotionLog(prev => [...prev, { time: prev.length, confidence: Math.round(confidenceScore), stress: Math.round(stressScore), emotion: max }]);
          }
        }
      }
    }, 1000);
  };

  const toggleListening = () => {
    if (isTimeUp) return alert("Bhai, time khatam ho gaya hai!");
    if (isListening) { recognition.stop(); setIsListening(false); }
    else { setTranscript(''); if (recognition) recognition.lang = language; recognition.start(); setIsListening(true); }
  };

  useEffect(() => {
    if (!recognition) return;
    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) { setAnswers(prev => ({ ...prev, [currentQuestionIndex]: (prev[currentQuestionIndex] || '') + event.results[i][0].transcript + ' ' })); }
        else { interim += event.results[i][0].transcript; }
      }
      setTranscript(interim);
    };
    recognition.onerror = () => setIsListening(false);
  }, [currentQuestionIndex]);

  const handleUpload = async () => {
    if (!file && !selectedCategory) return alert("Bhai, Resume dalo ya Category select karo!");
    if (file && !jd) return alert("Bhai, Job Description bhi dalo!");
    setLoading(true);
    const formData = new FormData();
    if (file) formData.append('resume', file);
    formData.append('jobDescription', jd);
    formData.append('category', selectedCategory);
    formData.append('difficulty', difficulty);
    formData.append('language', language === 'hi-IN' ? 'Hinglish' : 'English');
    try {
      const res = await axios.post('https://ai-interview-application-1-7eg8.onrender.com/api/start-interview', formData);
      setQuestions(res.data.questions);
    } catch (err) { alert("Server Error!"); }
    setLoading(false);
  };

  const nextQuestion = async () => {
    if (isAiThinking) return;
    if (recognition) recognition.stop();
    setIsListening(false);
    const currentAns = isCodingRound ? (answers[currentQuestionIndex] || "// No code submitted") : (transcript || answers[currentQuestionIndex] || "No answer");
    const updatedHistory = [...history, { q: questions[currentQuestionIndex], a: currentAns, timeTaken: 120 - timeLeft }];
    setHistory(updatedHistory);
    setTranscript('');
    setIsAiThinking(true);
    try {
      const res = await axios.post('https://ai-interview-application-1-7eg8.onrender.com/api/next-question', { currentQuestion: questions[currentQuestionIndex], userAnswer: currentAns, history: updatedHistory, jd: jd, category: selectedCategory, difficulty: difficulty, language: language });
      const data = res.data;
      setIsCodingRound(data.isCodingRound);
      setQuestions(prev => [...prev, data.nextQuestion]);
      setCurrentQuestionIndex(prev => prev + 1);
    } catch (err) { console.error(err); }
    finally { setIsAiThinking(false); }
  };

  const finishInterview = async () => {
    setIsAiThinking(true);
    window.speechSynthesis.cancel();
    setIsInterviewStarted(false);
    const currentAns = transcript || answers[currentQuestionIndex] || "No answer";
    const finalHistory = [...history, { q: questions[currentQuestionIndex], a: currentAns }];
    try {
      const res = await axios.post('https://ai-interview-application-1-7eg8.onrender.com/api/analyze-interview', { history: finalHistory, jd: jd, category: selectedCategory, difficulty: difficulty, emotionSummary: emotionLog });
      const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
      setInterviewAnalysis(data);
      setShowResult(true);
    } catch (err) { alert("Analysis failed!"); setIsInterviewStarted(true); }
    finally { setIsAiThinking(false); }
  };


  if (showResult && interviewAnalysis) {
    return (
      <div className="min-h-screen bg-[#020617] text-white p-6 md:p-12 flex flex-col items-center overflow-y-auto">
        <div className="max-w-6xl w-full space-y-8">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10"><Award size={120} /></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
              <div>
                <h1 className="text-5xl font-black mb-2 tracking-tight">Interview <span className="text-blue-500">Verdict</span></h1>
                <p className="text-slate-400 font-mono tracking-widest uppercase text-sm">Performance Analysis Report</p>
              </div>
              <div className="flex gap-6">
                <div className="text-center px-8 py-4 bg-slate-800/50 rounded-3xl border border-slate-700">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Score</p>
                  <p className="text-4xl font-black text-blue-400">{interviewAnalysis.overallScore}</p>
                </div>
                <div className="text-center px-8 py-4 bg-blue-600 rounded-3xl shadow-lg shadow-blue-600/20">
                  <p className="text-[10px] font-bold text-blue-100 uppercase mb-1">Status</p>
                  <p className="text-xl font-black uppercase whitespace-nowrap">{interviewAnalysis.finalVerdict}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-bold flex items-center gap-2 uppercase tracking-tighter text-slate-300"><Activity className="text-blue-500" size={20} /> Confidence vs Stress Trend</h3>
                  <div className="flex gap-4 text-[10px] font-bold">
                    <span className="flex items-center gap-1 text-green-400"><div className="w-2 h-2 bg-green-400 rounded-full" /> CONFIDENCE</span>
                    <span className="flex items-center gap-1 text-red-400"><div className="w-2 h-2 bg-red-400 rounded-full" /> STRESS</span>
                  </div>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={emotionLog}>
                      <defs>
                        <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                        <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} /><XAxis dataKey="time" hide /><YAxis stroke="#475569" fontSize={10} /><Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b' }} />
                      <Area type="monotone" dataKey="confidence" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorConf)" name="Confidence %" /><Area type="monotone" dataKey="stress" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorStress)" name="Stress Level %" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 mt-10">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-blue-400"><MessageSquare size={22} /> Question-wise Detailed Review</h3>
                <div className="space-y-6">
                  {interviewAnalysis.detailedHistory && interviewAnalysis.detailedHistory.length > 0 ? (
                    interviewAnalysis.detailedHistory.map((item, index) => (
                      <div key={index} className={`p-6 rounded-3xl border ${item.isCorrect ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                        <div className="flex justify-between items-center mb-4"><span className="text-[10px] font-black uppercase px-3 py-1 bg-slate-800 rounded-full text-slate-400">Question {index + 1}</span><span className={`text-[10px] font-black px-3 py-1 rounded-full ${item.isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{item.isCorrect ? "PASSED" : "FAILED"}</span></div>
                        <p className="text-white font-medium mb-4 italic">"{item.q}"</p>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="p-4 bg-black/40 rounded-2xl border border-white/5"><p className="text-[9px] font-bold text-slate-500 uppercase mb-2">Your Response</p><p className="text-sm text-slate-300">{item.a || "No answer provided"}</p></div>
                          {!item.isCorrect && (<div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20"><p className="text-[9px] font-bold text-blue-400 uppercase mb-2">Ideal Answer</p><p className="text-sm text-blue-100">{item.correctAnswer}</p></div>)}
                        </div>
                      </div>
                    ))
                  ) : (<p className="text-slate-500 italic">No detailed review available.</p>)}
                </div>
              </div>
            </div>
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 h-full">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] mb-8 text-slate-500">Skill Breakdown</h3>
                <div className="space-y-10">
                  <div className="space-y-3"><div className="flex justify-between text-[10px] font-black uppercase"><span className="text-slate-400">Performance</span> <span className="text-blue-500">8/10</span></div><div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[80%]" /></div></div>
                  <div className="space-y-3"><div className="flex justify-between text-[10px] font-black uppercase"><span className="text-slate-400">Communication</span> <span className="text-indigo-500">7/10</span></div><div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 w-[70%]" /></div></div>
                  <div className="space-y-3"><div className="flex justify-between text-[10px] font-black uppercase"><span className="text-slate-400">Emotional Control</span> <span className="text-green-500">9/10</span></div><div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[90%]" /></div></div>
                </div>
              </div>
            </div>
          </div>
          <button onClick={() => window.location.reload()} className="w-full bg-white text-black py-6 rounded-[2rem] font-black text-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-3 shadow-xl"><RotateCcw /> RESTART SIMULATION</button>
        </div>
      </div>
    );
  }

  if (isInterviewStarted) {
    return (
      <div className="min-h-screen bg-[#020617] text-white p-6 flex flex-col items-center relative">
        <header className="w-full max-w-6xl flex justify-between items-center mb-8">
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div><span className="font-mono text-sm tracking-widest text-slate-400 uppercase">{isCodingRound ? 'Coding Challenge' : 'Exam Session'}</span></div>
          <div className={`flex items-center gap-3 px-6 py-2 rounded-full border transition-all duration-500 ${timeLeft < 10 ? 'bg-red-500/20 border-red-500 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-slate-800/50 border-slate-700'
            }`}>
            <Clock size={16} className={timeLeft < 10 ? 'text-red-500' : 'text-slate-400'} />
            <span className={`font-mono text-xl font-black ${timeLeft < 10 ? 'text-red-500' : 'text-white'}`}>
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </span>
          </div>
          <div className="flex gap-4"><div className="bg-blue-600/20 px-4 py-1 rounded-full border border-blue-500/30 text-[10px] text-blue-400 font-black uppercase">{selectedCategory || difficulty}</div><div className="bg-slate-800/50 px-4 py-1 rounded-full border border-slate-700 text-xs text-blue-400 font-bold">Q {currentQuestionIndex + 1}</div></div>
        </header>
        <div className="w-full max-w-7xl grid lg:grid-cols-12 gap-8 flex-1">
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-8 backdrop-blur-xl flex-1 shadow-2xl overflow-y-auto">
              <div className="mb-8"><p className="text-blue-500 text-[10px] font-bold uppercase mb-2 tracking-[0.2em]">Interviewer:</p><h2 className="text-2xl font-medium leading-relaxed italic text-slate-100 italic">"{questions[currentQuestionIndex]}"</h2></div>
              {isCodingRound ? (
                <div className="rounded-2xl border border-slate-800 overflow-hidden h-[400px] shadow-2xl"><Editor height="100%" theme="vs-dark" defaultLanguage="javascript" defaultValue="// Write your code here..." onChange={(value) => setAnswers(prev => ({ ...prev, [currentQuestionIndex]: value }))} options={{ minimap: { enabled: false }, fontSize: 14, padding: { top: 20 } }} /></div>
              ) : (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 min-h-[200px] shadow-inner"><p className="text-slate-600 text-[10px] font-bold mb-4 uppercase">Live Transcript</p><p className="text-lg leading-relaxed text-slate-400">{answers[currentQuestionIndex] || ''}<span className="text-blue-500 border-l-2 border-blue-500 ml-1 pl-1">{transcript}</span></p></div>
              )}
            </div>
            <div className="flex gap-4">
              <button onClick={toggleListening} disabled={isTimeUp} className={`flex-1 py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${isListening ? 'bg-red-500 shadow-lg shadow-red-500/20' : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'} ${isTimeUp ? 'opacity-50 cursor-not-allowed' : ''}`}>{isListening ? <MicOff /> : <Mic />} {isListening ? "Listening..." : isTimeUp ? "Time's Up" : "Unmute to Speak"}</button>
              <button onClick={nextQuestion} disabled={isAiThinking} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 py-5 rounded-2xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2">{isAiThinking ? <Loader2 className="animate-spin" /> : <>Next Question <ChevronRight /></>}</button>
              {currentQuestionIndex > 2 && (<button onClick={finishInterview} disabled={isAiThinking} className="bg-red-600/20 text-red-500 border border-red-500/30 px-6 rounded-2xl font-bold hover:bg-red-600 hover:text-white transition-all">{isAiThinking ? <Loader2 className="animate-spin" /> : 'Finish'}</button>)}
            </div>
          </div>
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="relative h-full min-h-[400px] bg-black rounded-[2rem] overflow-hidden border border-slate-800 shadow-2xl"><video ref={videoRef} autoPlay muted onPlay={handleVideoPlay} className="w-full h-full object-cover scale-x-[-1]" />{proctoringMessage && (<div className="absolute top-6 left-1/2 -translate-x-1/2 bg-red-600 px-4 py-2 rounded-full text-[10px] font-black animate-pulse">{proctoringMessage}</div>)}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-16">
      <div className="text-center mb-16"><h2 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">Master Your <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 italic">Interview Skills.</span></h2></div>
      <div className="grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800 p-10 rounded-[2.5rem] backdrop-blur-sm shadow-2xl">
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Layers size={14} className="text-blue-500" /> Select Exam Category</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <button onClick={() => { setSelectedCategory(''); setShowAllCategories(false); }} className={`py-3 px-4 rounded-2xl text-[10px] font-black uppercase border transition-all ${!selectedCategory ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-800/40 border-slate-700 text-slate-500 hover:border-blue-500/30'}`}>Tech Mode</button>
                {categoriesList.slice(0, 5).map((cat) => (<button key={cat.id} onClick={() => { setSelectedCategory(cat.name); setFile(null); setJd(''); setShowAllCategories(false); }} className={`py-3 px-4 rounded-2xl text-[10px] font-black uppercase border transition-all ${selectedCategory === cat.name ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-800/40 border-slate-700 text-slate-500 hover:border-blue-500/30'}`}>{cat.name}</button>))}
                <button onClick={() => setShowAllCategories(!showAllCategories)} className="py-3 px-4 rounded-2xl text-[10px] font-black uppercase border border-blue-500/50 text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 flex items-center justify-center gap-2 transition-all">{showAllCategories ? 'Show Less' : 'More Categories +'}</button>
              </div>
              {/* 🔥 DROPDOWN MENU WITH SEARCH BAR */}
              {showAllCategories && (
                <div className="mt-4 p-6 bg-slate-950/90 border border-slate-800 rounded-3xl animate-in fade-in slide-in-from-top-2 duration-300">

                  {/* 🔍 Search Input Field */}
                  <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <Globe size={16} className="text-blue-500" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search Department (e.g. Police, SSC, Medical)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-blue-500 transition-all text-white"
                    />
                  </div>

                  <p className="text-[10px] font-bold text-slate-600 uppercase mb-4 px-2">Matching Departments</p>

                  {/* 📜 Filtered Categories List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {categoriesList
                      .filter(cat => cat.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setSelectedCategory(cat.name);
                            setFile(null);
                            setJd('');
                            setShowAllCategories(false);
                            setSearchQuery(''); // Clear search after selection
                          }}
                          className={`text-left py-3 px-5 rounded-xl text-[11px] font-bold transition-all ${selectedCategory === cat.name
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent hover:border-slate-700'
                            }`}
                        >
                          {cat.name}
                        </button>
                      ))
                    }

                    {/* ⚠️ No Results Found Message */}
                    {categoriesList.filter(cat => cat.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                      <div className="col-span-full py-10 text-center text-slate-500 italic text-sm">
                        Bhai, is category ka koi match nahi mila. Ek baar spelling check karo!
                      </div>
                    )}
                  </div>
                </div>
              )}            </div>
            {!selectedCategory && (<><div className="space-y-3"><label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Upload Resume</label><div className={`relative group border-2 border-dashed rounded-3xl p-10 transition-all cursor-pointer ${file ? 'border-green-500/40 bg-green-500/5' : 'border-slate-700 bg-slate-800/20 hover:border-blue-500/40 hover:bg-blue-500/5'}`}><input type="file" id="file-upload" className="hidden" onChange={(e) => setFile(e.target.files[0])} /><label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center"><Upload className={`w-12 h-12 mb-4 ${file ? 'text-green-400' : 'text-slate-600'}`} /><p className="text-sm text-slate-400 font-medium">{file ? file.name : "Select PDF Document"}</p></label></div></div><div className="space-y-3"><label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Job Description</label><textarea className="w-full bg-slate-800/20 border border-slate-700 rounded-3xl p-6 text-sm h-44 outline-none text-slate-300" placeholder="Paste target job requirements here..." value={jd} onChange={(e) => setJd(e.target.value)} /></div></>)}
            <div className="grid md:grid-cols-2 gap-6"><div className="space-y-3"><label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><BarChart3 size={14} className="text-blue-500" /> Interview Level</label><div className="flex gap-2 bg-slate-800/40 p-1.5 rounded-2xl border border-slate-700">{['Junior', 'Mid', 'Senior'].map((level) => (<button key={level} onClick={() => setDifficulty(level)} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${difficulty === level ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-slate-700/50'}`}>{level}</button>))}</div></div><div className="space-y-3"><label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Globe size={14} className="text-indigo-500" /> Language</label><div className="flex gap-2 bg-slate-800/40 p-1.5 rounded-2xl border border-slate-700"><button onClick={() => setLanguage('en-US')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${language === 'en-US' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-700/50'}`}>English</button><button onClick={() => setLanguage('hi-IN')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${language === 'hi-IN' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-700/50'}`}>Hinglish</button></div></div></div>
            <button onClick={handleUpload} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 py-5 rounded-[1.5rem] font-bold text-white shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest text-xs">{loading ? <><Loader2 className="animate-spin" /> Synchronizing...</> : <><ShieldCheck size={18} /> {selectedCategory ? 'Start Exam Mode' : 'Process Technical Roadmap'}</>}</button>
          </div>
        </div>
        <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 backdrop-blur-sm flex flex-col"><h3 className="text-lg font-bold text-white mb-8 flex items-center gap-3 uppercase tracking-widest"><div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div> Live Preview</h3><div className="flex-1 space-y-4">{questions.map((q, i) => (<div key={i} className="bg-slate-800/30 border border-slate-700/50 p-5 rounded-2xl border-l-4 border-l-blue-600"><p className="text-sm text-slate-300 leading-relaxed italic"><span className="text-blue-500 font-mono mr-2">Q{i + 1}:</span> {q}</p></div>))}</div>{questions.length > 0 && (<button onClick={() => { const codingKeywords = ["write", "code", "program", "function"]; const isFirstCoding = codingKeywords.some(word => questions[0].toLowerCase().includes(word)); setIsCodingRound(isFirstCoding); setIsInterviewStarted(true); setTimeout(() => { startVideo(); }, 500); }} className="mt-8 w-full bg-green-600 hover:bg-green-500 py-6 rounded-3xl font-black text-xl text-white shadow-2xl">LAUNCH SIMULATOR 🚀</button>)}</div>
      </div>
    </main>
  );
};

// --- MAIN APP WITH ROUTING ---
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#020617] text-slate-200 font-sans">
        <nav className="border-b border-slate-800/60 bg-slate-950/50 backdrop-blur-xl p-4 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">AI</div>
              <h1 className="text-xl font-bold text-white tracking-tight">Interviewer <span className="text-blue-500">Pro</span></h1>
            </Link>
            <div className="flex gap-6 items-center">
              <Link to="/" className="flex items-center gap-1 hover:text-blue-500 font-bold transition-all text-sm">
                <Home size={16} /> Home
              </Link>

              {/* 🔥 Naya Trending Button */}
              <Link to="/top-questions" className="flex items-center gap-1 hover:text-yellow-500 font-bold transition-all text-sm relative group">
                <Award size={16} className="text-yellow-500" />
                Top Questions
                <span className="absolute -top-1 -right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                </span>
              </Link>

              <Link to="/practice" className="flex items-center gap-1 bg-blue-600/20 text-blue-400 px-4 py-2 rounded-xl border border-blue-500/30 hover:bg-blue-600 hover:text-white transition-all font-bold text-sm">
                <BookOpen size={16} /> Practice Questions
              </Link>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<InterviewHome />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/top-questions" element={<TopQuestions />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
