

// import React, { useState } from 'react';
// import BottomNavBar from './BottomNavBar';
// import RecommendationsScreen from './RecommendationsScreen';
// import ProfileScreen from './ProfileScreen';
// import LikesScreen from './LikesScreen';
// import MatchScreen from './MatchScreen';
// import './css/main.css';

// export default function MainApp() {
//   const [activeTab, setActiveTab] = useState('recommendations');
//   const [matchData, setMatchData] = useState(null);

//   const showMatch = (user) => setMatchData(user);
//   const hideMatch = () => setMatchData(null);

//   const renderContent = () => {
//     switch (activeTab) {
//       case 'recommendations':
//         return <RecommendationsScreen onMatch={showMatch} />;
//       case 'profile':
//         return <ProfileScreen />;
//       case 'matches':
//         // return <LikesScreen />; 
//         return <LikesScreen onMatch={showMatch} />;
//       default:
//         return <RecommendationsScreen onMatch={showMatch} />;
//     }
//   };

//   return (
//     <div className="main-app">
//       {matchData ? (
//         <MatchScreen matchUser={matchData} onClose={hideMatch} />
//       ) : (
//         <>
//           <div className="app-main">{renderContent()}</div>
//           <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
//         </>
//       )}
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

// Мок-данные для рекомендаций
const mockProfiles = [
  {
    id: 1,
    name: 'Анна',
    age: 25,
    bio: 'Люблю путешествия и кофе. Ищу человека, с которым можно разделить рассветы.',
    photos: ['/assets/photo-anna.svg', '/assets/photo-anna.svg', '/assets/photo-anna.svg'],
    compatibility: 90,
    isMutual: true
  },
  {
    id: 2,
    name: 'Мария',
    age: 28,
    bio: 'Архитектор. Верю в минимализм и искренность.',
    photos: ['/assets/photo-anna.svg'],
    compatibility: 75,
    isMutual: false
  },
];

// Мок-данные для лайков
const mockLikes = [
  {
    id: 1,
    name: 'Малышка',
    age: 21,
    compatibility: 95,
    description: 'Я верю, что где-то в этом шумном мире живет тихое счастье...',
    photo: '/assets/5380084942638880566.jpg',
    liked: false
  },
  {
    id: 2,
    name: 'Тимофей Барсов',
    age: 22,
    compatibility: 90,
    description: 'Люблю белые ночи, какао с кокосовым сиропом и желтый макияж.',
    photo: '/assets/polydate.svg',
    liked: false
  },
  {
    id: 3,
    name: 'Евгений Негролов',
    age: 22,
    compatibility: 90,
    description: 'Ищу девушек без паспорта',
    photo: '/assets/5469930019179139532.jpg',
    liked: false
  }
];

export default function MainApp() {
  const [activeTab, setActiveTab] = useState('recommendations');
  const [matchData, setMatchData] = useState(null);

  const [profiles, setProfiles] = useState(mockProfiles);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);

  const [likes, setLikes] = useState(mockLikes);

  const showMatch = (user) => setMatchData(user);
  const hideMatch = () => setMatchData(null);

  const nextProfile = () => {
    if (currentProfileIndex + 1 < profiles.length) {
      setCurrentProfileIndex(prev => prev + 1);
    } else {
      alert('Анкеты закончились');
    }
  };

  const handleLikeInLikes = (user) => {
    setLikes(prev => prev.map(item =>
      item.id === user.id ? { ...item, liked: !item.liked } : item
    ));
    showMatch(user);
  };

  const handleDislikeInLikes = (id) => {
    setLikes(prev => prev.filter(item => item.id !== id));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'recommendations':
        return (
          <RecommendationsScreen
            profiles={profiles}
            currentIndex={currentProfileIndex}
            onNextProfile={nextProfile}
            onMatch={showMatch}
          />
        );
      case 'profile':
        return <ProfileScreen />;
      case 'matches':
        return (
          <LikesScreen
            likes={likes}
            onLike={handleLikeInLikes}
            onDislike={handleDislikeInLikes}
          />
        );
      default:
        return null;
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