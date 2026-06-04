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

// Helper to translate cylinder for notification
const translateCylinderForNotif = (cylinderName) => {
  const translations = {
    'लोकप्रिय': 'Lokpriya',
    'सुगम': 'Sugam',
    'एभरेस्ट': 'Everest',
    'अन्य / Other': 'Other',
    'कोही छैन': 'None'
  };
  return translations[cylinderName] || cylinderName;
};

// Helper to get formatted date and time
const getFormattedDateTime = () => {
  const now = new Date();
  return now.toLocaleString(); // "6/4/2026, 11:45:30 AM"
};

// Send notification to a specific user
const notifyUser = async (userId, title, body, data = {}) => {
  console.log(`🔍 Looking for subscriptions for user: ${userId}`);
  
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('subscription, device_info')
    .eq('user_id', userId);
  
  if (error) {
    console.error(`Error fetching subscriptions for ${userId}:`, error);
    return false;
  }
  
  if (!subscriptions?.length) {
    console.log(`❌ No subscriptions for user ${userId}`);
    return false;
  }
  
  console.log(`📱 Found ${subscriptions.length} subscription(s) for user ${userId}`);
  
  let successCount = 0;
  
  for (const sub of subscriptions) {
    console.log(`📤 Sending push to: ${sub.device_info?.platform || 'unknown device'}`);
    try {
      await webpush.sendNotification(
        sub.subscription,
        JSON.stringify({ title, body, ...data }),
        { TTL: 86400 }
      );
      successCount++;
      console.log(`✅ Push sent successfully`);
      
      await supabase
        .from('push_subscriptions')
        .update({ last_used: new Date() })
        .eq('subscription->>endpoint', sub.subscription.endpoint);
        
    } catch (error) {
      console.error(`❌ Push failed:`, error.message);
      
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

// Save subscription for a user
const saveSubscription = async (userId, subscription, req) => {
  const userAgent = req.headers['user-agent'] || 'unknown';
  const deviceInfo = {
    platform: getPlatform(userAgent),
    userAgent: userAgent,
    ip: req.ip || 'unknown',
    subscribedAt: new Date().toISOString()
  };
  
  try {
    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('subscription->>endpoint', subscription.endpoint)
      .maybeSingle();
    
    if (existing) {
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
      console.log(`✅ Updated subscription for user ${userId}`);
      return true;
    } else {
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
      console.log(`✅ New subscription saved for user ${userId}`);
      return true;
    }
  } catch (error) {
    console.error('Save subscription error:', error.message);
    return false;
  }
};

// Send notification to ALL users EXCEPT the performer
const notifyOtherUsers = async (performerRole, performerId, title, body, data = {}) => {
  console.log(`🔵 notifyOtherUsers called: performerRole=${performerRole}, performerId=${performerId}`);
  
  // Get ALL active users
  const { data: allUsers, error } = await supabase
    .from('users')
    .select('id, username, role')
    .eq('is_active', true);
  
  if (error) {
    console.error(`Error finding users:`, error);
    return;
  }
  
  if (!allUsers || allUsers.length === 0) {
    console.log(`❌ No users found in database`);
    return;
  }
  
  console.log(`📋 Found ${allUsers.length} active user(s):`);
  allUsers.forEach(u => {
    console.log(`   - ${u.username} (${u.role}) - ${u.id}`);
  });
  
  // Filter out the performer
  const usersToNotify = allUsers.filter(u => u.id !== performerId);
  
  console.log(`📤 Will notify ${usersToNotify.length} user(s) (excluding performer)`);
  
  // Send notification to EACH user except the performer
  let successCount = 0;
  
  for (const user of usersToNotify) {
    console.log(`📤 Sending to ${user.username} (${user.role})`);
    const sent = await notifyUser(user.id, title, body, data);
    if (sent) successCount++;
  }
  
  console.log(`✅ Sent to ${successCount} of ${usersToNotify.length} users`);
};

// Send customer notification
const notifyNewCustomer = async (performerRole, performerId, customerName, customerPhone, customerId) => {
  const title = 'Anam Store: Customer Added';
  const dateTime = getFormattedDateTime();
  const body = `${customerName} was added as a new customer\n📅 ${dateTime}\n👤 ${performerRole === 'admin' ? 'Admin' : 'Operator'}`;
  
  console.log(`🔔 New Customer Notification: ${customerName} by ${performerRole}`);
  
  await notifyOtherUsers(performerRole, performerId, title, body, {
    type: 'customer',
    url: `/customers/${customerId}`,
    customerName,
    customerPhone,
    performerRole,
    timestamp: new Date().toISOString()
  });
};

// Send transaction notification
const notifyNewTransaction = async (performerRole, performerId, customerName, emptyCylinder, filledCylinder) => {
  const title = 'Anam Store: New Transaction';
  const dateTime = getFormattedDateTime();
  let body = `Customer: ${customerName}\n📅 ${dateTime}\n👤 ${performerRole === 'admin' ? 'Admin' : 'Operator'}`;
  
  if (emptyCylinder && emptyCylinder !== 'कोही छैन') {
    body += `\n📥 Empty: ${translateCylinderForNotif(emptyCylinder)}`;
  }
  if (filledCylinder && filledCylinder !== 'कोही छैन') {
    body += `\n📤 Filled: ${translateCylinderForNotif(filledCylinder)}`;
  }
  
  console.log(`🔔 New Transaction Notification: ${customerName} by ${performerRole}`);
  
  await notifyOtherUsers(performerRole, performerId, title, body, {
    type: 'transaction',
    url: '/transactions',
    customerName,
    emptyCylinder: translateCylinderForNotif(emptyCylinder),
    filledCylinder: translateCylinderForNotif(filledCylinder),
    performerRole,
    timestamp: new Date().toISOString()
  });
};

// Send queue notification
const notifyQueueUpdate = async (performerRole, performerId, customerName, emptyCylinder, queueId) => {
  const title = 'Anam Store: Queue Updated';
  const dateTime = getFormattedDateTime();
  const body = `${customerName} added to queue\n📅 ${dateTime}\n🛢️ Empty: ${translateCylinderForNotif(emptyCylinder)}\n👤 ${performerRole === 'admin' ? 'Admin' : 'Operator'}`;
  
  console.log(`🔔 Queue Update Notification: ${customerName} by ${performerRole}`);
  
  await notifyOtherUsers(performerRole, performerId, title, body, {
    type: 'queue',
    url: '/queue',
    customerName,
    emptyCylinder: translateCylinderForNotif(emptyCylinder),
    performerRole,
    timestamp: new Date().toISOString()
  });
};

// Send refill notification
const notifyRefillCompleted = async (performerRole, performerId, refillDate) => {
  const title = 'Anam Store: Refill Completed';
  const dateTime = getFormattedDateTime();
  const body = `Refill completed for ${refillDate}\n📅 ${dateTime}\n👤 ${performerRole === 'admin' ? 'Admin' : 'Operator'}`;
  
  console.log(`🔔 Refill Completed Notification by ${performerRole}`);
  
  await notifyOtherUsers(performerRole, performerId, title, body, {
    type: 'refill',
    url: '/refillhistory',
    refillDate,
    performerRole,
    timestamp: new Date().toISOString()
  });
};

module.exports = { 
  saveSubscription, 
  notifyUser,
  notifyNewCustomer,
  notifyNewTransaction,
  notifyQueueUpdate,
  notifyRefillCompleted
};