
// import React, { useState } from 'react';
// import styles from './css/likes.module.css';

// const initialLikes = [
//   { 
//     id: 1, 
//     name: 'Малышка', 
//     age: 21, 
//     compatibility: 95,
//     description: 'Я верю, что где-то в этом шумном мире живет тихое счастье...Гора эверест на фоне меня это любовь',
//     photo: '/assets/5380084942638880566.jpg',
//     liked: false
//   },
//   { 
//     id: 2, 
//     name: 'Тимофей Барсов', 
//     age: 22, 
//     compatibility: 90,
//     description: 'Люблю белые ночи, какао с кокосовым сиропом и желтый макияж.',
//     photo: '/assets/polydate.svg',
//     liked: false
//   },
//   { 
//     id: 3, 
//     name: 'Евгений Негролов', 
//     age: 22, 
//     compatibility: 90,
//     description: 'Ищу девушек без паспорта',
//     photo: '/assets/5469930019179139532.jpg',
//     liked: false
//   }
// ];


// export default function LikesScreen({ onMatch }) {
//   const [likes, setLikes] = useState(initialLikes);

//   const handleLike = (user) => {
//     // Только переключаем liked (краснеет)
//     setLikes(prev => prev.map(item =>
//       item.id === user.id ? { ...item, liked: !item.liked } : item
//     ));
//     // Открываем экран мэтча
//     if (onMatch) onMatch(user);
//   };

//   const handleDislike = (id) => {
//     setLikes(prev => prev.filter(item => item.id !== id));
//   };

//   return (
//     <div className={styles.likesContainer}>
//       <header className={styles.header}>
//         <h1 className={styles.title}>Лайки</h1>
//         <img src="/assets/polydate.svg" alt="POLY DATE" className={styles.logo} />
//       </header>

//       <div className={styles.likesList}>
//         {likes.map(user => (
//           <div key={user.id} className={styles.card}>
//             <img src={user.photo} alt={user.name} className={styles.photo} />
//             <div className={styles.badge}>{user.compatibility}%</div>
//             <div className={styles.overlay}>
//               <div className={styles.name}>{user.name}, {user.age}</div>
//               <p className={styles.description}>{user.description}</p>
//               <div className={styles.buttonGroup}>
//                 <button 
//                   onClick={() => handleDislike(user.id)} 
//                   className={`${styles.actionBtn} ${styles.dislike}`}
//                 >
//                   <img src="/assets/dislike.svg" alt="dislike" className={styles.icon} />
//                 </button>
//                 <button 
//                   onClick={() => handleLike(user)} 
//                   className={`${styles.actionBtn} ${styles.like} ${user.liked ? styles.likedActive : ''}`}
//                 >
//                   <img src="/assets/like.svg" alt="like" className={styles.icon} />
//                 </button>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }


// import React from 'react';
// import styles from './css/likes.module.css';
// import LikeCard from './LikeCard';
// export default function LikesScreen({ likes, onLike, onDislike, onOpenProfile}) {
//   return (
//     <div className={styles.likesContainer}>
//       <header className={styles.header}>
//         <h1 className={styles.title}>Лайки</h1>
//         <img src="/assets/polydate.svg" alt="POLY DATE" className={styles.logo} />
//       </header>
//       <div className={styles.likesList}>
//         {likes.map(user => (
//           <div key={user.id} className={styles.card}>
//             <img src={user.photo} alt={user.name} className={styles.photo} />
//             <div className={styles.badge}>{user.compatibility}%</div>
//             <div className={styles.overlay}>
//               <div className={styles.name}>{user.name}, {user.age}</div>
//               <p className={styles.description}>{user.description}</p>
//               <div className={styles.buttonGroup}>
//                 <button onClick={() => onDislike(user.id)} className={`${styles.actionBtn} ${styles.dislike}`}>
//                   <img src="/assets/dislike.svg" alt="dislike" className={styles.icon} />
//                 </button>
//                 <button onClick={() => onLike(user)} className={`${styles.actionBtn} ${styles.like} ${user.liked ? styles.likedActive : ''}`}>
//                   <img src="/assets/like.svg" alt="like" className={styles.icon} />
//                 </button>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }


import React from 'react';
import styles from './css/likes.module.css';
import LikeCard from './LikeCard';

export default function LikesScreen({ likes, onLike, onDislike, onOpenProfile }) {
  return (
    <div className={styles.likesContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Лайки</h1>
        <img src="/assets/polydate.svg" alt="POLY DATE" className={styles.logo} />
      </header>
      <div className={styles.likesList}>
        {likes.map(user => (
          <LikeCard
            key={user.id}
            user={user}
            onLike={onLike}
            onDislike={onDislike}
            onOpenProfile={onOpenProfile}
          />
        ))}
      </div>
    </div>
  );
}