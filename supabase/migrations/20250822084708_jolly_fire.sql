@@ .. @@
     END IF;
   END $$;
   
-  -- Users can read own profile policy
-  DO $$
-  BEGIN
-    IF NOT EXISTS (
-      SELECT 1 FROM pg_policies 
-      WHERE schemaname = 'public' 
-        AND tablename = 'profiles' 
-        AND policyname = 'Users can read own profile'
-    ) THEN
-      CREATE POLICY "Users can read own profile"
-        ON profiles
-        FOR SELECT
-        TO authenticated
-        USING (auth.uid() = id);
-    END IF;
-  END $$;
-  
   -- Users can update own profile policy
   DO $$