// src/MainApp.jsx
// import React, { useState } from 'react';

// import BottomNavBar from './BottomNavBar';
// import RecommendationsScreen from './RecommendationsScreen';
// import ProfileScreen from './ProfileScreen';
// import MatchScreen from './MatchScreen';
// import './css/main.css';
// import './index.css';
// import './css/registration.css';   
// import './css/test.css';           
// import App from './App.jsx';
// export default function MainApp() {
//   const [activeTab, setActiveTab] = useState('recommendations');

//   const renderContent = () => {
//     switch (activeTab) {
//       case 'reommendations': return <RecommendationsScreen />;
//       case 'profile': return <ProfileScreen />;
//       case 'matches': return <MatchScreen matchUser={{ username: '@MegaBrigade' }} onClose={() => setActiveTab('recommendations')} />;
//       default: return <RecommendationsScreen />;
//     }
//   };

//   return (
//     <div className="main-app">   {/* ← добавить эту обёртку */}
//       <div className="app-main">
//         {renderContent()}
//         <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
//       </div>
//     </div>
//   );
// }



// import React, { useState } from 'react';
// import BottomNavBar from './BottomNavBar';
// import RecommendationsScreen from './RecommendationsScreen';
// import ProfileScreen from './ProfileScreen';
// import LikesScreen from './LikesScreen';  
// import './css/main.css';

// export default function MainApp() {
//   const [activeTab, setActiveTab] = useState('recommendations');

//   const renderContent = () => {
//     switch (activeTab) {
//       case 'recommendations': return <RecommendationsScreen />;
//       case 'profile': return <ProfileScreen />;
//       case 'matches': return <LikesScreen />;   
//       default: return <RecommendationsScreen />;
//     }
//   };

//   return (
//     <div className="main-app">
//       <div className="app-main">
//         {renderContent()}
//         <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
//       </div>
//     </div>
//   );
// }

import React, { useState } from 'react';
import BottomNavBar from './BottomNavBar';
import RecommendationsScreen from './RecommendationsScreen';
import ProfileScreen from './ProfileScreen';
import LikesScreen from './LikesScreen';
import MatchScreen from './MatchScreen';
import './css/main.css';

export default function MainApp() {
  const [activeTab, setActiveTab] = useState('recommendations');
  const [matchData, setMatchData] = useState(null);

  const showMatch = (user) => setMatchData(user);
  const hideMatch = () => setMatchData(null);

  const renderContent = () => {
    switch (activeTab) {
      case 'recommendations':
        return <RecommendationsScreen onMatch={showMatch} />;
      case 'profile':
        return <ProfileScreen />;
      case 'matches':
        return <LikesScreen />;   // показываем список лайков, а не MatchScreen
      default:
        return <RecommendationsScreen onMatch={showMatch} />;
    }
  };

  return (
    <div className="main-app">
      {matchData ? (
        <MatchScreen matchUser={matchData} onClose={hideMatch} />
      ) : (
        <>
          <div className="app-main">{renderContent()}</div>
          <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
        </>
      )}
    </div>
  );
}