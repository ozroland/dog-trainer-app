-- Add Hungarian columns to achievements table
ALTER TABLE public.achievements 
ADD COLUMN IF NOT EXISTS title_hu text,
ADD COLUMN IF NOT EXISTS description_hu text;

-- Update existing achievements with Hungarian translations
UPDATE public.achievements 
SET 
    title_hu = 'Első Lépés',
    description_hu = 'Teljesítsd az első leckét'
WHERE id = 'first_step';

UPDATE public.achievements 
SET 
    title_hu = 'Elkötelezett Tanuló',
    description_hu = 'Teljesíts 5 leckét'
WHERE id = 'dedicated_student';

UPDATE public.achievements 
SET 
    title_hu = 'Széria Mester',
    description_hu = 'Tarts fenn egy 3 napos szériát'
WHERE id = 'streak_master';

UPDATE public.achievements 
SET 
    title_hu = 'Kölyök Diplomás',
    description_hu = 'Teljesítsd az Alap Parancsok kurzust'
WHERE id = 'puppy_grad';
