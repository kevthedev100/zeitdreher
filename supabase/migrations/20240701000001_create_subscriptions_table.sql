-- Create subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  stripe_id TEXT NOT NULL,
  stripe_price_id TEXT,
  price_id TEXT,
  quantity INTEGER DEFAULT 1,
  status TEXT NOT NULL,
  currency TEXT,
  interval TEXT,
  interval_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_start INTEGER,
  current_period_end INTEGER,
  ended_at INTEGER,
  cancel_at INTEGER,
  canceled_at INTEGER,
  trial_start INTEGER,
  trial_end INTEGER,
  amount INTEGER,
  customer_id TEXT,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  items JSONB
);

-- Add RLS policies for subscriptions table
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscriptions
DROP POLICY IF EXISTS "Users can read their own subscriptions" ON subscriptions;
CREATE POLICY "Users can read their own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert/update/delete subscriptions
DROP POLICY IF EXISTS "Only service role can insert subscriptions" ON subscriptions;
CREATE POLICY "Only service role can insert subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Only service role can update subscriptions" ON subscriptions;
CREATE POLICY "Only service role can update subscriptions"
  ON subscriptions FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Only service role can delete subscriptions" ON subscriptions;
CREATE POLICY "Only service role can delete subscriptions"
  ON subscriptions FOR DELETE
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create webhook_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  type TEXT NOT NULL,
  stripe_event_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data JSONB
);

-- Add RLS policies for webhook_events table
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service role can access webhook_events
DROP POLICY IF EXISTS "Only service role can select webhook_events" ON webhook_events;
CREATE POLICY "Only service role can select webhook_events"
  ON webhook_events FOR SELECT
  USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Only service role can insert webhook_events" ON webhook_events;
CREATE POLICY "Only service role can insert webhook_events"
  ON webhook_events FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Only service role can update webhook_events" ON webhook_events;
CREATE POLICY "Only service role can update webhook_events"
  ON webhook_events FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Only service role can delete webhook_events" ON webhook_events;
CREATE POLICY "Only service role can delete webhook_events"
  ON webhook_events FOR DELETE
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Add realtime for subscriptions
alter publication supabase_realtime add table subscriptions;
