/**
 * Matching service for cases → clergy partners.
 * Core logic: geolocation + service type + real-estate acceptance.
 * Does NOT make any HTTP calls or send emails.
 */
const clergyDB = require('../db/clergy-partners');

/**
 * Build match suggestions for a case.
 * @param {Object} caseData - case row
 * @returns {Array} match objects with reason, confidence, cautions, next_action
 */
exports.matchCase = async (caseData) => {
  const { prefecture, municipality, desired_service } = caseData;
  const matches = [];

  // Priority 1: same municipality + relevant service + active + accepts_real_estate
  const sameMunicipality = await clergyDB.list({
    prefecture,
    registration_status: 'active',
    accepts_real_estate_cases: true,
    limit: 5
  });
  const serviceFiltered = sameMunicipality.filter(c =>
    c.services_offered && c.services_offered.toLowerCase().includes((desired_service || '').toLowerCase())
  );

  if (serviceFiltered.length > 0) {
    matches.push({
      tier: 1,
      reason: `Same municipality (${municipality}) + relevant service`,
      confidence: 90,
      cautions: null,
      next_action: 'Contact directly — request ceremony confirmation',
      partners: serviceFiltered
    });
  }

  // Priority 2: same prefecture, active, relevant service
  const samePrefecture = await clergyDB.list({
    prefecture,
    registration_status: 'active',
    limit: 5
  });
  const prefectureFiltered = samePrefecture.filter(c =>
    c.id !== caseData.matched_clergy_partner_id &&
    c.services_offered && c.services_offered.toLowerCase().includes((desired_service || '').toLowerCase())
  );

  if (prefectureFiltered.length > 0) {
    matches.push({
      tier: 2,
      reason: `Same prefecture (${prefecture}) + relevant service`,
      confidence: 70,
      cautions: 'Travel time / availability may vary',
      next_action: 'Email inquiry with ceremony details',
      partners: prefectureFiltered
    });
  }

  // Priority 3: neighboring prefecture fallback (broad match)
  if (matches.length === 0) {
    matches.push({
      tier: 3,
      reason: 'No exact match — expand search to nationwide clergy network',
      confidence: 40,
      cautions: 'Cross-prefecture ceremonies may require additional coordination',
      next_action: 'Post in partner network Slack / contact regional coordinator',
      partners: []
    });
  }

  return matches;
};

const NEIGHBORS = {
  '東京都': ['神奈川県','埼玉県','千葉県'],
  '神奈川県': ['東京都','山梨県'],
  '大阪府': ['京都府','兵庫県','奈良県'],
  '京都府': ['大阪府','滋賀県','兵庫県'],
  '北海道': [],
  ' Okinawa': []
};

exports.getNeighboringPrefectures = (prefecture) => NEIGHBORS[prefecture] || [];