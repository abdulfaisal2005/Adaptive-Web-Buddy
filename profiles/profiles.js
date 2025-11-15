// profiles.js - Define all our profiles and their settings
const profiles = {
    dyslexia: {
        name: "Dyslexia Mode",
        settings: {
            fontFamily: "Comic Sans MS, Arial", // Start with available fonts
            fontSize: "18px",
            lineHeight: "1.8",
            letterSpacing: "0.1em",
            backgroundColor: "#f0f0f0",
            textColor: "#000000",
            hideVideos: true
        }
    },
    focus: {
        name: "Focus Mode", 
        settings: {
            fontFamily: "Arial, sans-serif",
            fontSize: "16px",
            backgroundColor: "#1a1a1a",
            textColor: "#00ff00",
            hideImages: true,
            hideVideos: true
        }
    }
    // Add more profiles as needed
};
