import React, { useState } from 'react';
import styles from './css/likes.module.css';

const initialLikes = [
  { 
    id: 1, 
    name: 'Малышка', 
    age: 21, 
    compatibility: 95,
    description: 'Я верю, что где-то в этом шумном мире живет тихое счастье...',
    photo: '/assets/photo-anna.svg',
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
  }
];

export default function LikesScreen() {
  const [likes, setLikes] = useState(initialLikes);

  const handleLike = (id) => {
    setLikes(prev => prev.map(item =>
      item.id === id ? { ...item, liked: !item.liked } : item
    ));
  };

  const handleDislike = (id) => {
    setLikes(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className={styles.likesContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Лайки</h1>
        <img src="/assets/polydate.svg" alt="POLY DATE" className={styles.logo} />
      </header>
      

      <div className={styles.likesList}>
        {likes.map(user => (
          <div key={user.id} className={styles.card}>
            <img src={user.photo} alt={user.name} className={styles.photo} />
            <div className={styles.badge}>{user.compatibility}%</div>
            <div className={styles.overlay}>
              <div className={styles.name}>{user.name}, {user.age}</div>
              <p className={styles.description}>{user.description}</p>
              <div className={styles.buttonGroup}>
                <button 
                  onClick={() => handleDislike(user.id)} 
                  className={`${styles.actionBtn} ${styles.dislike}`}
                >
                  <img src="/assets/dislike.svg" alt="dislike" className={styles.icon} />
                </button>
                <button 
                  onClick={() => handleLike(user.id)} 
                  className={`${styles.actionBtn} ${styles.like} ${user.liked ? styles.likedActive : ''}`}
                >
                  <img src="/assets/like.svg" alt="like" className={styles.icon} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}