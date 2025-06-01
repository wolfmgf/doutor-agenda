-- Adiciona colunas do Stripe
ALTER TABLE users
ADD COLUMN stripe_customer_id TEXT,
ADD COLUMN stripe_subscription_id TEXT,
ADD COLUMN plan TEXT;

-- Corrige o tipo da coluna available_from_week_day
ALTER TABLE doctors
ALTER COLUMN available_from_week_day TYPE integer USING available_from_week_day::integer,
ALTER COLUMN available_to_week_day TYPE integer USING available_to_week_day::integer; 