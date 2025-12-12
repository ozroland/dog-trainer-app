-- Add Hungarian columns
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS title_hu text,
ADD COLUMN IF NOT EXISTS description_hu text,
ADD COLUMN IF NOT EXISTS content_markdown_hu text;

-- Update 'Sit Command'
UPDATE public.lessons 
SET 
  title_hu = 'Ül parancs',
  description_hu = 'Tanítsd meg kutyádnak az ül parancsot - ez minden képzés alapja.',
  content_markdown_hu = '## Lépések
1. Tarts egy jutalomfalatot a kutyád orra elé
2. Emeld fel a kezed, hogy a feje kövesse a falatot
3. Amikor a feneke a földre ér, mondd: "Ül"
4. Add oda neki a falatot és dicsérd meg
5. Ismételd naponta 5-10 alkalommal'
WHERE title = 'Sit Command';

-- Update 'Stay Command'
UPDATE public.lessons 
SET 
  title_hu = 'Marad parancs',
  description_hu = 'Fejleszd az önkontrollt a marad parancs megtanításával.',
  content_markdown_hu = '## Lépések
1. Kérd meg a kutyádat, hogy üljön le
2. Tartsd a tenyered elé, és mondd: "Marad"
3. Lépj hátra néhány lépést
4. Ha marad, menj vissza és jutalmazd meg
5. Fokozatosan növeld a távolságot és az időtartamot'
WHERE title = 'Stay Command';

-- Update 'Come When Called'
UPDATE public.lessons 
SET 
  title_hu = 'Behívás',
  description_hu = 'Biztosítsd, hogy kutyád megbízhatóan visszatérjen hozzád - ez kritikus biztonsági készség.',
  content_markdown_hu = '## Lépések
1. Tedd pórázra a kutyádat
2. Mondd a nevét, majd a "Gyere" parancsot lelkes hangon
3. Óvatosan húzd magad felé a pórázt
4. Amikor odaér hozzád, jutalmazd meg lelkesen
5. Gyakorold először ingerszegény környezetben'
WHERE title = 'Come When Called';

-- Update 'Loose Leash Walking'
UPDATE public.lessons 
SET 
  title_hu = 'Laza pórázos séta',
  description_hu = 'Élvezd a nyugodt sétákat húzás és rángatás nélkül.',
  content_markdown_hu = '## Lépések
1. Kezdj egy csendes területen
2. Tarts jutalomfalatokat a kezedben
3. Sétálj előre; ha a póráz megfeszül, azonnal állj meg
4. Várd meg, amíg a kutyád visszatér melléd
5. Jutalmazd meg és folytasd a sétát'
WHERE title = 'Loose Leash Walking';

-- Update 'Leave It'
UPDATE public.lessons 
SET 
  title_hu = 'Hagyd',
  description_hu = 'Tanítsd meg kutyádnak, hogy hagyja figyelmen kívül a zavaró tényezőket és veszélyeket.',
  content_markdown_hu = '## Lépések
1. Tegyél egy jutalomfalatot mindkét kezedbe
2. Mutasd az egyik zárt öklödet a falattal, mondd: "Hagyd"
3. Hagyd figyelmen kívül a mancsolást vagy szimatolást
4. Amikor elhúzódik, add oda a falatot a másik kezedből
5. Gyakorold egyre csábítóbb tárgyakkal'
WHERE title = 'Leave It';

-- Update 'Down Command'
UPDATE public.lessons 
SET 
  title_hu = 'Fekszik parancs',
  description_hu = 'Egy nyugtató pozíció, amely segít az önkontrollban.',
  content_markdown_hu = '## Lépések
1. Tarts egy jutalomfalatot a zárt öklödben
2. Tartsd a kezed a kutyád orrához
3. Mozgasd a kezed a padló felé
4. Csúsztasd a földön, hogy ösztönözd a lefekvést
5. Mondd: "Fekszik", és jutalmazd meg, amikor lefekszik'
WHERE title = 'Down Command';

-- Update 'Focus / Look at Me'
UPDATE public.lessons 
SET 
  title_hu = 'Fókusz / Nézz rám',
  description_hu = 'Tanítsd meg kutyádnak, hogy parancsra a szemedbe nézzen.',
  content_markdown_hu = '# Fókusz / Nézz rám

**Cél:** Érd el, hogy a kutyád parancsra a szemedbe nézzen.

1.  Tarts egy jutalomfalatot a kutyád orra közelébe.
2.  Lassan emeld a falatot a szemedhez.
3.  Amikor a kutyád a szemedbe néz, mondd, hogy "Igen!" vagy klikkelj, és add oda a falatot.
4.  Ismételd, amíg a kutyád megbízhatóan követi a kézmozdulatot.
5.  Add hozzá a "Nézz" vagy "Fókusz" vezényszót közvetlenül a kézmozdulat előtt.'
WHERE title = 'Focus / Look at Me';

-- Update 'Touch / Hand Target'
UPDATE public.lessons 
SET 
  title_hu = 'Érintés / Kéz érintése',
  description_hu = 'Tanítsd meg kutyádnak, hogy az orrával megérintse a kezedet.',
  content_markdown_hu = '# Érintés / Kéz érintése

**Cél:** A kutyád érintse meg az orrával a tenyeredet.

1.  Tartsd a nyitott tenyered a kutyád orra közelébe (falat nélkül).
2.  A legtöbb kutya megszagolja. Amint megérinti, mondd, hogy "Igen!", és jutalmazd meg a *másik* kezedből.
3.  Ismételd, amíg a kutyád lelkesen meg nem bökdösi a kezed.
4.  Add hozzá az "Érint" vezényszót, mielőtt odatartanád a kezed.
5.  Mozgasd a kezed különböző pozíciókba (magasra, alacsonyra, balra, jobbra).'
WHERE title = 'Touch / Hand Target';

-- Update 'Leave It (Basics)'
UPDATE public.lessons 
SET 
  title_hu = 'Hagyd (Alapok)',
  description_hu = 'Tanítsd meg kutyádnak, hogy hagyja figyelmen kívül a kezedben lévő falatot.',
  content_markdown_hu = '# Hagyd (Alapok)

**Cél:** Tanítsd meg kutyádnak az önkontrollt.

1.  Tarts egy jutalomfalatot zárt ökölben. Mutasd meg a kutyádnak.
2.  A kutyád nyalogatni, szimatolni vagy mancsolni fogja. **Hagyd figyelmen kívül.**
3.  Várd meg azt a pillanatot, amikor a kutyád elhúzódik vagy abbahagyja a próbálkozást.
4.  Azonnal mondd, hogy "Igen!", és adj neki egy falatot a *másik* kezedből (soha ne abból, amit megpróbált megszerezni).
5.  Ismételd, amíg a kutyád fel nem hagy azzal, hogy megszerezze a falatot az öklödből.
6.  Add hozzá a "Hagyd" vezényszót közvetlenül azelőtt, hogy odatartanád az öklödet.'
WHERE title = 'Leave It (Basics)';

-- Update 'Stay (Duration)'
UPDATE public.lessons 
SET 
  title_hu = 'Marad (Időtartam)',
  description_hu = 'Növeld a marad parancs időtartamát.',
  content_markdown_hu = '# Marad (Időtartam)

**Cél:** A kutyád maradjon ülve vagy fekve 10-30 másodpercig.

*Előfeltétel: Alapvető Ül vagy Fekszik.*

1.  Kérd meg a kutyádat, hogy üljön le.
2.  Tartsd fel a kezed, mint egy stoptábla, és mondd: "Marad".
3.  Várj 1 másodpercet. Mondd: "Igen!", és jutalmazd meg.
4.  Fokozatosan növeld az időt: 2mp, 3mp, 5mp, 10mp.
5.  Ha a kutyád felbontja a maradást, nyugodtan mondd: "Hoppá", és állítsd vissza.
6.  **Tipp:** Ne növeld túl gyorsan az időtartamot. Biztosítsd a sikerélményt.'
WHERE title = 'Stay (Duration)';

-- Update 'Recall (Come)'
UPDATE public.lessons 
SET 
  title_hu = 'Behívás (Gyere)',
  description_hu = 'Tanítsd meg kutyádnak, hogy hívásra odajöjjön hozzád.',
  content_markdown_hu = '# Behívás (Gyere)

**Cél:** A kutyád odajön hozzád, amikor a nevén szólítod.

1.  Kérd meg egy társadat, hogy fogja meg a kutyát, vagy várj, amíg a kutya figyelme elterelődik.
2.  Mondd a kutya nevét és a "Gyere!" vezényszót boldog, magas hangon.
3.  Fuss hátrafelé tőle, hogy kiváltsd az üldözési ösztönét.
4.  Amikor utolér, csapj nagy bulit! Jutalomfalat, dicséret, játék.
5.  **Soha** ne hívd a kutyádat büntetés céljából. A behívásnak mindig pozitívnak kell lennie.'
WHERE title = 'Recall (Come)';

-- Update 'Emergency Stop'
UPDATE public.lessons 
SET 
  title_hu = 'Vészmegállás',
  description_hu = 'Állítsd meg a kutyádat azonnal, akár távolról is.',
  content_markdown_hu = '# Vészmegállás

**Cél:** A kutyád azonnal megáll és leül/lefekszik, még távolról is.

1.  Kezdd azzal, hogy a kutyád melletted sétál.
2.  Hirtelen állj meg, és kérj egy "Ül"-t. Jutalmazd bőségesen.
3.  Fokozatosan növeld a távolságot. Kérd a kutyádat, hogy "Maradjon", sétálj el, majd hívd magadhoz.
4.  Behívás közben dobj egy játékot a hátad mögé, vagy használj kézjelet, és kiáltsd: "Állj!" vagy "Ül!".
5.  Ez nagy önkontrollt és sok gyakorlást igényel.'
WHERE title = 'Emergency Stop';

-- Update 'Heel (Competition Style)'
UPDATE public.lessons 
SET 
  title_hu = 'Lábhoz (Verseny stílus)',
  description_hu = 'A kutya pontosan a bal lábad mellett sétál.',
  content_markdown_hu = '# Lábhoz

**Cél:** A kutya válla a bal lábadhoz igazodik, függetlenül a tempódtól.

1.  Tarts egy magas értékű jutalomfalatot a bal kezedben, pont a kutyád orrának magasságában.
2.  Csalogasd pozícióba a lábad mellé.
3.  Lépj egyet. Ha veled marad, "Igen!" és jutalom.
4.  Fokozatosan növeld a lépéseket: 2, 3, 5, 10.
5.  Adj hozzá fordulatokat és tempóváltásokat.'
WHERE title = 'Heel (Competition Style)';

-- Update 'Place (Go to Bed)'
UPDATE public.lessons 
SET 
  title_hu = 'Helyedre (Menj a helyedre)',
  description_hu = 'Küldd a kutyádat egy adott szőnyegre vagy ágyra távolról.',
  content_markdown_hu = '# Helyedre / Menj a helyedre

**Cél:** Küldd a kutyádat egy célhelyre, és érd el, hogy ott maradjon.

1.  Állj az ágy közelébe. Csalogasd rá a kutyádat.
2.  Mondd: "Helyedre", ahogy rálép.
3.  Kérj egy fekvést és maradást. Jutalmazd meg.
4.  Oldd fel a "Szabad!" vezényszóval.
5.  Fokozatosan növeld a távolságot közted és az ágy között.
6.  Végül képesnek kell lenned rámutatni és azt mondani: "Helyedre" a szoba másik végéből.'
WHERE title = 'Place (Go to Bed)';
