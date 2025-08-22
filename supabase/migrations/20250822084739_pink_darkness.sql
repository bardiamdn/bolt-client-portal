
 ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
 
--- Create policies for profiles table
-DO $$
-BEGIN
-  IF NOT EXISTS (
-    SELECT 1 FROM pg_policies 
-    WHERE tablename = 'profiles' AND policyname = 'Users can read own profile'
-  ) THEN
-    CREATE POLICY "Users can read own profile"
-      ON profiles
-      FOR SELECT
-      TO authenticated
-      USING (auth.uid() = id);
-  END IF;
-END $$;
-
 DO $$
 BEGIN