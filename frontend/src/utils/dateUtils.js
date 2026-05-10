import NepaliDate from 'nepali-date-converter';

// Convert AD date (from database) to BS for display
export const formatToBS = (adDateString, format = 'YYYY-MM-DD') => {
  if (!adDateString) return '';
  
  try {
    const adDate = new Date(adDateString);
    // Check if date is valid
    if (isNaN(adDate.getTime())) return adDateString;
    
    const bsDate = new NepaliDate(adDate);
    return bsDate.format(format);
  } catch (error) {
    console.error('Date conversion error:', error);
    return adDateString;
  }
};

// Format BS date with Nepali numbers (optional)
export const formatToBSNepali = (adDateString) => {
  if (!adDateString) return '';
  
  try {
    const adDate = new Date(adDateString);
    if (isNaN(adDate.getTime())) return adDateString;
    
    const bsDate = new NepaliDate(adDate);
    return bsDate.format('YYYY-MM-DD', 'np');
  } catch (error) {
    console.error('Date conversion error:', error);
    return adDateString;
  }
};

// Get current BS date
export const getCurrentBSDate = (format = 'YYYY-MM-DD') => {
  const bsDate = new NepaliDate();
  return bsDate.format(format);
};

// Get full BS date with day and month name
export const getFullBSDate = (adDateString) => {
  if (!adDateString) return '';
  
  try {
    const adDate = new Date(adDateString);
    if (isNaN(adDate.getTime())) return adDateString;
    
    const bsDate = new NepaliDate(adDate);
    return bsDate.format('dddd, DD MMMM YYYY', 'np');
  } catch (error) {
    console.error('Date conversion error:', error);
    return adDateString;
  }
};

// Get BS year and month for filtering
export const getBSDateComponents = (adDateString) => {
  if (!adDateString) return { year: null, month: null, day: null };
  
  try {
    const adDate = new Date(adDateString);
    if (isNaN(adDate.getTime())) return { year: null, month: null, day: null };
    
    const bsDate = new NepaliDate(adDate);
    return {
      year: bsDate.getYear(),
      month: bsDate.getMonth(),
      day: bsDate.getDate()
    };
  } catch (error) {
    console.error('Date conversion error:', error);
    return { year: null, month: null, day: null };
  }
};