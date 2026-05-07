
// import React, { useState } from 'react';
// import SplashScreen from './SplashScreen';
// import RegistrationWizard from './RegistrationWizard';
// import MainApp from './MainApp';
// import Test from './Test';
// function App() {
//   const [showSplash, setShowSplash] = useState(true);
//   const [isRegistered, setIsRegistered] = useState(false);

//   if (showSplash) {
//     return <SplashScreen onFinish={() => setShowSplash(false)} />;
//   }

//   if (!isRegistered) {
//     return <RegistrationWizard onComplete={() => setIsRegistered(true)} />;
//   }

//   return <MainApp />;
// }

// export default App;

import React from 'react';
import MainApp from './MainApp';

function App() {
  // Временно показываем только главное меню
  return <MainApp />;
}

export default App;










