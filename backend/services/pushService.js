// backend/services/pushService.js
const webpush = require('web-push');
const supabase = require('../config/database');

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Helper to detect platform
const getPlatform = (userAgent) => {
  if (!userAgent) return 'unknown';
  if (userAgent.includes('Android')) return 'android';
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'ios';
  if (userAgent.includes('Windows')) return 'windows';
  if (userAgent.includes('Mac')) return 'mac';
  return 'unknown';
};

// Save subscription for a user (supports multiple devices)
const saveSubscription = async (userId, subscription, req) => {
  
  const userAgent = req.headers['user-agent'] || 'unknown';
  const deviceInfo = {
    platform: getPlatform(userAgent),
    userAgent: userAgent,
    ip: req.ip || 'unknown',
    subscribedAt: new Date().toISOString()
  };
  
  try {
    // Check if subscription already exists for this endpoint
    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('subscription->>endpoint', subscription.endpoint)
      .maybeSingle();
    
    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('push_subscriptions')
        .update({
          subscription: subscription,
          device_info: deviceInfo,
          user_agent: userAgent,
          updated_at: new Date(),
          last_used: new Date()
        })
        .eq('id', existing.id);
      
      if (error) {
        console.error('Update error:', error.message);
        return false;
      }
      return true;
    } else {
      // Insert new
      const { error } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id: userId,
          subscription: subscription,
          device_info: deviceInfo,
          user_agent: userAgent,
          created_at: new Date(),
          updated_at: new Date(),
          last_used: new Date()
        });
      
      if (error) {
        console.error('Insert error:', error.message);
        return false;
      }
      return true;
    }
  } catch (error) {
    console.error('Save subscription error:', error.message);
    return false;
  }
};

// Send notification to ALL devices of a user
const notifyUser = async (userId, title, body, data = {}) => {
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('subscription, device_info')
    .eq('user_id', userId);
  
  if (error || !subscriptions?.length) {
    console.log(`No subscriptions for user ${userId}`);
    return false;
  }
  
  let successCount = 0;
  
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        sub.subscription,
        JSON.stringify({ title, body, ...data }),
        { TTL: 86400 } // 24 hours TTL
      );
      successCount++;
      
      // Update last_used
      await supabase
        .from('push_subscriptions')
        .update({ last_used: new Date() })
        .eq('subscription->>endpoint', sub.subscription.endpoint);
        
    } catch (error) {
      console.error('Push failed:', error.message);
      
      // Remove invalid subscription (410 = Gone)
      if (error.statusCode === 410) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('subscription->>endpoint', sub.subscription.endpoint);
        console.log('Removed expired subscription');
      }
    }
  }
  
  return successCount > 0;
};

// Send to all admins
const notifyAllAdmins = async (title, body, data = {}) => {
  const { data: admins, error } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .eq('is_active', true);
  
  if (error) {
    console.error('Error fetching admins:', error);
    return;
  }
  
  console.log(`Sending notification to ${admins?.length || 0} admins`);
  
  for (const admin of admins || []) {
    await notifyUser(admin.id, title, body, data);
  }
};

// Get all devices for a user
const getUserDevices = async (userId) => {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('id, device_info, user_agent, last_used, created_at')
    .eq('user_id', userId)
    .order('last_used', { ascending: false });
  
  if (error) return [];
  return data || [];
};

// Remove a specific device
const removeDevice = async (userId, deviceId) => {
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('id', deviceId)
    .eq('user_id', userId);
  
  return !error;
};

module.exports = { 
  saveSubscription, 
  notifyUser, 
  notifyAllAdmins,
  getUserDevices,
  removeDevice
};