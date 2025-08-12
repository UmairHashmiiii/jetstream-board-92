import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  auth_id: string;
  name: string;
  email: string;
  role_id: string;
  avatar_url?: string;
  role_name?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string, name: string, roleId: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  signIn: async () => ({}),
  signUp: async () => ({}),
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authId: string) => {
    try {
      const { data, error, status } = await supabase
        .from('users')
        .select(`
          *,
          role:roles(name)
        `)
        .eq('auth_id', authId)
        .single();

      if (error) {
        // If no profile exists yet, create a minimal one automatically
        const noRow = status === 406 || (error as any)?.code === 'PGRST116';
        if (!noRow) throw error;

        const { data: authData } = await supabase.auth.getUser();
        const authUser = authData?.user;
        if (!authUser) return;

        // Pick a default role (prefer 'member', otherwise first available)
        const { data: roles } = await supabase
          .from('roles')
          .select('id, name')
          .order('name');
        const defaultRoleId = roles?.find(r => r.name === 'member')?.id || roles?.[0]?.id;
        if (!defaultRoleId) {
          console.warn('No roles found to assign to new profile. Skipping profile creation.');
          setProfile(null);
          return;
        }

        const { data: created, error: createErr } = await supabase
          .from('users')
          .insert({
            auth_id: authUser.id,
            name: (authUser.user_metadata as any)?.name || authUser.email?.split('@')[0] || 'User',
            email: authUser.email || '',
            role_id: defaultRoleId,
          })
          .select(`*, role:roles(name)`) 
          .single();
        if (createErr) throw createErr;
        setProfile({ ...created, role_name: created.role?.name });
        return;
      }

      // Profile found
      setProfile({
        ...data,
        role_name: data.role?.name,
      });
    } catch (error) {
      console.error('Error fetching/creating user profile:', error);
    }
  };
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) return { error };
    
    // Ensure we fetch the user profile after successful login
    if (data.user) {
      await fetchUserProfile(data.user.id);
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string, name: string, roleId: string) => {
    // Sign up without forcing email confirmation flow on client side
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Do not pass emailRedirectTo to avoid sending magic link redirects
        data: { name, role_id: roleId },
      },
    });

    if (error) return { error };

    // If no session was returned, try to sign the user in immediately
    let activeUser = data.user;
    let activeSession = data.session;
    if (!activeSession && email && password) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        // Most common case if email confirmations are enabled in Supabase settings
        return { error: signInError };
      }
      activeUser = signInData.user;
      activeSession = signInData.session;
    }

    // Create profile only if we have an authenticated session (RLS requires auth.uid())
    if (activeUser && activeSession) {
      const { error: profileError } = await supabase.from('users').insert({
        auth_id: activeUser.id,
        name,
        email,
        role_id: roleId,
      });
      if (profileError) {
        console.error('Profile creation error:', profileError);
        return { error: profileError };
      }
      await fetchUserProfile(activeUser.id);
    }

    return { error: undefined };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};