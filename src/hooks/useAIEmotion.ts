import { Howl, Howler } from "howler";

export const useAIEmotion = () => {
  const playEmotion = (type: "success" | "error" | "thinking" | "logout") => {
    const sounds = {
      success: "/sounds/success.mp3",
      error: "/sounds/error.mp3",
      thinking: "/sounds/login.mp3",
      logout: "/sounds/logout.mp3"
    };
    new Howl({ src: [sounds[type]], volume: 0.7 }).play();
  };

  return { playEmotion };
};
