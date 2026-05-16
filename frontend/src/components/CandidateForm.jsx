import { useState } from 'react';
import { addCandidate } from '../api';
import { UserPlus, Loader2 } from 'lucide-react';

const CandidateForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    skills: '',
    experience: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);
      await addCandidate({
        ...formData,
        skills: skillsArray,
        experience: Number(formData.experience)
      });
      setMessage({ type: 'success', text: 'Candidate added successfully!' });
      setFormData({ name: '', email: '', skills: '', experience: '' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add candidate. ' + (error.response?.data?.error || error.message) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card">
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <UserPlus size={24} color="#3b82f6" /> Add New Candidate
      </h2>
      
      {message && (
        <div style={{
          padding: '1rem', 
          marginBottom: '1.5rem', 
          borderRadius: '0.5rem',
          backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          color: message.type === 'success' ? '#10b981' : '#f87171',
          border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="e.g. Rahul Sharma"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input 
            type="email" 
            className="form-input" 
            placeholder="e.g. rahul@gmail.com"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Skills (comma-separated)</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="e.g. React, Node.js, MongoDB"
            value={formData.skills}
            onChange={(e) => setFormData({...formData, skills: e.target.value})}
            required 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Years of Experience</label>
          <input 
            type="number" 
            className="form-input" 
            placeholder="e.g. 2"
            min="0"
            step="0.5"
            value={formData.experience}
            onChange={(e) => setFormData({...formData, experience: e.target.value})}
            required 
          />
        </div>
        
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <Loader2 className="spinner" /> : 'Save Candidate Profile'}
        </button>
      </form>
    </div>
  );
};

export default CandidateForm;
