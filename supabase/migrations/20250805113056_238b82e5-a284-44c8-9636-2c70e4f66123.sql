-- Allow unauthenticated users to view roles for signup
DROP POLICY IF EXISTS "Roles are viewable by authenticated users" ON public.roles;

CREATE POLICY "Roles are viewable by everyone" 
ON public.roles 
FOR SELECT 
USING (true);