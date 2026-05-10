// frontend/src/utils/cylinderTranslator.js

// Mapping of Nepali cylinder names to their translations
const cylinderTranslations = {
  'लोकप्रिय': { np: 'लोकप्रिय', en: 'Lokpriya' },
  'सुगम': { np: 'सुगम', en: 'Sugam' },
  'एभरेस्ट': { np: 'एभरेस्ट', en: 'Everest' },
  'अन्य / Other': { np: 'अन्य', en: 'Other' },
  'कोही छैन': { np: 'कोही छैन', en: 'None' }
};

/**
 * Translate a cylinder name to the current language
 * @param {string} cylinderName - The Nepali cylinder name from database
 * @param {string} language - Current language ('np' or 'en')
 * @returns {string} - Translated cylinder name
 */
export const translateCylinder = (cylinderName, language) => {
  if (!cylinderName) return '';
  
  // Check if we have a translation for this cylinder
  const translation = cylinderTranslations[cylinderName];
  if (translation) {
    return translation[language] || cylinderName;
  }
  
  // Return original if no translation found
  return cylinderName;
};

/**
 * Get all cylinder options for dropdowns
 * @param {string} language - Current language
 * @returns {Array} - Array of {value: nepaliName, label: translatedName}
 */
export const getCylinderOptions = (language) => {
  return Object.entries(cylinderTranslations).map(([value, translation]) => ({
    value: value,
    label: translation[language] || value
  }));
};

/**
 * Check if a cylinder name means "None"
 */
export const isNoneCylinder = (cylinderName) => {
  return cylinderName === 'कोही छैन';
};

/**
 * Check if a cylinder is a brand (not "None")
 */
export const isBrandCylinder = (cylinderName) => {
  return cylinderName !== 'कोही छैन';
};