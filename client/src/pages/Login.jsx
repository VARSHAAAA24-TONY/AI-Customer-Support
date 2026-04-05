import React from 'react';
import { SignIn, useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Navigate } from 'react-router-dom';

/**
 * NexuAI Artisan Login Page.
 * Features a floating glassmorphism card, artisanal illustrations,
 * and a strict warm-baked-clay palette (#F5E6D3, #E07A5F, #3D2C2E).
 */
const Login = () => {
  const { isSignedIn, isLoaded } = useUser();

  // Direct redirect if already signed in - NO blank screen
  if (isLoaded && isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-login-gradient relative overflow-hidden">
      {/* Artisanal Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50rem] h-[50rem] bg-artisanal-terracotta/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45rem] h-[45rem] bg-artisanal-brown/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Floating AI Assistant Illustration (Right Side) */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
        className="absolute right-[-5%] top-[15%] w-[40%] hidden xl:block pointer-events-none"
      >
        <img 
          src="file:///C:/Users/Rakesh%20N/.gemini/antigravity/brain/9f0de369-0f8d-4124-b4fa-fd7d66c0b4b2/nexuai_artisan_assistant_illustration_1775135778055.png" 
          alt="AI Assistant"
          className="w-full h-auto drop-shadow-2xl animate-float"
        />
      </motion.div>

      {/* Main Floating Glassmorphism Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="glass-card relative z-10 max-w-5xl w-full flex flex-col md:flex-row items-stretch rounded-[2.5rem] overflow-hidden animate-float"
      >
        {/* Left Side: Branding & Info */}
        <div className="w-full md:w-1/2 p-12 md:p-16 flex flex-col justify-center bg-artisanal-beige/30">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-20 h-20 bg-artisanal-terracotta rounded-3xl mb-8 flex items-center justify-center shadow-lg shadow-artisanal-terracotta/20"
          >
            <span className="text-4xl">🏺</span>
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-black text-artisanal-brown mb-4 tracking-tighter leading-tight">
            Welcome to <span className="text-artisanal-terracotta">NexuAI</span>
          </h1>
          <p className="text-artisanal-olive font-semibold text-lg mb-10 leading-relaxed max-w-sm">
            Your specialized AI customer support assistant. Sculpting data into dialogue.
          </p>

          <div className="flex items-center gap-4 text-artisanal-olive/60 font-bold text-xs uppercase tracking-widest">
            <span>Artisanal RAG</span>
            <span>•</span>
            <span>Premium Privacy</span>
          </div>
        </div>

        {/* Right Side: Sign In Form */}
        <div className="w-full md:w-1/2 p-12 md:p-16 flex flex-col justify-center bg-artisanal-cream/20">
          <div className="relative">
            {/* Small Robot Icon near login section */}
            <motion.div 
              className="absolute top-[-40px] right-[-20px] w-16 h-16 pointer-events-none z-20"
              animate={{ rotate: [0, 5, -5, 0], y: [0, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <img 
                src="file:///C:/Users/Rakesh%20N/.gemini/antigravity/brain/9f0de369-0f8d-4124-b4fa-fd7d66c0b4b2/nexuai_robot_icon_artisanal_1775135802001.png" 
                alt="Robot"
                className="w-full h-auto animate-blink"
              />
            </motion.div>

            <SignIn 
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-transparent border-none shadow-none p-0",
                  headerTitle: "hidden",
                  headerSubtitle: "text-artisanal-olive font-bold text-sm mb-6 block",
                  socialButtonsBlockButton: "clay-button bg-artisanal-beige hover:bg-artisanal-sand text-artisanal-brown border-none py-4",
                  formButtonPrimary: "clay-button-glow w-full py-4 text-lg",
                  formFieldLabel: "text-artisanal-brown font-black text-[10px] uppercase tracking-[0.2em] mb-2",
                  formFieldInput: "clay-input w-full",
                  footerAction: "hidden",
                  dividerText: "text-artisanal-olive/40 font-bold uppercase text-[10px] tracking-widest",
                  formFieldAction: "text-artisanal-terracotta font-black text-[10px] uppercase tracking-widest",
                  identityPreviewText: "text-artisanal-brown font-bold",
                  identityPreviewEditButtonIcon: "text-artisanal-terracotta"
                },
                layout: {
                  shimmer: true,
                }
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* Floating Grain/Noise Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};

export default Login;
