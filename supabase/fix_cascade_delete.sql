-- Fix: Add ON DELETE CASCADE to walks table foreign key
-- This allows dogs to be deleted even if they have associated walks

-- First, drop the existing constraint
ALTER TABLE walks 
DROP CONSTRAINT IF EXISTS walks_dog_id_fkey;

-- Re-add with CASCADE
ALTER TABLE walks 
ADD CONSTRAINT walks_dog_id_fkey 
FOREIGN KEY (dog_id) 
REFERENCES dogs(id) 
ON DELETE CASCADE;

-- Also fix walk_events if it exists
ALTER TABLE walk_events 
DROP CONSTRAINT IF EXISTS walk_events_walk_id_fkey;

ALTER TABLE walk_events 
ADD CONSTRAINT walk_events_walk_id_fkey 
FOREIGN KEY (walk_id) 
REFERENCES walks(id) 
ON DELETE CASCADE;

-- Fix calendar_events if it exists
ALTER TABLE calendar_events 
DROP CONSTRAINT IF EXISTS calendar_events_dog_id_fkey;

ALTER TABLE calendar_events 
ADD CONSTRAINT calendar_events_dog_id_fkey 
FOREIGN KEY (dog_id) 
REFERENCES dogs(id) 
ON DELETE CASCADE;

-- Fix weight_logs if it exists  
ALTER TABLE weight_logs 
DROP CONSTRAINT IF EXISTS weight_logs_dog_id_fkey;

ALTER TABLE weight_logs 
ADD CONSTRAINT weight_logs_dog_id_fkey 
FOREIGN KEY (dog_id) 
REFERENCES dogs(id) 
ON DELETE CASCADE;

-- Fix health_records if it exists
ALTER TABLE health_records 
DROP CONSTRAINT IF EXISTS health_records_dog_id_fkey;

ALTER TABLE health_records 
ADD CONSTRAINT health_records_dog_id_fkey 
FOREIGN KEY (dog_id) 
REFERENCES dogs(id) 
ON DELETE CASCADE;

-- Fix training_sessions if it exists
ALTER TABLE training_sessions 
DROP CONSTRAINT IF EXISTS training_sessions_dog_id_fkey;

ALTER TABLE training_sessions 
ADD CONSTRAINT training_sessions_dog_id_fkey 
FOREIGN KEY (dog_id) 
REFERENCES dogs(id) 
ON DELETE CASCADE;
