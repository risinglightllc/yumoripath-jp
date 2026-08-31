-- migrations/003_property_lookup.sql
CREATE TABLE IF NOT EXISTS properties (
  id               SERIAL PRIMARY KEY,
  address          TEXT        NOT NULL,
  prefecture       VARCHAR(20),
  city             VARCHAR(60),
  latitude         NUMERIC(10, 7),
  longitude        NUMERIC(10, 7),
  incident_type    VARCHAR(30)  NOT NULL,
  incident_type_en VARCHAR(60),
  incident_date    DATE,
  severity         SMALLINT DEFAULT 1,
  description_ja   TEXT,
  description_en   TEXT,
  source           TEXT,
  verified         BOOLEAN     NOT NULL DEFAULT false,
  verified_at      TIMESTAMPTZ,
  verified_by      VARCHAR(100),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_properties_address    ON properties (address);
CREATE INDEX IF NOT EXISTS idx_properties_prefecture ON properties (prefecture);
CREATE INDEX IF NOT EXISTS idx_properties_verified   ON properties (verified);
CREATE INDEX IF NOT EXISTS idx_properties_incident_date ON properties (incident_date DESC);

CREATE TABLE IF NOT EXISTS property_reports (
  id             SERIAL PRIMARY KEY,
  address        TEXT        NOT NULL,
  incident_type  VARCHAR(30),
  incident_date  DATE,
  source         TEXT,
  submitted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status         VARCHAR(20)  NOT NULL DEFAULT 'pending',
  reviewed_at    TIMESTAMPTZ,
  reviewed_by    VARCHAR(100),
  notes          TEXT
);
CREATE INDEX IF NOT EXISTS idx_reports_status    ON property_reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_submitted ON property_reports (submitted_at DESC);