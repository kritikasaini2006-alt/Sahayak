/**
 * Canonical option mappings for interactive chat questions in Sahayak AI.
 * Shared between client UI and backend handlers.
 */

export const AGE_GROUP_OPTIONS = {
  en: [
    { label: 'Under 18 years', value: 'Under 18 years' },
    { label: '18–25 years', value: '18–25 years' },
    { label: '26–40 years', value: '26–40 years' },
    { label: '41–60 years', value: '41–60 years' },
    { label: 'Above 60 years', value: 'Above 60 years' },
  ],
  hi: [
    { label: '18 वर्ष से कम', value: '18 वर्ष से कम' },
    { label: '18–25 वर्ष', value: '18–25 वर्ष' },
    { label: '26–40 वर्ष', value: '26–40 वर्ष' },
    { label: '41–60 वर्ष', value: '41–60 वर्ष' },
    { label: '60 वर्ष से अधिक', value: '60 वर्ष से अधिक' },
  ],
};

export const DEFAULT_OPTIONS_BY_FIELD = {
  state: {
    en: [
      { label: 'Uttar Pradesh', value: 'Uttar Pradesh' },
      { label: 'Maharashtra', value: 'Maharashtra' },
      { label: 'Bihar', value: 'Bihar' },
      { label: 'Madhya Pradesh', value: 'Madhya Pradesh' },
      { label: 'Rajasthan', value: 'Rajasthan' },
      { label: 'West Bengal', value: 'West Bengal' },
      { label: 'Tamil Nadu', value: 'Tamil Nadu' },
      { label: 'Other State / UT', value: 'Other' },
    ],
    hi: [
      { label: 'उत्तर प्रदेश', value: 'Uttar Pradesh' },
      { label: 'बिहार', value: 'Bihar' },
      { label: 'महाराष्ट्र', value: 'Maharashtra' },
      { label: 'मध्य प्रदेश', value: 'Madhya Pradesh' },
      { label: 'राजस्थान', value: 'Rajasthan' },
      { label: 'पश्चिम बंगाल', value: 'West Bengal' },
      { label: 'अन्य राज्य / केंद्र शासित प्रदेश', value: 'Other' },
    ],
  },
  ageGroup: AGE_GROUP_OPTIONS,
  age: AGE_GROUP_OPTIONS,
  occupation: {
    en: [
      { label: 'Farmer / Cultivator', value: 'farmer' },
      { label: 'Traditional Artisan / Craftsperson', value: 'artisan' },
      { label: 'Street Vendor / Micro Merchant', value: 'vendor' },
      { label: 'Daily Wage / Construction Worker', value: 'daily_wage' },
      { label: 'Salaried / Private Employee', value: 'salaried' },
      { label: 'Homemaker / Domestic', value: 'homemaker' },
      { label: 'Student / Youth', value: 'student' },
      { label: 'Unemployed / Seeking Work', value: 'unemployed' },
      { label: 'Other', value: 'other' },
    ],
    hi: [
      { label: 'किसान / कृषक', value: 'farmer' },
      { label: 'पारंपरिक कारीगर / शिल्पकार', value: 'artisan' },
      { label: 'रेहड़ी-पटरी / छोटा व्यवसायी', value: 'vendor' },
      { label: 'दैनिक मजदूर / निर्माण श्रमिक', value: 'daily_wage' },
      { label: 'निजी / वेतनभोगी कर्मचारी', value: 'salaried' },
      { label: 'गृहिणी', value: 'homemaker' },
      { label: 'विद्यार्थी / युवा', value: 'student' },
      { label: 'बेरोजगार', value: 'unemployed' },
      { label: 'अन्य', value: 'other' },
    ],
  },
  incomeRange: {
    en: [
      { label: 'Below ₹1 Lakh', value: 'below_1l' },
      { label: '₹1 Lakh - ₹2.5 Lakhs', value: '1l_2.5l' },
      { label: '₹2.5 Lakhs - ₹8 Lakhs', value: '2.5l_8l' },
      { label: 'Above ₹8 Lakhs', value: 'above_8l' },
      { label: 'Prefer not to say / Not sure', value: 'skip' },
    ],
    hi: [
      { label: '₹1 लाख से कम', value: 'below_1l' },
      { label: '₹1 लाख से ₹2.5 लाख', value: '1l_2.5l' },
      { label: '₹2.5 लाख से ₹8 लाख', value: '2.5l_8l' },
      { label: '₹8 लाख से अधिक', value: 'above_8l' },
      { label: 'बताना नहीं चाहते / निश्चित नहीं', value: 'skip' },
    ],
  },
  farmerLandholding: {
    en: [
      { label: 'Cultivable land in my name (Marginal <= 1 ha)', value: 'marginal' },
      { label: 'Cultivable land in my name (Small 1-2 ha)', value: 'small' },
      { label: 'Medium or Large Landholding (> 2 ha)', value: 'medium_large' },
      { label: 'Tenant Farmer / No land in name', value: 'tenant' },
      { label: 'Not applicable', value: 'na' },
    ],
    hi: [
      { label: 'मेरे नाम पर कृषि भूमि (1 हेक्टेयर तक)', value: 'marginal' },
      { label: 'मेरे नाम पर कृषि भूमि (1-2 हेक्टेयर)', value: 'small' },
      { label: '2 हेक्टेयर से अधिक भूमि', value: 'medium_large' },
      { label: 'बटाईदार / भूमिहीन किसान', value: 'tenant' },
      { label: 'लागू नहीं', value: 'na' },
    ],
  },
  artisanTrade: {
    en: [
      { label: 'Carpenter (Suthar) / Boat Maker', value: 'carpenter' },
      { label: 'Blacksmith (Lohar) / Tool Maker', value: 'blacksmith' },
      { label: 'Potter (Kumhaar) / Sculptor', value: 'potter' },
      { label: 'Tailor (Darzi) / Cobbler', value: 'tailor' },
      { label: 'Mason (Rajmistri) / Barber', value: 'mason' },
      { label: 'Other Traditional Trade', value: 'other' },
    ],
    hi: [
      { label: 'बढ़ई / नाव निर्माता', value: 'carpenter' },
      { label: 'लोहार / औजार निर्माता', value: 'blacksmith' },
      { label: 'कुम्हार / मूर्तिकार', value: 'potter' },
      { label: 'दर्जी / चर्मकार', value: 'tailor' },
      { label: 'राजमिस्त्री / नाई', value: 'mason' },
      { label: 'अन्य पारंपरिक शिल्प', value: 'other' },
    ],
  },
};
