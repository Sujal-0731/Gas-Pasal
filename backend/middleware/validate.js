// backend/middleware/validate.js
const { CYLINDER_TYPES } = require('../config/constants');
const { parseRupees, isValidPaymentMode, PAYMENT_MODES } = require('../utils/paymentLogic');

const validateCustomerInput = (req, res, next) => {
  const { name, phone } = req.body;
  
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ success: false, message: 'कृपया ग्राहकको पुरा नाम लेख्नुहोस्' });
  }
  
  if (name.trim().length > 100) {
    return res.status(400).json({ success: false, message: 'नाम १०० अक्षरभन्दा बढी हुन सक्दैन' });
  }
  
  if (phone && phone.trim() !== '') {
    const phoneRegex = /^[9][6-9][0-9]{8}$/;
    if (!phoneRegex.test(phone.trim())) {
      return res.status(400).json({ success: false, message: 'फोन नम्बर गलत छ (९८xxxxxxxx वा ९७xxxxxxxx)' });
    }
  }
  
  req.body.name = name.trim();
  req.body.phone = phone ? phone.trim() : null;
  next();
};

const validateTransactionInput = (req, res, next) => {
  const { customerName, emptyCylinder, filledCylinder, remarks, totalAmount, paidAmount, paymentMode, paymentNote } = req.body;
  
  if (!customerName || customerName.trim().length < 2) {
    return res.status(400).json({ success: false, message: 'ग्राहकको नाम आवश्यक छ' });
  }
  
  if (emptyCylinder && !CYLINDER_TYPES.includes(emptyCylinder)) {
    return res.status(400).json({ success: false, message: 'खाली सिलिन्डरको प्रकार गलत छ' });
  }
  
  if (filledCylinder && !CYLINDER_TYPES.includes(filledCylinder)) {
    return res.status(400).json({ success: false, message: 'भरिएको सिलिन्डरको प्रकार गलत छ' });
  }
  
  // Validate that at least one cylinder is selected
  if ((!emptyCylinder || emptyCylinder === 'कोही छैन') && 
      (!filledCylinder || filledCylinder === 'कोही छैन')) {
    return res.status(400).json({ 
      success: false, 
      message: 'कृपया कम्तीमा एउटा सिलिन्डर चयन गर्नुहोस्' 
    });
  }  // Validate remarks length
  if (remarks && remarks.length > 500) {
    return res.status(400).json({ success: false, message: 'कैफियत ५०० अक्षरभन्दा बढी हुन सक्दैन' });
  }

  // Phase 6: payment fields (whole rupees). Total is required for every new
  // transaction; an absent paid amount is recorded as an explicit 0 (credit).
  const totalParsed = parseRupees(totalAmount);
  if (!totalParsed.ok) {
    return res.status(400).json({ success: false, message: `कुल रकम: ${totalParsed.message}` });
  }

  const paidParsed = (paidAmount === null || paidAmount === undefined || paidAmount === '')
    ? { ok: true, amount: 0 }
    : parseRupees(paidAmount);
  if (!paidParsed.ok) {
    return res.status(400).json({ success: false, message: `तिरेको रकम: ${paidParsed.message}` });
  }

  if (paidParsed.amount > totalParsed.amount) {
    return res.status(400).json({ success: false, message: 'तिरेको रकम कुल रकमभन्दा बढी हुन सक्दैन' });
  }

  if (paidParsed.amount > 0 && !isValidPaymentMode(paymentMode)) {
    return res.status(400).json({ success: false, message: 'भुक्तानी मोड (नगद/अनलाइन) छान्नुहोस्' });
  }
  if (paidParsed.amount === 0 && paymentMode !== undefined && paymentMode !== null
      && paymentMode !== '' && !isValidPaymentMode(paymentMode)) {
    return res.status(400).json({ success: false, message: 'भुक्तानी मोड गलत छ' });
  }

  if (paymentNote && paymentNote.length > 200) {
    return res.status(400).json({ success: false, message: 'भुक्तानी नोट २०० अक्षरभन्दा बढी हुन सक्दैन' });
  }

  req.body.customerName = customerName.trim();
  req.body.totalAmount = totalParsed.amount;
  req.body.paidAmount = paidParsed.amount;
  req.body.paymentMode = paymentMode || null;
  req.body.paymentNote = paymentNote ? paymentNote.trim() : null;
  next();
};

// Phase 6: POST /api/transactions/:id/payments (later installment)
const validatePaymentInput = (req, res, next) => {
  const { amount, mode, note } = req.body;

  const parsed = parseRupees(amount);
  if (!parsed.ok) {
    return res.status(400).json({ success: false, message: `भुक्तानी रकम: ${parsed.message}` });
  }
  if (parsed.amount <= 0) {
    return res.status(400).json({ success: false, message: 'भुक्तानी रकम शून्यभन्दा बढी हुनुपर्छ' });
  }
  if (!isValidPaymentMode(mode)) {
    return res.status(400).json({ success: false, message: 'भुक्तानी मोड (नगद/अनलाइन) छान्नुहोस्' });
  }
  if (note !== undefined && note !== null && String(note).length > 200) {
    return res.status(400).json({ success: false, message: 'भुक्तानी नोट २०० अक्षरभन्दा बढी हुन सक्दैन' });
  }

  req.body.amount = parsed.amount;
  req.body.mode = mode;
  req.body.note = note ? String(note).trim() : null;
  next();
};

// Phase 6: guard the transaction id path parameter (uuid)
const validateTransactionIdParam = (req, res, next) => {
  const { id } = req.params;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!id || !uuidRegex.test(id)) {
    return res.status(400).json({ success: false, message: 'लेनदेन आईडी गलत छ' });
  }
  next();
};

const validateRefillInput = (req, res, next) => {
  const { refillDate, mode } = req.body;
  
  if (!refillDate || !/^\d{4}-\d{2}-\d{2}$/.test(refillDate)) {
    return res.status(400).json({ success: false, message: 'मिति गलत छ (YYYY-MM-DD format)' });
  }
  
  // Check if date is not in future
  const refillDateObj = new Date(refillDate);
  const today = new Date();
  if (refillDateObj > today) {
    return res.status(400).json({ success: false, message: 'भविष्यको मिति राख्न सकिँदैन' });
  }
  
  if (mode && !['normal', 'exchange'].includes(mode)) {
    return res.status(400).json({ success: false, message: 'मोड गलत छ' });
  }
  
  next();
};

const validateQueueInput = (req, res, next) => {
  const { customerId, customerName, emptyCylinder, notes } = req.body;
  
  // Validate customer ID format (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!customerId || !uuidRegex.test(customerId)) {
    return res.status(400).json({ success: false, message: 'ग्राहक आईडी गलत छ' });
  }
  
  // Validate customer name
  if (!customerName || customerName.trim().length < 2) {
    return res.status(400).json({ success: false, message: 'ग्राहकको नाम आवश्यक छ' });
  }
  
  if (customerName.trim().length > 100) {
    return res.status(400).json({ success: false, message: 'नाम १०० अक्षरभन्दा बढी हुन सक्दैन' });
  }
  
  // Validate empty cylinder type
  if (!emptyCylinder) {
    return res.status(400).json({ success: false, message: 'खाली सिलिन्डरको प्रकार चयन गर्नुहोस्' });
  }
  
  if (!CYLINDER_TYPES.includes(emptyCylinder)) {
    return res.status(400).json({ success: false, message: 'खाली सिलिन्डरको प्रकार गलत छ' });
  }
  
  // Validate notes length
  if (notes && notes.length > 200) {
    return res.status(400).json({ success: false, message: 'नोट २०० अक्षरभन्दा बढी हुन सक्दैन' });
  }
  
  // Sanitize inputs
  req.body.customerName = customerName.trim();
  req.body.notes = notes ? notes.trim() : null;
  
  next();
};

const validateQueueDelete = (req, res, next) => {
  const { id } = req.params;
  
  // Validate queue ID format (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!id || !uuidRegex.test(id)) {
    return res.status(400).json({ success: false, message: 'क्यू आईडी गलत छ' });
  }
  
  next();
};

const validateDashboardRequest = (req, res, next) => {
  // Dashboard just needs authentication
  // No additional validation needed
  next();
};
// Phase 6.1: PUT /api/settings — default gas price must be a positive whole
// number of rupees (same money convention as payments: integers only).
const validateSettingsInput = (req, res, next) => {
  const parsed = parseRupees(req.body.defaultPrice);
  if (!parsed.ok) {
    return res.status(400).json({ success: false, message: `डिफल्ट मूल्य: ${parsed.message}` });
  }
  if (parsed.amount <= 0) {
    return res.status(400).json({ success: false, message: 'डिफल्ट मूल्य शून्यभन्दा बढी हुनुपर्छ' });
  }
  req.body.defaultPrice = parsed.amount;
  next();
};

// Phase 6.1: guard the customer id path parameter (uuid) used by
// DELETE /api/admin/customers/:id
const validateUuidParam = (paramName) => (req, res, next) => {
  const value = req.params[paramName];
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!value || !uuidRegex.test(value)) {
    return res.status(400).json({ success: false, message: 'आईडी गलत छ' });
  }
  next();
};

const validateCustomerName = (req, res, next) => {
  const { name } = req.params;
  if (!name || name.trim().length < 2 || name.length > 100) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid customer name' 
    });
  }
  next();
};
module.exports = { 
  validateCustomerInput, 
  validateTransactionInput,
  validatePaymentInput,
  validateTransactionIdParam,
  validateRefillInput,
  validateQueueInput,
  validateQueueDelete,
  validateDashboardRequest,
  validateCustomerName,
  validateSettingsInput,
  validateUuidParam
};