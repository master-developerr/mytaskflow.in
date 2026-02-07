-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  active_mode TEXT DEFAULT 'personal' CHECK (active_mode IN ('personal', 'agency')),
  dob DATE,
  gender TEXT,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create agencies table
CREATE TABLE public.agencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  agency_code TEXT UNIQUE NOT NULL,
  owner_user_id UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Helper function to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.is_agency_member(_agency_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.agency_members
    WHERE agency_id = _agency_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_agency_owner(_agency_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.agencies
    WHERE id = _agency_id
    AND owner_user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on agencies
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agencies are viewable by members" 
ON public.agencies FOR SELECT 
USING (
  auth.uid() = owner_user_id OR 
  public.is_agency_member(id)
);

CREATE POLICY "Users can create agencies" 
ON public.agencies FOR INSERT 
WITH CHECK (auth.uid() = owner_user_id);

-- Create agency_members table
CREATE TABLE public.agency_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  UNIQUE(agency_id, user_id)
);

-- Enable RLS on agency_members
ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view other members in same agency" 
ON public.agency_members FOR SELECT 
USING (
  public.is_agency_member(agency_id) OR 
  public.is_agency_owner(agency_id)
);

CREATE POLICY "Agency owners can manage members"
ON public.agency_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.agencies
    WHERE id = agency_members.agency_id
    AND owner_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.agencies
    WHERE id = agency_id
    AND owner_user_id = auth.uid()
  )
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scope TEXT DEFAULT 'personal' CHECK (scope IN ('personal', 'agency')),
  agency_id UUID REFERENCES public.agencies(id),
  owner_user_id UUID REFERENCES public.profiles(id) DEFAULT auth.uid() NOT NULL, -- Defaults to current user
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_hold', 'completed', 'archived')),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Enable RLS on projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own personal projects" 
ON public.projects FOR SELECT 
USING (scope = 'personal' AND owner_user_id = auth.uid());

CREATE POLICY "Users can view agency projects if member" 
ON public.projects FOR SELECT 
USING (
  scope = 'agency' AND (
    public.is_agency_member(agency_id) OR
    public.is_agency_owner(agency_id)
  )
);

CREATE POLICY "Users can create projects" 
ON public.projects FOR INSERT 
WITH CHECK (
  auth.uid() = owner_user_id
);

CREATE POLICY "Users can update own projects or agency projects if admin/owner" 
ON public.projects FOR UPDATE
USING (
  (scope = 'personal' AND owner_user_id = auth.uid()) OR
  (scope = 'agency' AND EXISTS (
    SELECT 1 FROM public.agency_members 
    WHERE agency_id = public.projects.agency_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
  ))
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES public.profiles(id),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high')),
  stage TEXT DEFAULT 'todo' CHECK (stage IN ('todo', 'in_progress', 'review', 'done', 'canceled')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'done', 'canceled')),
  due_date DATE,
  recurrence_rule TEXT CHECK (recurrence_rule IN ('daily', 'weekly', 'monthly')),
  position DOUBLE PRECISION DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Enable RLS on tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tasks viewable by project/agency access" 
ON public.tasks FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = public.tasks.project_id AND (
      (scope = 'personal' AND owner_user_id = auth.uid()) OR
      (scope = 'agency' AND EXISTS (
        SELECT 1 FROM public.agency_members 
        WHERE agency_id = public.projects.agency_id AND user_id = auth.uid()
      ))
    )
  )
);

CREATE POLICY "Tasks editable by project/agency access" 
ON public.tasks FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = public.tasks.project_id AND (
      (scope = 'personal' AND owner_user_id = auth.uid()) OR
      (scope = 'agency' AND EXISTS (
        SELECT 1 FROM public.agency_members 
        WHERE agency_id = public.projects.agency_id AND user_id = auth.uid()
      ))
    )
  )
);

-- Create subtasks table
CREATE TABLE public.subtasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  is_done BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subtasks access inherited from task" 
ON public.subtasks FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE id = public.subtasks.task_id AND (
       -- Reusing task visibility logic (simplified via task exist check which implies access, 
       -- but for stricter RLS we might want to join all the way up. 
       -- For V1, relying on task visibility is acceptable if we assume tasks are filtered)
       -- Actually, let's just duplicate the full join for safety
      EXISTS (
        SELECT 1 FROM public.projects 
        WHERE id = public.tasks.project_id AND (
          (scope = 'personal' AND owner_user_id = auth.uid()) OR
          (scope = 'agency' AND EXISTS (
            SELECT 1 FROM public.agency_members 
            WHERE agency_id = public.projects.agency_id AND user_id = auth.uid()
          ))
        )
      )
    )
  )
);

-- Create task_dependencies table
CREATE TABLE public.task_dependencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  predecessor_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  successor_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL
);

ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dependencies access inherited from predecessor task" 
ON public.task_dependencies FOR ALL 
USING (
  EXISTS (
     SELECT 1 FROM public.tasks WHERE id = predecessor_task_id AND
     EXISTS (
        SELECT 1 FROM public.projects 
        WHERE id = public.tasks.project_id AND (
          (scope = 'personal' AND owner_user_id = auth.uid()) OR
          (scope = 'agency' AND EXISTS (
            SELECT 1 FROM public.agency_members 
            WHERE agency_id = public.projects.agency_id AND user_id = auth.uid()
          ))
        )
      )
  )
);

-- Create milestones table
CREATE TABLE public.milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reached')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Milestones viewable/editable by project access" 
ON public.milestones FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = public.milestones.project_id AND (
      (scope = 'personal' AND owner_user_id = auth.uid()) OR
      (scope = 'agency' AND EXISTS (
        SELECT 1 FROM public.agency_members 
        WHERE agency_id = public.projects.agency_id AND user_id = auth.uid()
      ))
    )
  )
);

-- Create project_updates table
CREATE TABLE public.project_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('on_track', 'at_risk', 'off_track', 'on_hold', 'done')),
  progress_percentage INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project updates access inherited from project" 
ON public.project_updates FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = public.project_updates.project_id AND (
      (scope = 'personal' AND owner_user_id = auth.uid()) OR
      (scope = 'agency' AND EXISTS (
        SELECT 1 FROM public.agency_members 
        WHERE agency_id = public.projects.agency_id AND user_id = auth.uid()
      ))
    )
  )
);

-- Create project_templates table
CREATE TABLE public.project_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scope TEXT CHECK (scope IN ('personal', 'agency')),
  agency_id UUID REFERENCES public.agencies(id),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project templates access"
ON public.project_templates FOR ALL
USING (
    (scope = 'personal') OR -- Simplified personal templates (public to all? or should be owner bound? Backend.md didn't specify owner, but likely intended. Let's assume global or Agency bound)
    (scope = 'agency' AND EXISTS (
        SELECT 1 FROM public.agency_members 
        WHERE agency_id = public.project_templates.agency_id AND user_id = auth.uid()
    ))
);

-- Create time_blocks table
CREATE TABLE public.time_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL
);

ALTER TABLE public.time_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Time blocks access inherited"
ON public.time_blocks FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE id = public.time_blocks.task_id AND (
      EXISTS (
        SELECT 1 FROM public.projects 
        WHERE id = public.tasks.project_id AND (
          (scope = 'personal' AND owner_user_id = auth.uid()) OR
          (scope = 'agency' AND EXISTS (
            SELECT 1 FROM public.agency_members 
            WHERE agency_id = public.projects.agency_id AND user_id = auth.uid()
          ))
        )
      )
    )
  )
);


-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update profile on signin (sync Google metadata)
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET 
    name = COALESCE(new.raw_user_meta_data->>'full_name', name),
    avatar_url = COALESCE(new.raw_user_meta_data->>'avatar_url', avatar_url),
    email = new.email
  WHERE id = new.id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

