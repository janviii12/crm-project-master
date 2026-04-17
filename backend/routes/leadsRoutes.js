import express from 'express';
import Lead from '../models/Lead.js';

const router = express.Router();

// GET /api/leads - Meta Ads webhook verification
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    console.log('✅ Meta Ads webhook verified');
    return res.status(200).send(challenge);
  } else {
    console.log('❌ Meta Ads verification failed');
    return res.sendStatus(403);
  }
});

// POST /api/leads - Receive and save Meta Ads lead data
router.post('/', async (req, res) => {
  try {
    // Meta Ads webhook payload structure
    const entry = req.body.entry?.[0];
    if (!entry) {
      return res.status(400).json({ error: 'No entry in webhook payload' });
    }

    const change = entry.changes?.[0];
    if (!change || change.field !== 'leadgen') {
      return res.status(400).json({ error: 'Invalid change data' });
    }

    const leadData = change.value;
    if (!leadData.name || !leadData.email || !leadData.phone) {
      return res.status(400).json({ error: 'Missing required lead fields' });
    }

    // Create new lead
    const newLead = new Lead({
      name: leadData.name,
      email: leadData.email,
      phone: leadData.phone,
      // source auto-defaults to 'meta_ads'
    });

    await newLead.save();

    console.log(`✅ New Meta Ads lead saved: ${newLead.name} (${newLead.email})`);

    res.status(200).json({ success: true, leadId: newLead._id });
  } catch (error) {
    console.error('❌ Error saving Meta lead:', error);
    res.status(500).json({ error: 'Failed to save lead' });
  }
});

// GET /api/leads/all - Fetch all leads for display
router.get('/all', async (req, res) => {
  try {
    const leads = await Lead.find({}).sort({ createdAt: -1 }).lean();
    res.json({ success: true, leads });
  } catch (error) {
    console.error('❌ Error fetching leads:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch leads' });
  }
});

export default router;

