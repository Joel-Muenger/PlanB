import { Route, Routes } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ResultsPage from './pages/ResultsPage';
import StationsPage from './pages/StationsPage';
import SubscriptionPage from './pages/SubscriptionPage';

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/alternativen" element={<ResultsPage />} />
        <Route path="/stationen" element={<StationsPage />} />
        <Route path="/anmelden" element={<LoginPage />} />
        <Route path="/abo" element={<SubscriptionPage />} />
      </Routes>
    </ErrorBoundary>
  );
}
