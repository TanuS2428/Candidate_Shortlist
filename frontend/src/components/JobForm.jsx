import { useState, useEffect } from 'react';
import { matchCandidates, aiShortlist, getCandidates } from '../api';
import { Search, Sparkles, Loader2, BrainCircuit } from 'lucide-react';

const JobForm = () => {
  const [jobData, setJobData] = useState({
    requiredSkills: '',
    minExperience: ''
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleMatch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults([]);
    
    try {
      const skillsArray = jobData.requiredSkills.split(',').map(s => s.trim()).filter(s => s);
      const res = await matchCandidates({
        requiredSkills: skillsArray,
        minExperience: Number(jobData.minExperience)
      });
      setResults(res.data);
    } catch (err) {
      setError('Failed to match candidates. ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAIAnalysis = async () => {
    if (results.length === 0) return;
    
    setAiLoading(true);
    setError(null);
    
    try {
      const skillsArray = jobData.requiredSkills.split(',').map(s => s.trim()).filter(s => s);
      const res = await aiShortlist({
        requiredSkills: skillsArray,
        minExperience: Number(jobData.minExperience),
        candidates: results
      });
      
      // Merge AI recommendations into existing results
      const updatedResults = results.map(c => {
        const aiData = res.data.find(r => r._id === c._id || r.name === c.name);
        return {
          ...c,
          aiRecommendation: aiData ? aiData.aiRecommendation : null
        };
      });
      
      setResults(updatedResults);
    } catch (err) {
      setError('AI Analysis failed. ' + (err.response?.data?.error || err.message));
    } finally {
      setAiLoading(false);
    }
  };

  const getMatchBadgeClass = (score) => {
    if (score >= 80) return 'match-badge';
    if (score >= 40) return 'match-badge medium';
    return 'match-badge low';
  };

  return (
    <div>
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={24} color="#3b82f6" /> Find Candidates
        </h2>
        
        {error && (
          <div style={{
            padding: '1rem', 
            marginBottom: '1.5rem', 
            borderRadius: '0.5rem',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleMatch}>
          <div className="form-group">
            <label className="form-label">Required Skills (comma-separated)</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. React, Node.js"
              value={jobData.requiredSkills}
              onChange={(e) => setJobData({...jobData, requiredSkills: e.target.value})}
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Minimum Experience (Years)</label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="e.g. 1"
              min="0"
              step="0.5"
              value={jobData.minExperience}
              onChange={(e) => setJobData({...jobData, minExperience: e.target.value})}
              required 
            />
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading || aiLoading}>
            {loading ? <Loader2 className="spinner" /> : 'Run Basic Matching'}
          </button>
        </form>
      </div>

      {/* Results Section */}
      {results.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Matches Found: {results.length}</h3>
            <button 
              className="btn-primary" 
              style={{ width: 'auto', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}
              onClick={handleAIAnalysis}
              disabled={aiLoading}
            >
              {aiLoading ? <Loader2 className="spinner" /> : <><Sparkles size={18} /> Enhance with AI Analysis</>}
            </button>
          </div>

          <div className="candidate-grid">
            {results.map((candidate, idx) => (
              <div key={idx} className="candidate-card">
                <span className={getMatchBadgeClass(candidate.matchScore)}>
                  {Math.round(candidate.matchScore)}% Match
                </span>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{candidate.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  {candidate.experience} years experience
                </p>
                
                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Matched Skills:</span>
                  <div className="skills-container">
                    {candidate.matchedSkills && candidate.matchedSkills.length > 0 
                      ? candidate.matchedSkills.map((skill, i) => <span key={i} className="skill-tag">{skill}</span>)
                      : <span style={{ fontSize: '0.85rem', color: '#f87171' }}>None</span>
                    }
                  </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>All Skills:</span>
                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{candidate.skills.join(', ')}</p>
                </div>

                {candidate.aiRecommendation && (
                  <div className="ai-recommendation">
                    <strong><BrainCircuit size={16} className="ai-icon" /> AI Insight:</strong>
                    <p style={{ marginTop: '0.5rem' }}>{candidate.aiRecommendation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {!loading && results.length === 0 && jobData.requiredSkills && (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>
          No matches found. Try adjusting your criteria.
        </div>
      )}
    </div>
  );
};

export default JobForm;
