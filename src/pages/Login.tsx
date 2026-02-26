import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';
import { useAIEmotion } from '@/hooks/useAIEmotion';
import { useAIPersonality } from '@/hooks/useAIPersonality';
import { motion } from "framer-motion";
import * as THREE from "three";
import NET from "vanta/dist/vanta.net.min";
import { greetings } from "../data/greetings";
import Typed from "typed.js";
import aiRobot from "../images/logo-grow.png";
import Lottie from "lottie-react";
import robotIdle from "../assets/robot-idle.json";
import robotThinking from "../assets/robot-thinking.json";
import robotSuccess from "../assets/robot-success.json";
import robotError from "../assets/robot-error.json";
import { Howl, Howler } from "howler";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import LoginReminderPopup from "@/components/LoginReminderPopup";
import { API_BASE_URL } from "@/config";

const Login: React.FC = () => {
  const { login, isAuthenticated, user } = useAuth();
  const { playEmotion } = useAIEmotion();
  const { speak, setAmbientLighting, toggleMute, isMuted } = useAIPersonality();
  const [vantaEffect, setVantaEffect] = useState<any>(null);
  const vantaRef = useRef<HTMLDivElement>(null);
  const greetingRef = useRef<HTMLSpanElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const successMessageRef = useRef<HTMLSpanElement>(null);
  const errorMessageRef = useRef<HTMLSpanElement>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emotion, setEmotion] = useState<"idle" | "thinking" | "success" | "error">("idle");
  const [typedMessage, setTypedMessage] = useState("");
  const [personality, setPersonality] = useState<'neutral' | 'happy' | 'excited' | 'concerned' | 'processing' | 'celebrating'>('neutral');
  
  // Reminder popup state
  const [showReminderPopup, setShowReminderPopup] = useState(false);
  const [reminderDates, setReminderDates] = useState<any[]>([]);
  const [isFetchingReminders, setIsFetchingReminders] = useState(false);
  
  const navigate = useNavigate();

  // Resume audio context on user interaction to fix autoplay issues
  useEffect(() => {
    const resumeAudio = () => {
      if (Howler.ctx?.state === 'suspended') {
        Howler.ctx.resume();
      }
    };
    document.addEventListener('click', resumeAudio);
    return () => document.removeEventListener('click', resumeAudio);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Detect user name (replace with auth context later)
  const userName = user?.name || "User";

  // Greeting selection
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return greetings.morning;
    if (hours < 17) return greetings.afternoon;
    if (hours < 22) return greetings.evening;
    return greetings.lateNight;
  };

  // Typing Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false);
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        const current = getGreeting();
        const typed = new Typed(greetingRef.current, {
          strings: [current.greeting.replace("[User Name]", userName)],
          typeSpeed: 45,
          backSpeed: 20,
          showCursor: false,
          onComplete: () => {
            setShowForm(true);
            // AI greeting voice
            speak('happy', `Welcome back, ${userName}. Ready to grow?`);
          },
        });

        taglineRef.current!.innerText = current.tagline;
        return () => typed.destroy();
      }, 100);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Vanta Background
  useEffect(() => {
    if (!vantaEffect) {
      setVantaEffect(
        NET({
          el: vantaRef.current,
          THREE,
          mouseControls: true,
          touchControls: true,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          color: 0x4f46e5,
          backgroundColor: 0x0f172a,
          points: 12.0,
          maxDistance: 20.0,
          spacing: 18.0,
        })
      );
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  // Update ambient lighting based on personality
  useEffect(() => {
    setAmbientLighting(personality);
  }, [personality, setAmbientLighting]);

  // Emotion-based messages
  const getEmotionMessage = (emotion: string) => {
    switch (emotion) {
      case "idle":
        return "System online… awaiting credentials 🤖";
      case "thinking":
        return "Analyzing input patterns…";
      case "success":
        return `Access Granted ✅ Welcome back, ${userName}!`;
      case "error":
        return "Hmm… credentials rejected. Try again?";
      default:
        return "System online… awaiting credentials 🤖";
    }
  };

  // Robot animation mapping
  const robotAnimations = {
    idle: robotIdle,
    thinking: robotThinking,
    success: robotSuccess,
    error: robotError,
  };

  // Update typed message when emotion changes
  useEffect(() => {
    if (emotion !== "idle" && emotion !== "thinking") {
      const message = getEmotionMessage(emotion);
      const targetRef = emotion === "error" ? errorMessageRef : successMessageRef;

      // Small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        if (targetRef.current) {
          const typed = new Typed(targetRef.current, {
            strings: [message],
            typeSpeed: 50,
            showCursor: false,
          });
          return () => typed.destroy();
        }
      }, 100);

      return () => clearTimeout(timer);
    }
}, [emotion, userName]);

  const fetchReminderDates = async (token: string) => {
    try {
      setIsFetchingReminders(true);
      const response = await fetch(`${API_BASE_URL}/api/followups/reminder-dates`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      
      if (result.success && result.data && result.data.length > 0) {
        setReminderDates(result.data);
        setShowReminderPopup(true);
      }
    } catch (error) {
      console.error('Error fetching reminder dates:', error);
    } finally {
      setIsFetchingReminders(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmotion("thinking");
    setPersonality("processing");
    setIsAuthenticating(true);
    setIsLoading(true);

    playEmotion("thinking");
    speak("processing");

    try {
      await login(email, password);
      setEmotion("success");
      setPersonality("celebrating");
      playEmotion("success");
      speak("celebrating");
      
      // Fetch reminder dates after successful login
      const token = localStorage.getItem('token');
      if (token) {
        fetchReminderDates(token);
      }
      
      setTimeout(() => navigate("/dashboard"), 1800);
    } catch (error) {
      setEmotion("error");
      setPersonality("concerned");
      playEmotion("error");
      speak("concerned");
      setTimeout(() => {
        setEmotion("idle");
        setPersonality("neutral");
      }, 1200);
      setIsAuthenticating(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      ref={vantaRef}
      className="w-screen h-screen flex items-center justify-center relative overflow-hidden bg-morph"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A]/0 to-[#1E293B]/0 backdrop-blur-sm" />

      {/* Mute Button */}
      <motion.div
        className="absolute top-4 right-4 z-20"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200"
          title={isMuted ? "Unmute AI voice" : "Mute AI voice"}
        >
          {isMuted ? <VolumeX className="h-5 w-5 text-white" /> : <Volume2 className="h-5 w-5 text-white" />}
        </Button>
      </motion.div>

      {/* Login Card */}
      <motion.div
        className={`relative z-10 w-[90%] max-w-md p-8 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-2xl text-center ${
          emotion === "error" ? "error-shake error-pulse" :
          emotion === "success" ? "success-glow camera-zoom" : ""
        }`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{
          scale: emotion === "success" ? 1.05 : 1,
          opacity: 1
        }}
        transition={{ duration: 0.5 }}
      >
        {/* AI Robot Avatar */}
        <motion.div
          className="mx-auto w-24 h-24 mb-4 flex items-center justify-center"
          animate={{
            scale: personality === 'celebrating' ? 1.1 : personality === 'concerned' ? 0.9 : 1,
            rotate: personality === 'excited' ? [0, -5, 5, 0] : 0
          }}
          transition={{ duration: 0.3 }}
        >
          <img
            src={aiRobot}
            alt="AI Assistant"
            className="w-full h-full object-contain"
          />
        </motion.div>
     {/* Robot Animation */}
        {isAuthenticating && (
          <motion.div
            className="mb-4"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Lottie
              key={emotion}
              animationData={robotAnimations[emotion]}
              loop={true}
              style={{ width: 100, height: 100, margin: '0 auto' }}
            />
          </motion.div>
        )}

        {/* Boot / Greeting Message */}
        {isInitializing ? (
          <motion.h1
            className="text-lg font-bold text-secondary animate-pulse"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Initializing GrowUp CRM Systems...
          </motion.h1>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-2">
              <span ref={greetingRef}></span>
            </h1>
            <p ref={taglineRef} className="text-gray-300 mb-6 transition-opacity duration-1000" />
          </>
        )}

   

        {/* Success Message */}
        {isSuccess && (
          <motion.div
            className="mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h2 className="text-2xl font-bold text-green-400 mb-2">
              <span ref={successMessageRef}></span>
            </h2>
          </motion.div>
        )}

        {/* Error Message */}
        {emotion === "error" && (
          <motion.div
            className="mb-4"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h2 className="text-2xl font-bold text-red-400 mb-2">
              <span ref={errorMessageRef}></span>
            </h2>
          </motion.div>
        )}

        {/* Login Form */}
        {showForm && !isSuccess && (
          <motion.form
            onSubmit={handleLogin}
            className={`space-y-4 ${isAuthenticating ? 'fade-out' : ''}`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <motion.input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-white/10 text-white placeholder-gray-400 rounded-lg border border-white/20 focus:ring-2 focus:ring-secondary focus:outline-none transition"
              disabled={isAuthenticating}
              whileFocus={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            />
            <motion.input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-white/10 text-white placeholder-gray-400 rounded-lg border border-white/20 focus:ring-2 focus:ring-secondary focus:outline-none transition"
              disabled={isAuthenticating}
              whileFocus={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            />
            <motion.button
              type="submit"
              className={`w-full py-3 text-white font-medium rounded-lg transition-all duration-300 ${
                isSuccess ? 'success-glow bg-green-500' : 'bg-primary hover:scale-[1.03] hover:shadow-lg'
              }`}
              disabled={isAuthenticating || isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              {isAuthenticating ? 'Authenticating...' : 'Login'}
            </motion.button>
          </motion.form>
        )}
      </motion.div>

      {/* Reminder Popup */}
      <LoginReminderPopup
        isOpen={showReminderPopup}
        onClose={() => setShowReminderPopup(false)}
        reminderDates={reminderDates}
        onViewCalendar={() => {
          setShowReminderPopup(false);
          navigate('/calendar');
        }}
      />
    </motion.div>
  );
};

export default Login;
