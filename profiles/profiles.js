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
    },
    reading: {
        name: "Reading Mode",
        settings: {
            fontFamily: "Georgia, serif",
            fontSize: "17px",
            lineHeight: "2.0",
            letterSpacing: "0.05em",
            backgroundColor: "#fffacd",
            textColor: "#2c3e50",
            hideImages: false,
            hideVideos: false
        }
    },
    autism: {
        name: "Autism Comfort Mode",
        settings: {
            fontFamily: "Arial, sans-serif",
            fontSize: "16px",
            lineHeight: "1.6",
            letterSpacing: "0.08em",
            backgroundColor: "#f5f5f5",
            textColor: "#333333",
            hideVideos: true,
            hideFlashingElements: true,
            reducedAnimations: true
        }
    }
    // Add more profiles as needed
};
