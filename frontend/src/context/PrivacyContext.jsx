import React, { createContext, useContext, useState, useEffect } from 'react';

const PrivacyContext = createContext();

export const PrivacyProvider = ({ children }) => {
  const [isPrivacyMode, setIsPrivacyMode] = useState(() => {
    return localStorage.getItem('privacy_mode') === 'true';
  });

  const togglePrivacy = () => {
    setIsPrivacyMode(prev => {
      const newVal = !prev;
      localStorage.setItem('privacy_mode', newVal);
      return newVal;
    });
  };

  return (
    <PrivacyContext.Provider value={{ isPrivacyMode, togglePrivacy }}>
      {children}
    </PrivacyContext.Provider>
  );
};

export const usePrivacy = () => useContext(PrivacyContext);