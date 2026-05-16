require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Candidate = require('./models/Candidate');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Base routes to prevent 404 when visited directly in browser
app.get('/', (req, res) => {
  res.send('Candidate Shortlisting API is running. Please access the frontend at http://localhost:5173');
});

app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the Candidate Shortlisting API' });
});

// 1. Add Candidate
app.post('/api/candidates', async (req, res) => {
  try {
    const { name, email, skills, experience } = req.body;
    const newCandidate = new Candidate({ name, email, skills, experience });
    await newCandidate.save();
    res.status(201).json({ message: 'Candidate added successfully', candidate: newCandidate });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add candidate', details: error.message });
  }
});

// 2. Get All Candidates
app.get('/api/candidates', async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ createdAt: -1 });
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// 3. Shortlist Candidates (Basic Logic)
app.post('/api/match', async (req, res) => {
  try {
    const { requiredSkills, minExperience } = req.body;
    
    // Fetch candidates meeting minimum experience
    const candidates = await Candidate.find({ experience: { $gte: minExperience || 0 } });
    
    const matchedCandidates = candidates.map(candidate => {
      const matchedSkills = candidate.skills.filter(skill => 
        requiredSkills.map(s => s.toLowerCase()).includes(skill.toLowerCase())
      );
      
      const score = requiredSkills.length > 0 
        ? (matchedSkills.length / requiredSkills.length) * 100 
        : 0;
        
      return {
        ...candidate.toObject(),
        matchScore: score,
        matchedSkills
      };
    });
    
    // Sort by match score descending
    matchedCandidates.sort((a, b) => b.matchScore - a.matchScore);
    
    res.json(matchedCandidates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to match candidates' });
  }
});

// 4. AI-Based Candidate Suggestion
app.post('/api/ai/shortlist', async (req, res) => {
  try {
    const { requiredSkills, minExperience, candidates } = req.body;
    
    if (!candidates || candidates.length === 0) {
      return res.status(400).json({ error: 'No candidates provided for AI analysis' });
    }

    const jobDescription = `Job requires: ${requiredSkills.join(', ')} (${minExperience}+ years experience)`;
    
    const candidatesText = candidates.map((c, index) => 
      `${index + 1}. ${c.name} - Skills: ${c.skills.join(', ')} - Experience: ${c.experience} years`
    ).join('\n');

    const prompt = `
${jobDescription}

Candidates:
${candidatesText}

Analyze the candidates and rank them based on their suitability for the job. 
Explain why each candidate is suitable or not. Improve ranking beyond simple keyword matching, considering how their skills might complement the requirements.

Format your response as a JSON array of objects. Each object MUST have exactly these two properties:
1. "candidateName": The exact name of the candidate.
2. "aiRecommendation": A brief text explanation (1-3 sentences) of why they are ranked where they are and their suitability.
Return ONLY valid JSON.
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are an expert technical recruiter AI. You output ONLY valid JSON arrays of objects."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0]) {
      let aiAnalysisStr = data.choices[0].message.content;
      try {
        // Sometimes the model returns { "rankings": [...] } if forced to use JSON object
        const parsed = JSON.parse(aiAnalysisStr);
        let rankings = Array.isArray(parsed) ? parsed : (parsed.rankings || parsed.candidates || Object.values(parsed)[0]);
        
        // Merge AI recommendations back to the candidates
        const finalCandidates = candidates.map(c => {
          const aiRec = rankings.find(r => r.candidateName === c.name);
          return {
            ...c,
            aiRecommendation: aiRec ? aiRec.aiRecommendation : "No AI analysis provided."
          };
        });
        
        return res.json(finalCandidates);
      } catch (parseError) {
        console.error('Failed to parse AI response:', aiAnalysisStr);
        return res.status(500).json({ error: 'AI returned invalid format.' });
      }
    } else {
      throw new Error('Invalid response from OpenRouter API');
    }

  } catch (error) {
    console.error('AI Shortlisting Error:', error);
    res.status(500).json({ error: 'Failed to process AI shortlisting', details: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
