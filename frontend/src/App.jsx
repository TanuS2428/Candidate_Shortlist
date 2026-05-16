import { useState } from 'react';
import CandidateForm from './components/CandidateForm';
import JobForm from './components/JobForm';

function App() {
  const [activeTab, setActiveTab] = useState('find'); // 'find' or 'add'

  return (
    <div className="app-container">
      <header className="header">
        <h1>Candidate Intelligence Hub</h1>
        <p>AI-Powered Profile Shortlisting & Skill Matching System</p>
      </header>

      <div className="nav-tabs">
        <button 
          className={`nav-tab ${activeTab === 'find' ? 'active' : ''}`}
          onClick={() => setActiveTab('find')}
        >
          Find Candidates
        </button>
        <button 
          className={`nav-tab ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          Add Candidate
        </button>
      </div>

      <main>
        {activeTab === 'find' ? <JobForm /> : <CandidateForm />}
      </main>
    </div>
  );
}

export default App;
