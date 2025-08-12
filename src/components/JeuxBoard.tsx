import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import SignIn from '@/components/auth/SignIn';
import SignUp from '@/components/auth/SignUp';

const JeuxBoard: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showAuth, setShowAuth] = useState<'signin' | 'signup'>('signin');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto animate-cyber-glow">
            <div className="w-8 h-8 border-2 border-primary-foreground rounded-full animate-spin border-t-transparent"></div>
          </div>
          <h2 className="text-xl font-bold text-foreground">Initializing JeuxBoard...</h2>
          <p className="text-muted-foreground">Loading your workspace</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AnimatePresence mode="wait">
        {showAuth === 'signin' ? (
          <SignIn 
            key="signin"
            onSwitchToSignUp={() => setShowAuth('signup')} 
          />
        ) : (
          <SignUp 
            key="signup"
            onSwitchToSignIn={() => setShowAuth('signin')} 
          />
        )}
      </AnimatePresence>
    );
  }

  return <AppLayout currentPage={currentPage} setCurrentPage={setCurrentPage} />;
};

export default JeuxBoard;