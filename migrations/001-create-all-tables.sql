-- Create all Yumori Path tables

-- Cases
CREATE TABLE IF NOT EXISTS cases (
  case_id          SERIAL PRIMARY KEY,
  property_address TEXT,
  prefecture       VARCHAR(100),
  municipality     VARCHAR(100),
  property_type    VARCHAR(100),
  incident_type    VARCHAR(100),
  incident_date    DATE,
  owner_name       VARCHAR(255),
  owner_email      VARCHAR(255),
  owner_phone      VARCHAR(100),
  status           VARCHAR(100) DEFAULT 'New submission',
  notes            TEXT,
  submission_date  TIMESTAMPTZ DEFAULT NOW(),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Real estate leads
CREATE TABLE IF NOT EXISTS real_estate_leads (
  id                SERIAL PRIMARY KEY,
  company_name      VARCHAR(255),
  contact_name      VARCHAR(255),
  email             VARCHAR(255),
  phone             VARCHAR(100),
  prefecture        VARCHAR(100),
  municipality      VARCHAR(100),
  website           TEXT,
  jiko_relevance    VARCHAR(50) DEFAULT 'medium',
  outreach_status   VARCHAR(50) DEFAULT 'not contacted',
  confidence_score  INTEGER DEFAULT 50,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Clergy partners
CREATE TABLE IF NOT EXISTS clergy_partners (
  id                        SERIAL PRIMARY KEY,
  temple_name               VARCHAR(255),
  denomination              VARCHAR(255),
  contact_name              VARCHAR(255),
  email                     VARCHAR(255),
  phone                     VARCHAR(100),
  prefecture                VARCHAR(100),
  municipality              VARCHAR(100),
  services_offered          TEXT,
  registration_status       VARCHAR(50) DEFAULT 'pending',
  accepts_real_estate_cases BOOLEAN DEFAULT false,
  confidence_score          INTEGER DEFAULT 50,
  notes                     TEXT,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

-- Restoration vendors
CREATE TABLE IF NOT EXISTS restoration_vendors (
  id               SERIAL PRIMARY KEY,
  company_name     VARCHAR(255),
  contact_name     VARCHAR(255),
  email            VARCHAR(255),
  phone            VARCHAR(100),
  prefecture       VARCHAR(100),
  municipality     VARCHAR(100),
  services_offered TEXT,
  status           VARCHAR(50) DEFAULT 'active',
  confidence_score INTEGER DEFAULT 50,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id           SERIAL PRIMARY KEY,
  title        VARCHAR(500) NOT NULL,
  description  TEXT,
  status       VARCHAR(50) DEFAULT 'open',
  priority     VARCHAR(50) DEFAULT 'medium',
  assigned_to  VARCHAR(255),
  case_id      INTEGER REFERENCES cases(case_id),
  due_date     DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id              SERIAL PRIMARY KEY,
  case_id         INTEGER REFERENCES cases(case_id),
  description     TEXT,
  quoted_amount   NUMERIC(12,2),
  paid_amount     NUMERIC(12,2),
  payment_status  VARCHAR(50) DEFAULT 'quoted',
  payment_date    DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Outreach log
CREATE TABLE IF NOT EXISTS outreach_log (
  id                    SERIAL PRIMARY KEY,
  recipient_type        VARCHAR(50),
  recipient_name        VARCHAR(255),
  recipient_email       VARCHAR(255),
  subject               TEXT,
  message_body          TEXT,
  date_sent             TIMESTAMPTZ DEFAULT NOW(),
  response_status       VARCHAR(50) DEFAULT 'no response',
  next_follow_up_date   DATE,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio pillars
CREATE TABLE IF NOT EXISTS portfolio_pillars (
  id          SERIAL PRIMARY KEY,
  key         VARCHAR(100) UNIQUE NOT NULL,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  sort_order  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio entries
CREATE TABLE IF NOT EXISTS portfolio_entries (
  id          SERIAL PRIMARY KEY,
  pillar_key  VARCHAR(100) REFERENCES portfolio_pillars(key),
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  value       TEXT,
  notes       TEXT,
  sort_order  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
