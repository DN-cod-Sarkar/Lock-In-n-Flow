import React, { createContext, useContext, useState } from 'react';

export const darkTheme = {
  bg: '#0A192F', card: '#112240', text: '#E6F1FF', subText: '#8892B0',
  border: '#233554', accent: '#64FFDA', danger: '#FF6B6B', activeBg: 'rgba(100, 255, 218, 0.1)'
};

export const lightTheme = {
  bg: '#F0F4F8', card: '#FFFFFF', text: '#0A192F', subText: '#495670',
  border: '#D1D8E0', accent: '#0077B6', danger: '#E63946', activeBg: 'rgba(0, 119, 182, 0.1)'
};

const ThemeContext = createContext<any>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const colors = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);