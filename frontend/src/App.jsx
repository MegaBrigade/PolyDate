















import React, { useState } from 'react';
import SplashScreen from './SplashScreen';
import RegistrationWizard from './RegistrationWizard';
import Test from './Test';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  
  
  const urlParams = new URLSearchParams(window.location.search);
  const directTest = urlParams.get('test') === '1';

  if (directTest) {
    
    return <Test onFinish={() => window.location.href = '/'} />;
  }

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return <RegistrationWizard />;
}

export default App;