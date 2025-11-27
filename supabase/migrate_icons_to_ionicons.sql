-- Migrate achievement icons from Emojis to Ionicons names
update achievements set icon = 'paw' where id = 'first_step';
update achievements set icon = 'book' where id = 'dedicated_student';
update achievements set icon = 'flame' where id = 'streak_master';
update achievements set icon = 'school' where id = 'puppy_grad';
