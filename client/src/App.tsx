import { Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ResultsPage from './pages/ResultsPage';
import StationsPage from './pages/StationsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/alternativen" element={<ResultsPage />} />
      <Route path="/stationen" element={<StationsPage />} />
    </Routes>
  );
}
