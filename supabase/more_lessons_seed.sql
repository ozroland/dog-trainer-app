-- Insert new lessons for the progression system

-- Beginner Lessons (Need 3 to unlock Intermediate)
insert into lessons (title, description, difficulty, duration_minutes, content_markdown) values
('Focus / Look at Me', 'Teach your dog to make eye contact on command.', 'Beginner', 5, '# Focus / Look at Me

**Goal:** Get your dog to look at your eyes on command.

1.  Hold a treat near your dog''s nose.
2.  Slowly move the treat up to your eyes.
3.  When your dog looks at your eyes, say "Yes!" or click, and give the treat.
4.  Repeat until your dog follows the hand movement reliably.
5.  Add the cue "Look" or "Focus" just before moving your hand.
'),
('Touch / Hand Target', 'Teach your dog to touch their nose to your hand.', 'Beginner', 5, '# Touch / Hand Target

**Goal:** Have your dog touch their nose to your palm.

1.  Hold your open palm out near your dog''s nose (no treat in it).
2.  Most dogs will sniff it. The moment they touch it, say "Yes!" and treat from your *other* hand.
3.  Repeat until your dog eagerly bumps your hand.
4.  Add the cue "Touch" just before presenting your hand.
5.  Move your hand to different positions (high, low, left, right).
'),
('Leave It (Basics)', 'Teach your dog to ignore a treat in your hand.', 'Beginner', 10, '# Leave It (Basics)

**Goal:** Teach your dog impulse control.

1.  Hold a treat in a closed fist. Present it to your dog.
2.  Your dog will lick, sniff, or paw at it. **Ignore this.**
3.  Wait for the moment your dog pulls away or stops trying.
4.  Immediately say "Yes!" and give them a treat from your *other* hand (never the one they were trying to get).
5.  Repeat until your dog stops trying to get the treat in your fist.
6.  Add the cue "Leave It" right before you present your fist.
');

-- Intermediate Lessons (Need 3 to unlock Advanced)
insert into lessons (title, description, difficulty, duration_minutes, content_markdown) values
('Stay (Duration)', 'Build duration on the Stay command.', 'Intermediate', 15, '# Stay (Duration)

**Goal:** Have your dog hold a Sit or Down for 10-30 seconds.

*Prerequisite: Basic Sit or Down.*

1.  Ask your dog to Sit.
2.  Hold your hand up like a stop sign and say "Stay".
3.  Wait 1 second. Say "Yes!" and treat.
4.  Gradually increase the time: 2s, 3s, 5s, 10s.
5.  If your dog breaks the stay, calmly say "Oops" and reset them.
6.  **Tip:** Don''t increase duration too fast. Set them up for success.
'),
('Loose Leash Walking', 'Teach your dog to walk without pulling.', 'Intermediate', 20, '# Loose Leash Walking

**Goal:** Walk with a loose leash (J-shape).

1.  Start in a low-distraction area (like your living room).
2.  Hold the leash but give your dog plenty of slack.
3.  Start walking. If the leash is loose, praise and treat frequently right by your leg.
4.  If the leash goes tight (dog pulls), **stop immediately**. Be a tree.
5.  Wait for your dog to look back or step towards you to loosen the leash.
6.  Praise and start walking again.
'),
('Recall (Come)', 'Teach your dog to come when called.', 'Intermediate', 15, '# Recall (Come)

**Goal:** Your dog comes to you when you call their name.

1.  Have a partner hold your dog, or wait for your dog to be distracted.
2.  Call your dog''s name and "Come!" in a happy, high-pitched voice.
3.  Run backwards away from them to trigger their chase instinct.
4.  When they catch you, have a huge party! Treats, praise, play.
5.  **Never** call your dog to punish them. Recall must always be positive.
');

-- Advanced Lessons (Unlocked after mastering Intermediate)
insert into lessons (title, description, difficulty, duration_minutes, content_markdown) values
('Emergency Stop', 'Stop your dog instantly at a distance.', 'Advanced', 20, '# Emergency Stop

**Goal:** Your dog stops and sits/downs immediately, even at a distance.

1.  Start with your dog walking beside you.
2.  Suddenly stop and ask for a "Sit". Reward heavily.
3.  Gradually add distance. Ask your dog to "Stay", walk away, then call them.
4.  Mid-recall, throw a toy behind you or use a hand signal and shout "Stop!" or "Sit!".
5.  This requires high impulse control and lots of practice.
'),
('Heel (Competition Style)', 'Dog walks precisely by your left leg.', 'Advanced', 25, '# Heel

**Goal:** Dog''s shoulder stays aligned with your left leg, regardless of your pace.

1.  Hold a high-value treat in your left hand, right at your dog''s nose level.
2.  Lure them into position by your leg.
3.  Take one step. If they stay with you, "Yes!" and treat.
4.  Gradually increase steps: 2, 3, 5, 10.
5.  Add turns and pace changes.
'),
('Place (Go to Bed)', 'Send your dog to a specific mat or bed from a distance.', 'Advanced', 15, '# Place / Go to Bed

**Goal:** Send your dog to a target spot and have them stay there.

1.  Stand near the bed. Lure your dog onto it.
2.  Say "Place" as they step on.
3.  Ask for a Down and Stay. Treat.
4.  Release them with "Free!".
5.  Gradually add distance between you and the bed.
6.  Eventually, you should be able to point and say "Place" from across the room.
');
