import React, { useState, useEffect } from "react";
import axios from 'axios';
// Loader2, Search, TrendingUp, Award icons import karna mat bhulna lucide-react se
import { Loader2, Search, TrendingUp, Award } from 'lucide-react';

function PracticePage() {
  const [selectedCat, setSelectedCat] = useState('UP Police (UPP)');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visibleAnswers, setVisibleAnswers] = useState({});
  
  // 🔥 NEW STATE: For searching categories
  const [searchTerm, setSearchTerm] = useState('');

  // Yahan tum jitni marzi categories add karo, search bar sab handle kar lega
  const cats = [
    'UP Police (UPP)', 'SSC / SSC GD', 'Railway (RRB)', 'HTML', 'CSS', 
    'JavaScript', 'Java Developer', 'React.js', 'Python', 'Node.js', 
    'UPPSC', 'UPSC', 'Banking', 'NDA', 'Indian Army'
  ];

  // 🔥 FILTER LOGIC: Categories ko search ke hisab se filter karna
  const filteredCats = cats.filter(c => 
    c.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchQuestions = async (category) => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/practice-questions', { category });
      setQuestions(res.data.questions);
    } catch (err) {
      alert("Error fetching questions!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuestions(selectedCat); }, [selectedCat]);

  const toggleAnswer = (index) => {
    setVisibleAnswers(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <header className="mb-12 text-center">
        <h2 className="text-4xl font-black text-white mb-4">Master Your <span className="text-blue-500">Knowledge</span></h2>
        <p className="text-slate-400">Select a category and start practicing with human-like model answers.</p>

        {/* 🔥 NEW FEATURE: Professional Search Bar */}
        <div className="max-w-md mx-auto mt-8 relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-500" />
          </div>
          <input 
            type="text"
            placeholder="Search categories (e.g. Java, Police)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-slate-900 transition-all text-white shadow-2xl"
          />
        </div>
      </header>

      {/* 🔥 Category Tabs: Flex-wrap aur max-height scrollbar ke sath taaki saari categories dikhein */}
      <div className="flex flex-wrap gap-3 justify-center mb-12 max-h-[160px] overflow-y-auto p-2 custom-scrollbar">
        {filteredCats.map(c => (
          <button 
            key={c} 
            onClick={() => setSelectedCat(c)}
            className={`px-6 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest border transition-all ${selectedCat === c ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-600/20' : 'bg-slate-800/40 border-slate-700 text-slate-500 hover:border-blue-500/50'}`}
          >
            {c}
          </button>
        ))}
        {filteredCats.length === 0 && (
          <p className="text-slate-600 italic py-4">Bhai, ye category nahi mili!</p>
        )}
      </div>

      {/* Questions List Section */}
      <div className="grid gap-6 max-w-4xl mx-auto">
        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
        ) : (
          questions.map((item, index) => (
            <div key={index} className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-8 backdrop-blur-sm hover:border-blue-500/30 transition-all group">
              <h3 className="text-xl font-bold text-slate-100 mb-6 leading-relaxed">
                <span className="text-blue-500 mr-2">Q{index + 1}.</span> {item.question}
              </h3>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => toggleAnswer(index)}
                  className="bg-slate-800 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 transition-all"
                >
                  {visibleAnswers[index] ? 'Hide Answer' : 'Show Answer'}
                </button>
                
                <div className="flex gap-4 ml-auto">
                  <button className="text-slate-500 hover:text-red-500 flex items-center gap-1 text-xs font-bold transition-all"><TrendingUp size={16}/> Useful</button>
                  <button className="text-slate-500 hover:text-yellow-500 flex items-center gap-1 text-xs font-bold transition-all"><Award size={16}/> Accurate</button>
                </div>
              </div>

              {visibleAnswers[index] && (
                <div className="mt-6 p-6 bg-blue-600/5 border border-blue-500/20 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-500">
                  <p className="text-slate-300 leading-loose text-sm font-medium">
                    <span className="text-blue-400 font-black block mb-2 text-[10px] uppercase">Model Answer:</span>
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default PracticePage;