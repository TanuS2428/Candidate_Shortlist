import axios from 'axios';

const API = axios.create({
  baseURL: 'https://candidate-shortlist.onrender.com/api',
});

export const addCandidate = (candidateData) => API.post('/candidates', candidateData);
export const getCandidates = () => API.get('/candidates');
export const matchCandidates = (jobData) => API.post('/match', jobData);
export const aiShortlist = (jobAndCandidatesData) => API.post('/ai/shortlist', jobAndCandidatesData);
