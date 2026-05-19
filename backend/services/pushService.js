const webpush = require('web-push');
const supabase = require('../config/database');

// Configure web-push
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Send notification to a specific admin
const notifyAdmin = async (adminId, title, body) => {
  try {
    // Get admin's push subscription
    const { data: admin, error } = await supabase
      .from('users')
      .select('push_subscription')
      .eq('id', adminId)
      .single();
    
    if (error || !admin?.push_subscription) {
      console.log(`No push subscription for admin ${adminId}`);
      return false;
    }
    
    await webpush.sendNotification(
      admin.push_subscription,
      JSON.stringify({ title, body })
    );
    
    console.log(`✅ Push sent to admin ${adminId}: ${title}`);
    return true;
    
  } catch (error) {
    console.error('Push failed:', error.message);
    
    // If subscription expired, clear it
    if (error.statusCode === 410) {
      await supabase
        .from('users')
        .update({ push_subscription: null })
        .eq('id', adminId);
      console.log(`⚠️ Subscription expired for admin ${adminId}, cleared`);
    }
    return false;
  }
};

// Send notification to all admins
const notifyAllAdmins = async (title, body) => {
  const { data: admins, error } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .eq('is_active', true)
    .not('push_subscription', 'is', null);
  
  if (error) {
    console.error('Error fetching admins:', error);
    return;
  }
  
  for (const admin of admins || []) {
    await notifyAdmin(admin.id, title, body);
  }
};

module.exports = { notifyAdmin, notifyAllAdmins };