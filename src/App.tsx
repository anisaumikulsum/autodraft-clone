import { useState } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';

type View = 'landing' | 'dashboard';

function App() {
  const [currentView, setCurrentView] = useState<View>('landing');

  return (
    <>
      {currentView === 'landing' && (
        <LandingPage onStartCreating={() => setCurrentView('dashboard')} />
      )}
      {currentView === 'dashboard' && (
        <Dashboard onBack={() => setCurrentView('landing')} />
      )}
    </>
  );
}

export default App;