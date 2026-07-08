/**
 * Public form submission routes — property inquiry and clergy registration.
 * Stores submissions to the `cases` table (property) and `clergy_partners`
 * table (clergy). No authentication required.
 */
const express = require('express');
const router  = express.Router();
const { createCase } = require('../db/cases');
const { createClergyPartner } = require('../db/clergy-partners');
const optIn = require('../db/opt-in');

// GET — render form pages (EJS handles layout)
router.get('/property-form', (_req, res) => res.render('property-form'));
router.get('/clergy-form',    (_req, res) => res.render('clergy-form'));
router.get('/opt-in',         (_req, res) => res.render('opt-in'));
router.get('/privacy',        (_req, res) => res.render('privacy'));
router.get('/terms',          (_req, res) => res.render('terms'));

// POST — property form
router.post('/property-form', async (req, res) => {
  try {
    const {
      company_name, contact_person, role, email, phone,
      prefecture, municipality, property_type, relationship_to_property,
      current_status, concern_category, desired_service,
      timeline, notes, permission_to_contact, consent
    } = req.body;

    if (!consent) {
      return res.status(400).json({ error: 'プライバシーポリシーの同意が必要です。' });
    }

    const caseId = await createCase({
      company_name,
      contact_person,
      role:           role || null,
      email,
      phone:          phone || null,
      prefecture,
      municipality:   municipality || null,
      property_type,
      relationship_to_property: relationship_to_property || null,
      current_status: current_status || null,
      concern_category,
      desired_service,
      timeline:       timeline || null,
      notes:          notes || null,
    });

    console.log(`[forms] Property submission saved — case_id=${caseId}`);
    return res.status(200).json({ success: true, caseId });
  } catch (err) {
    console.error('[forms] Property submission error:', err);
    return res.status(500).json({ error: 'サーバーエラーが発生しました。もう一度お試しください。' });
  }
});

// POST — clergy registration
router.post('/clergy-form', async (req, res) => {
  try {
    const {
      temple_shrine_org_name, religious_tradition, denomination,
      contact_person, role, email, phone,
      prefecture, municipality, service_area,
      services_offered, accepts_real_estate_cases, notes, consent
    } = req.body;

    if (!consent) {
      return res.status(400).json({ error: 'プライバシーポリシーの同意が必要です。' });
    }

    const partnerId = await createClergyPartner({
      temple_shrine_org_name,
      religious_tradition,
      denomination:     denomination || null,
      contact_person,
      role:             role || null,
      email,
      phone:            phone || null,
      prefecture,
      municipality:     municipality || null,
      service_area:     service_area || null,
      services_offered: services_offered || null,
      accepts_real_estate_cases: accepts_real_estate_cases === 'yes' || accepts_real_estate_cases === true,
      registration_status: 'pending',
      notes:            notes || null,
    });

    console.log(`[forms] Clergy registration saved — partner_id=${partnerId}`);
    return res.status(200).json({ success: true, partnerId });
  } catch (err) {
    console.error('[forms] Clergy registration error:', err);
    return res.status(500).json({ error: 'サーバーエラーが発生しました。もう一度お試しください。' });
  }
});

// POST — opt-in form (from physical outreach QR code)
router.post('/opt-in', async (req, res) => {
  try {
    const {
      institution_name, institution_type, contact_name,
      email, phone, website, services, message, consent
    } = req.body;

    if (!consent) {
      return res.status(400).json({ error: '同意が必要です。' });
    }

    if (!institution_name || !institution_type || !contact_name || !email) {
      return res.status(400).json({ error: '必須項目を入力してください。' });
    }

    const submission = await optIn.create({
      institution_name,
      institution_type,
      contact_name,
      email,
      phone:    phone || null,
      website:  website || null,
      services: services || null,
      message:  message || null,
      consent:  true,
    });

    console.log(`[forms] Opt-in submission saved — id=${submission.id}, institution=${institution_name}`);
    return res.status(200).json({ success: true, id: submission.id });
  } catch (err) {
    console.error('[forms] Opt-in submission error:', err);
    return res.status(500).json({ error: 'サーバーエラーが発生しました。もう一度お試しください。' });
  }
});

module.exports = router;