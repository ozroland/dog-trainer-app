-- Additional lessons for DogTrainerApp v1
-- Run this after the initial lessons_seed.sql

-- More Beginner Lessons
INSERT INTO public.lessons (title, description, difficulty, duration_minutes, content_markdown, title_hu, description_hu, content_markdown_hu) VALUES

('Name Recognition', 'Teach your dog to respond when you call their name.', 'Beginner', 5, 
'## Steps
1. Say your dog''s name once in a happy tone
2. The moment they look at you, mark with "Yes!" or a clicker
3. Give them a treat immediately
4. Practice in quiet environments first
5. Never repeat the name multiple times - say it once and wait

## Tips
- Use a clear, upbeat voice
- Avoid using their name when scolding
- Practice before meals when motivation is high',
'Névre reagálás', 'Tanítsd meg a kutyádat, hogy reagáljon, amikor szólítod.', 
'## Lépések
1. Mondd ki a kutyád nevét egyszer vidám hangon
2. Amint rád néz, jelezd "Igen!" szóval vagy klikkerrel
3. Azonnal adj neki jutalomfalatot
4. Először csendes környezetben gyakorolj
5. Soha ne ismételd a nevét többször - mondd egyszer és várj

## Tippek
- Használj tiszta, vidám hangot
- Kerüld a nevének használatát szidáskor
- Étkezés előtt gyakorolj, amikor a motiváció magas'),

('Touch Command', 'Teach your dog to touch your hand with their nose - great for focus.', 'Beginner', 8,
'## Steps
1. Hold your flat palm a few inches from your dog''s nose
2. Most dogs will sniff naturally - mark and reward this
3. Add the word "Touch" before presenting your hand
4. Gradually move your hand further away
5. Practice in different positions (high, low, sides)

## Why Touch Is Useful
- Redirects attention in distracting situations
- Helps with shy or fearful dogs
- Foundation for more advanced tricks',
'Érintés parancs', 'Tanítsd meg a kutyádat, hogy az orrával érintse a kezedet - nagyszerű a fókuszáláshoz.',
'## Lépések
1. Tartsd lapos tenyeredet néhány centire a kutyád orrától
2. A legtöbb kutya természetesen szaglássza meg - jelezd és jutalmazd
3. Add hozzá az "Érintés" szót, mielőtt bemutatod a kezedet
4. Fokozatosan távolítsd el a kezedet
5. Gyakorolj különböző pozíciókban (magasan, alacsonyan, oldalra)

## Miért hasznos az érintés
- Eltereli a figyelmet zavaró helyzetekben
- Segít a félénk vagy ijedt kutyáknak
- Alapja a haladóbb trükköknek'),

('Crate Training Basics', 'Help your dog love their crate as a safe space.', 'Beginner', 15,
'## Steps
1. Place the crate in a common area with door open
2. Toss treats inside and let your dog explore freely
3. Feed meals inside the crate
4. Practice closing the door for short periods
5. Gradually increase duration

## Important Tips
- Never use the crate as punishment
- Make it cozy with a blanket
- Cover with a cloth for a den-like feel',
'Ketrec szoktatás alapjai', 'Segíts a kutyádnak, hogy szeresse a ketrecét biztonságos helyként.',
'## Lépések
1. Helyezd a ketrecet egy közös területre nyitott ajtóval
2. Dobj jutalomfalatokat bele és hagyd a kutyádat szabadon felfedezni
3. A ketrecben étkezzék
4. Gyakorold az ajtó bezárását rövid időre
5. Fokozatosan növeld az időtartamot

## Fontos tippek
- Soha ne használd a ketrecet büntetésként
- Tedd kényelmessé egy takaróval
- Takard le egy ruhával a barlangszerű érzésért');

-- More Intermediate Lessons
INSERT INTO public.lessons (title, description, difficulty, duration_minutes, content_markdown, title_hu, description_hu, content_markdown_hu) VALUES

('Wait at Doors', 'Teach your dog to wait politely at doorways for safety.', 'Intermediate', 10,
'## Steps
1. Approach a door with your dog on leash
2. Ask for a sit
3. Reach for the handle - if they move, remove your hand
4. Repeat until they stay while you touch the handle
5. Open slightly, close if they move
6. Release with "Okay" when door is fully open

## Safety First
This command prevents door-dashing and keeps your dog safe.',
'Várakozás az ajtóknál', 'Tanítsd meg a kutyádat, hogy udvariasan várjon az ajtóknál a biztonság érdekében.',
'## Lépések
1. Közelíts egy ajtóhoz a kutyáddal pórázons
2. Kérj egy ülésts
3. Nyúlj a kilincs felé - ha mozog, húzd vissza a kezedet
4. Ismételd, amíg marad, miközben megérinted a kilincset
5. Nyisd ki kissé, zárd be ha mozog
6. Engedd el "Oké" szóval, amikor az ajtó teljesen nyitva van

## A biztonság az első
Ez a parancs megakadályozza az ajtón való kirohanást és biztonságban tartja a kutyádat.'),

('Place Command', 'Send your dog to a designated spot and stay there.', 'Intermediate', 15,
'## Steps
1. Choose a mat, bed, or towel as the "place"
2. Lure your dog onto it with a treat
3. Say "Place" as they step on it
4. Reward them for staying
5. Use "Free" or "Okay" to release them

## Use Cases
- Doorbell rings
- Cooking in kitchen
- Guests visiting
- Outdoor cafes',
'Hely parancs', 'Küldd a kutyádat egy kijelölt helyre és maradjon ott.',
'## Lépések
1. Válassz egy szőnyeget, ágyat vagy törölközőt "helynek"
2. Csald a kutyádat rá egy jutalomfalattal
3. Mondd "Hely" ahogy rálép
4. Jutalmazd a maradásért
5. Használd a "Szabad" vagy "Oké" szót az elengedéshez

## Használati esetek
- Csengő szól
- Főzés a konyhában
- Vendégek látogatása
- Kültéri kávézók'),

('Heel Position', 'Walk with your dog in perfect position at your side.', 'Intermediate', 20,
'## Steps
1. Start with your dog sitting at your left side
2. Hold treat at your left hip
3. Take one step forward, lure them with the treat
4. Reward for staying at your side
5. Gradually add more steps

## Practice Tips
- Short sessions (2-3 minutes)
- Use high-value treats
- Practice indoors first',
'Lábhoz pozíció', 'Sétálj a kutyáddal tökéletes pozícióban az oldaladnál.',
'## Lépések
1. Kezdd a kutyáddal ülve a bal oldaladnál
2. Tartsd a jutalomfalatot a bal csípődnél
3. Lépj egyet előre, csald őket a jutalomfalattal
4. Jutalmazd az oldaladnál maradásért
5. Fokozatosan adj hozzá több lépést

## Gyakorlási tippek
- Rövid foglalkozások (2-3 perc)
- Használj magas értékű jutalomfalatokat
- Először bent gyakorolj');

-- Advanced Lessons
INSERT INTO public.lessons (title, description, difficulty, duration_minutes, content_markdown, title_hu, description_hu, content_markdown_hu) VALUES

('Off-Leash Recall', 'Build reliable recall even without a leash in distracting environments.', 'Advanced', 25,
'## Prerequisites
- Master "Come" on leash first
- Practice in fenced areas initially

## Steps
1. Start in a fenced, low-distraction area
2. Let your dog explore, then call them
3. Run backwards to make it exciting
4. Throw a party when they come - best treats ever!
5. Never call them for something unpleasant

## Emergency Recall
Create a special word used ONLY for emergencies with jackpot rewards.',
'Póráz nélküli behívás', 'Építs megbízható behívást akár póráz nélkül is zavaró környezetben.',
'## Előfeltételek
- Először sajátítsd el a "Gyere" parancsot pórázons
- Először kerített területeken gyakorolj

## Lépések
1. Kezdd kerített, alacsony zavarású területen
2. Hagyd a kutyádat felfedezni, majd hívd
3. Fuss hátrafelé, hogy izgalmassá tedd
4. Rendezz partit amikor jön - a legjobb jutalomfalatokkal!
5. Soha ne hívd valami kellemetlenért

## Vészhelyzeti behívás
Hozz létre egy speciális szót CSAK vészhelyzetekre jackpot jutalommal.'),

('Impulse Control Games', 'Build your dog''s ability to resist temptation.', 'Advanced', 15,
'## Game 1: It''s Your Choice
1. Hold treats in closed fist
2. Let dog sniff, paw, lick - ignore it
3. When they back away or look up, mark and reward
4. Repeat with open palm

## Game 2: Cookie Zen
1. Place treat on floor, cover with your hand
2. When dog stops trying, remove hand
3. If they go for it, cover again
4. Release with "Take it" when calm

## Game 3: Wait for Food
1. Hold food bowl
2. Lower it, raise if they move
3. Bowl only goes down when they''re calm',
'Impulzuskontroll játékok', 'Építsd a kutyád képességét a kísértésnek való ellenállásra.',
'## 1. Játék: A Te Választásod
1. Tarts jutalomfalatokat zárt ökölben
2. Hagyd a kutyát szaglászni, kaparni, nyalni - hagyd figyelmen kívül
3. Amikor hátrébb lép vagy felnéz, jelezd és jutalmazd
4. Ismételd nyitott tenyérrel

## 2. Játék: Süti Zen
1. Helyezz jutalomfalatot a padlóra, takard le a kezeddel
2. Amikor a kutya abbahagyja a próbálkozást, vedd el a kezed
3. Ha utána megy, takard le újra
4. Engedd el "Vedd el" szóval amikor nyugodt

## 3. Játék: Várj az ételre
1. Tartsd az ételes tálat
2. Engedd le, emeld fel ha mozog
3. A tál csak akkor megy le, ha nyugodt'),

('Emergency Stop', 'A life-saving skill to stop your dog instantly at a distance.', 'Advanced', 20,
'## When You Need This
- Dog running toward a road
- Approaching a dangerous animal
- Any emergency situation

## Steps
1. Start with dog close on leash
2. Say "STOP" firmly, lure into a down
3. Reward heavily
4. Practice at increasing distances
5. Practice in various environments

## Critical Tips
- Use this command ONLY in training or real emergencies
- Always jackpot reward
- Never punish after they stop',
'Vészleállás', 'Életmentő képesség a kutyád azonnali megállítására távolságból.',
'## Mikor van erre szükséged
- Kutya fut az út felé
- Veszélyes állathoz közeledik
- Bármilyen vészhelyzet

## Lépések
1. Kezdd a kutyával közelról pórázons
2. Mondd határozottan "ÁLLJ", csald lefekési pozícióba
3. Bőségesen jutalmazd
4. Gyakorolj növekvő távolságokból
5. Gyakorolj különböző környezetekben

## Kritikus tippek
- Használd ezt a parancsot CSAK edzésben vagy valódi vészhelyzetben
- Mindig jackpot jutalom
- Soha ne büntess miután megállt');
