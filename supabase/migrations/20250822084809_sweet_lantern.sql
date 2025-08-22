ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
 
--- Create policy for profiles if it doesn't exist
-DO $$
-BEGIN
-  IF NOT EXISTS (
-    SELECT 1 FROM pg_policies 
-    WHERE tablename = 'profiles' 
-    AND policyname = 'Users can read own profile'
-  ) THEN
-    CREATE POLICY "Users can read own profile"
-      ON profiles
-      FOR SELECT
-      TO authenticated
-      USING (auth.uid() = id);
-  END IF;
-END $$;
-
 -- Create policy for profiles update if it doesn't exist
 DO $$