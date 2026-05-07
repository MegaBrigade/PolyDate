import React from 'react';
import './css/main.css';

export default function BottomNavBar({ activeTab, onTabChange }) {
  return (
    <div className="bottom-nav">
      <button 
        className={activeTab === 'matches' ? 'active' : ''} 
        onClick={() => onTabChange('matches')}
      >
      <img src="/assets/icon-of-menu1.svg" alt="POLY DATE"></img>
      </button>
      <button 
        className={activeTab === 'recommendations' ? 'active' : ''} 
        onClick={() => onTabChange('recommendations')}
      >
      <img src="/assets/icon-of-menu2.svg" alt="POLY DATE"></img>
      </button>
      <button 
        className={activeTab === 'profile' ? 'active' : ''} 
        onClick={() => onTabChange('profile')}
      >
      <img src="/assets/icon-of-menu3.svg" alt="POLY DATE"></img>
      </button>
    </div>
  );
}