const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const supabase = require('../config/database');

// Check if admin is already subscribed
router.get('/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { data: admin, error } = await supabase
      .from('users')
      .select('push_subscription')
      .eq('id', req.user.id)
      .single();
    
    if (error) throw error;
    
    res.json({ 
      success: true, 
      isSubscribed: !!admin?.push_subscription 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Save push subscription
router.post('/subscribe', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { subscription } = req.body;
    
    const { error } = await supabase
      .from('users')
      .update({ 
        push_subscription: subscription,
        push_subscription_updated_at: new Date()
      })
      .eq('id', req.user.id);
    
    if (error) throw error;
    
    console.log(`✅ Admin ${req.user.username} subscribed to push notifications`);
    res.json({ success: true, message: 'Subscribed to notifications' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post('/test-push', authenticate, authorize('admin'), async (req, res) => {
  const webpush = require('web-push');
  const supabase = require('../config/database');
  
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  
  const { data: admin } = await supabase
    .from('users')
    .select('push_subscription')
    .eq('id', req.user.id)
    .single();
  
  if (!admin?.push_subscription) {
    return res.json({ success: false, message: 'No subscription' });
  }
  
  try {
    await webpush.sendNotification(
      admin.push_subscription,
      JSON.stringify({ title: '🧪 Test from Backend', body: 'If you see this, push works!' })
    );
    res.json({ success: true, message: 'Push sent!' });
  } catch (error) {
    console.error('Push error:', error);
    res.json({ success: false, message: error.message });
  }
});
module.exports = router;