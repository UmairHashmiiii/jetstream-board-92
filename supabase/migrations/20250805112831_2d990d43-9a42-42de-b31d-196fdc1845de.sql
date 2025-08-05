-- Create roles table
CREATE TABLE public.roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create users table (profiles)
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role_id UUID NOT NULL REFERENCES public.roles(id),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  stack TEXT,
  sprint TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'not_started',
  created_by UUID NOT NULL REFERENCES public.users(auth_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_members table
CREATE TABLE public.project_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(auth_id),
  role_in_project TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Create project_modules table
CREATE TABLE public.project_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'not_started',
  assigned_to UUID REFERENCES public.users(auth_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_modules ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for roles (readable by authenticated users)
CREATE POLICY "Roles are viewable by authenticated users" 
ON public.roles 
FOR SELECT 
TO authenticated 
USING (true);

-- Create RLS Policies for users
CREATE POLICY "Users can view all users" 
ON public.users 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.users 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = auth_id);

CREATE POLICY "Users can insert their own profile" 
ON public.users 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = auth_id);

-- Create RLS Policies for projects
CREATE POLICY "Users can view all projects" 
ON public.projects 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can create projects" 
ON public.projects 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Project creators can update their projects" 
ON public.projects 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = created_by);

CREATE POLICY "Project creators can delete their projects" 
ON public.projects 
FOR DELETE 
TO authenticated 
USING (auth.uid() = created_by);

-- Create RLS Policies for project_members
CREATE POLICY "Users can view project members" 
ON public.project_members 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can join projects" 
ON public.project_members 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Create RLS Policies for project_modules
CREATE POLICY "Users can view all project modules" 
ON public.project_modules 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can create project modules" 
ON public.project_modules 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Users can update project modules" 
ON public.project_modules 
FOR UPDATE 
TO authenticated 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_modules_updated_at
  BEFORE UPDATE ON public.project_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default roles
INSERT INTO public.roles (name, description) VALUES 
  ('admin', 'Administrator with full access'),
  ('project_manager', 'Project manager with project management rights'),
  ('developer', 'Developer with development access'),
  ('user', 'Regular user with basic access');

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, name, email, role_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    (SELECT id FROM public.roles WHERE name = 'user' LIMIT 1)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();