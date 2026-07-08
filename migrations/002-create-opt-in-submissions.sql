-- Opt-in submissions from physical outreach letters
CREATE TABLE IF NOT EXISTS opt_in_submissions (
  id                SERIAL PRIMARY KEY,
  institution_name  VARCHAR(255) NOT NULL,
  institution_type  VARCHAR(50) NOT NULL,
  contact_name      VARCHAR(255) NOT NULL,
  email             VARCHAR(255) NOT NULL,
  phone             VARCHAR(100),
  website           TEXT,
  services          TEXT,
  message           TEXT,
  consent           BOOLEAN DEFAULT false,
  status            VARCHAR(50) DEFAULT 'pending',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
