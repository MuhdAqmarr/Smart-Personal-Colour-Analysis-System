-- Shopping-gender preference for product suggestions.
-- Chosen explicitly by the user (never inferred from the photo); defaults to
-- "everyone" so suggestions are unfiltered until the user opts in.
alter table public.user_preferences
  add column shopping_gender text not null default 'everyone';

alter table public.user_preferences
  add constraint user_preferences_shopping_gender_check
  check (shopping_gender in ('everyone', 'women', 'men', 'unisex'));
