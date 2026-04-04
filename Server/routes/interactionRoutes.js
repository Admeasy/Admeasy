const express = require('express');
const router = express.Router();
const { authenticateRequired } = require('../middleware/combinedAuth');
const { trackStudentEvent } = require('../services/interactionTrackingService');

router.post('/events', authenticateRequired, async (req, res) => {
  try {
    const actorId = req.user?._id;
    if (!actorId) {
      return res.status(403).json({ success: false, message: 'Only students are allowed' });
    }
    const { eventType, entityId = null, metadata = {}, dedupeWindowSeconds = 15 } = req.body || {};
    if (!eventType) {
      return res.status(400).json({ success: false, message: 'eventType is required' });
    }
    await trackStudentEvent({
      userId: actorId,
      eventType,
      entityId,
      metadata,
      dedupeWindowSeconds,
    });
    return res.json({ success: true, message: 'Event tracked' });
  } catch (error) {
    console.error('Error tracking generic event:', error);
    return res.status(500).json({ success: false, message: 'Failed to track event' });
  }
});

module.exports = router;
