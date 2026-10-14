/**
 * Verified Document Checklists & Application Guidance for Indian Welfare Schemes.
 * Sourced strictly from verified official government notifications and operating guidelines.
 *
 * Security & Civic Ethics:
 * - Sahayak AI provides independent educational and procedural preparation guidance.
 * - NEVER asks for Aadhaar numbers, bank account numbers, OTPs, or passwords.
 * - Does NOT upload or store citizen document images.
 * - Clearly disclaims that actual applications must be submitted on designated .gov.in portals.
 */

export const SCHEME_GUIDANCE = {
  'pm-kisan': {
    schemeId: 'pm-kisan',
    title: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    ministry: 'Ministry of Agriculture and Farmers Welfare',
    officialPortal: 'https://pmkisan.gov.in',
    portalName: 'pmkisan.gov.in',
    officialSource: 'Department of Agriculture & Farmers Welfare (DoA&FW) Operational Guidelines',
    lastVerifiedDate: '2024-09',
    stateVarianceNote:
      'Land revenue records and mutation procedures vary by state (e.g. Bhulekh in Uttar Pradesh, Meebhoomi in Andhra Pradesh, Banglarbhumi in West Bengal). Verification of land titles is conducted by your local Patwari/Lekhpal or Revenue Inspector.',
    prerequisites: [
      'Cultivable agricultural landholding registered in applicant’s name in the state land records.',
      'Active bank account linked with Aadhaar and seeded with NPCI for Direct Benefit Transfer (DBT).',
      'Active mobile number linked with Aadhaar to receive OTP for biometric e-KYC.',
      'Citizen must NOT be an income-tax payee in the previous assessment year.',
    ],
    documents: [
      {
        id: 'pmkisan-aadhaar',
        name: 'Aadhaar Card',
        requirementType: 'Mandatory',
        purpose: 'Required for unique beneficiary identification and biometric/OTP e-KYC.',
        condition: null,
        issuingAuthority: 'Unique Identification Authority of India (UIDAI)',
        howToObtain:
          'Download digital e-Aadhaar from uidai.gov.in or visit any authorized Aadhaar Seva Kendra / Post Office to update mobile linkage.',
        commonMistakes: 'Ensure the mobile number linked to Aadhaar is currently active to receive authentication OTPs.',
      },
      {
        id: 'pmkisan-land-record',
        name: 'Land Ownership Record (Khatauni / Jamabandi / RoR)',
        requirementType: 'Mandatory',
        purpose: 'Proves title ownership of cultivable agricultural land in the applicant’s name.',
        condition: null,
        issuingAuthority: 'State Revenue Department / District Land Records Office',
        howToObtain:
          'Obtain verified digital certified copy from your state Bhulekh portal (e.g. upbhulekh.gov.in) or your local Tehsil office / Lekhpal.',
        commonMistakes: 'Land must be in the applicant’s name; inherited land without formal mutation (namantaran) will be rejected.',
      },
      {
        id: 'pmkisan-bank-passbook',
        name: 'Bank Passbook / Cancelled Cheque',
        requirementType: 'Mandatory',
        purpose: 'Provides Account Number and IFSC for direct crediting of ₹2,000 quarterly installments.',
        condition: null,
        issuingAuthority: 'Public Sector, Private, or Regional Rural Bank (RRB)',
        howToObtain: 'Issued by your bank branch upon opening an active savings account.',
        commonMistakes: 'Account must be Aadhaar-seeded on NPCI mapper. Non-DBT-enabled accounts will fail payment transfers.',
      },
      {
        id: 'pmkisan-citizenship-proof',
        name: 'State Domicile / Voter ID / Ration Card',
        requirementType: 'Conditional',
        purpose: 'Required if land record does not clearly reflect permanent state residence address.',
        condition: 'Requested if applicant’s Aadhaar address differs from the district where farmland is located.',
        issuingAuthority: 'State Revenue Authority / Election Commission / Food & Civil Supplies Dept',
        howToObtain: 'Apply on state e-District service portal or visit Tehsil Common Service Centre (CSC).',
        commonMistakes: 'Ensure address details correspond to the sub-district or block where the farmer resides.',
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Check Aadhaar e-KYC & NPCI Seeding',
        mode: 'Online',
        description:
          'Verify that your bank account is seeded with Aadhaar for DBT. Visit your bank branch or use the NPCI portal to verify active status.',
        tip: 'If your bank account is not Aadhaar-seeded, quarterly DBT installments will fail even if your application is approved.',
      },
      {
        stepNumber: 2,
        title: 'Gather Certified Land Records (Khatauni)',
        mode: 'Online / Offline',
        description:
          'Download the latest certified copy of your Record of Rights (RoR/Khatauni) showing your Khasra/Survey numbers and land area in hectares.',
        tip: 'Keep the Khasra and Khatauni numbers handy as you will need to input them exactly as recorded.',
      },
      {
        stepNumber: 3,
        title: 'New Farmer Registration on pmkisan.gov.in',
        mode: 'Online',
        description:
          'Go to pmkisan.gov.in -> Farmers Corner -> "New Farmer Registration". Select Rural or Urban Farmer, and follow the registration prompts on the official portal.',
        tip: 'Alternatively, you can visit any Common Service Centre (CSC) where the Village Level Entrepreneur (VLE) will enter the data for a nominal fee.',
      },
      {
        stepNumber: 4,
        title: 'Aadhaar OTP Authentication',
        mode: 'Online',
        description:
          'Enter the 6-digit OTP received on your Aadhaar-registered mobile phone. Your name, father’s name, and address will be auto-fetched.',
        tip: 'Do not modify auto-fetched demographic details. Ensure the spelling matches your land documents.',
      },
      {
        stepNumber: 5,
        title: 'Enter Landholding Details & Upload RoR',
        mode: 'Online',
        description:
          'Select District, Sub-District/Tehsil, Block, and Village. Enter Survey/Khasra number, Khata number, land transfer details, and upload the PDF of your land document.',
        tip: 'Upload document as a clear PDF under 200 KB as per portal guidelines.',
      },
      {
        stepNumber: 6,
        title: 'Track Status & State Revenue Verification',
        mode: 'Online',
        description:
          'Note down the Farmer Registration Number. The application is reviewed by your Sub-Divisional Magistrate (SDM) / Nodal Officer.',
        tip: 'Check "Status of Self Registered Farmer/CSC Farmers" on pmkisan.gov.in after 15–30 days to see verification progress.',
      },
    ],
    reviewChecklist: [
      'Land title is officially registered in my own name, not solely in deceased ancestors’ names.',
      'Bank savings account is active and seeded with Aadhaar on the NPCI mapper.',
      'No family member (spouse or minor child) is an income tax payee or government employee.',
      'Landholding size entered in hectares matches the official Khatauni.',
      'Aadhaar registered mobile is active and capable of receiving SMS.',
    ],
  },

  'pm-jay': {
    schemeId: 'pm-jay',
    title: 'Ayushman Bharat - PM Jan Arogya Yojana (AB-PMJAY)',
    ministry: 'National Health Authority (NHA) / Ministry of Health and Family Welfare',
    officialPortal: 'https://beneficiary.nha.gov.in',
    portalName: 'beneficiary.nha.gov.in',
    officialSource: 'National Health Authority (NHA) Operational Framework & Cabinet Decision (Sep 2024)',
    lastVerifiedDate: '2024-09',
    stateVarianceNote:
      'Several states co-brand AB-PMJAY with state healthcare schemes (e.g. Mukhyamantri Amrutum in Gujarat, Aarogyasri in Telangana/AP, Karunya in Kerala, MJPJAY in Maharashtra). A few states like Delhi and West Bengal do not implement PM-JAY and provide alternative state covers.',
    prerequisites: [
      'Belong to eligible SECC 2011 deprivation category OR possess active BPL/AAY/PHH Ration Card, OR be a Senior Citizen aged 70+ (universal coverage).',
      'Aadhaar card with biometric or OTP capability.',
      'Active mobile phone for OTP verification.',
    ],
    documents: [
      {
        id: 'pmjay-aadhaar',
        name: 'Aadhaar Card',
        requirementType: 'Mandatory',
        purpose: 'Identity verification and facial / biometric e-KYC for Ayushman Card generation.',
        condition: null,
        issuingAuthority: 'UIDAI',
        howToObtain: 'Download digital copy from uidai.gov.in or visit Aadhaar center.',
        commonMistakes: 'Name on Aadhaar should match or be phonetically similar to the ration card name.',
      },
      {
        id: 'pmjay-ration-card',
        name: 'Ration Card / NFSA Food Security Card',
        requirementType: 'Mandatory',
        purpose: 'Establishes household membership and socio-economic category (PHH/AAY/BPL).',
        condition: 'Not required for Senior Citizens aged 70+ who are registering under universal Ayushman Vay Vandana.',
        issuingAuthority: 'State Department of Food, Civil Supplies and Consumer Affairs',
        howToObtain: 'Issued by local Food & Civil Supplies office or state ration portal.',
        commonMistakes: 'Ration card must be active; cancelled or lapsed ration cards will fail database matching.',
      },
      {
        id: 'pmjay-age-proof-seniors',
        name: 'Proof of Age (for Senior Citizens 70+)',
        requirementType: 'Conditional',
        purpose: 'Validates universal entitlement for senior citizens aged 70 and above.',
        condition: 'Applicable specifically for citizens aged 70+ seeking universal ₹5 Lakh top-up.',
        issuingAuthority: 'UIDAI / Election Commission / Municipal Birth Registrar',
        howToObtain: 'Aadhaar card displaying date of birth is the primary accepted proof.',
        commonMistakes: 'Ensure year of birth on Aadhaar indicates completed 70 years.',
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Check Family Eligibility on Beneficiary Portal',
        mode: 'Online',
        description:
          'Visit beneficiary.nha.gov.in or download the Ayushman App on Android. Select "Beneficiary" login and enter your mobile number.',
        tip: 'Search by Ration Card number, Aadhaar number, or PMJAY Family ID to locate your family tree.',
      },
      {
        stepNumber: 2,
        title: 'Select Unverified Family Member',
        mode: 'Online',
        description:
          'Review the list of family members. Members without an active card will show an orange "e-KYC Pending" badge.',
        tip: 'Senior citizens aged 70+ will have a separate enroll button under "Ayushman Vay Vandana Card".',
      },
      {
        stepNumber: 3,
        title: 'Complete Biometric / Facial e-KYC',
        mode: 'Online',
        description:
          'Authenticate using Aadhaar OTP (if mobile is linked) or Face Authentication via the Ayushman App camera.',
        tip: 'If online e-KYC fails, walk into any empanelled hospital where the "Ayushman Mitra" desk can perform biometric fingerprint verification.',
      },
      {
        stepNumber: 4,
        title: 'Capture Live Photograph & Submit',
        mode: 'Online',
        description:
          'Take a live photo with good lighting and verify matching score (must be above 80% similarity with Aadhaar photo).',
        tip: 'Ensure no eyeglasses, cap, or heavy shadow obscures your face during the photo capture.',
      },
      {
        stepNumber: 5,
        title: 'Download Ayushman Card (Golden Card)',
        mode: 'Online',
        description:
          'Once approved (often instantaneous or within 24 hours), click "Download Card" to save your official Ayushman Card with QR code.',
        tip: 'Print or save the card on your phone. Present it at any empanelled public or private hospital for cashless admission.',
      },
    ],
    reviewChecklist: [
      'All eligible family members are listed under the household ration card or family ID.',
      'Aadhaar card details match the identity of the person being treated.',
      'For seniors 70+, date of birth on Aadhaar verifies age 70 or higher.',
      'Active Ayushman Card PDF or physical card is downloaded and saved.',
    ],
  },

  'pmay-g': {
    schemeId: 'pmay-g',
    title: 'Pradhan Mantri Awas Yojana - Gramin (PMAY-G)',
    ministry: 'Ministry of Rural Development',
    officialPortal: 'https://pmayg.nic.in',
    portalName: 'pmayg.nic.in',
    officialSource: 'Ministry of Rural Development (MoRD) PMAY-G Guidelines & Awaas+ Framework',
    lastVerifiedDate: '2024-08',
    stateVarianceNote:
      'Grant amounts are ₹1.20 Lakh in plain areas and ₹1.30 Lakh in hilly, North Eastern, and difficult/IAP districts. Identification is done through the local Gram Sabha and Awaas+ mobile survey conducted by Gram Panchayat secretaries.',
    prerequisites: [
      'Household must be living in zero, one, or two-room kutcha houses or be homeless in a rural area.',
      'Must NOT own any pucca house in the name of any family member anywhere in India.',
      'Household must be validated in the SECC 2011 list or Awaas+ survey list by the Gram Sabha.',
    ],
    documents: [
      {
        id: 'pmayg-aadhaar',
        name: 'Aadhaar Card of All Adult Members',
        requirementType: 'Mandatory',
        purpose: 'Identity validation and de-duplication across state housing registries.',
        condition: null,
        issuingAuthority: 'UIDAI',
        howToObtain: 'Download e-Aadhaar or update at Aadhaar Seva Kendra.',
        commonMistakes: 'Ensure Aadhaar numbers of husband, wife, and adult dependents are ready.',
      },
      {
        id: 'pmayg-bank-passbook',
        name: 'Bank / Post Office Account Passbook',
        requirementType: 'Mandatory',
        purpose: 'For direct milestone-based installment transfer (Plinth, Lintel, Roof, Completion).',
        condition: null,
        issuingAuthority: 'Commercial Bank, RRB, or India Post Payments Bank',
        howToObtain: 'Active single or joint savings account passbook with IFSC and Aadhaar mapping.',
        commonMistakes: 'Account must not have dormant or inactive status with low transaction limits.',
      },
      {
        id: 'pmayg-mgnrega-card',
        name: 'MGNREGA Job Card',
        requirementType: 'Mandatory',
        purpose: 'Entitles the beneficiary to 90–95 days of unskilled labor wages (₹18,000–₹24,000) during house construction.',
        condition: null,
        issuingAuthority: 'Gram Panchayat / Block Program Officer (MGNREGA)',
        howToObtain: 'Issued by Gram Panchayat Secretary / Rozgar Sahayak upon application.',
        commonMistakes: 'Job card must be valid and linked with the household head.',
      },
      {
        id: 'pmayg-land-consent',
        name: 'Land Ownership Document / Gram Panchayat Allotment',
        requirementType: 'Mandatory',
        purpose: 'Confirms clear legal title or government patta to construct house on the identified plot.',
        condition: null,
        issuingAuthority: 'Gram Panchayat / Tehsildar',
        howToObtain: 'Issued by revenue authority or village local body.',
        commonMistakes: 'Disputed land or encroachment plots will result in suspension of installments.',
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Gram Sabha Validation & Awaas+ Survey',
        mode: 'Offline',
        description:
          'Beneficiaries are identified through the Awaas+ survey conducted by the Gram Panchayat. The preliminary priority list is approved during the open Gram Sabha meeting.',
        tip: 'Attend your local Gram Sabha meeting to ensure your name appears in the published housing waitlist.',
      },
      {
        stepNumber: 2,
        title: 'Registration on AwaasSoft by BDO',
        mode: 'Hybrid',
        description:
          'The Block Development Officer (BDO) registers approved households on the central AwaasSoft portal with Aadhaar, bank account, and MGNREGA details.',
        tip: 'Citizens cannot register directly as individuals on the public web; it must be submitted through your Panchayat/Block nodal officer.',
      },
      {
        stepNumber: 3,
        title: 'Geo-Tagging of Vacant Site / Kutcha House',
        mode: 'Offline',
        description:
          'A village official inspects the existing kutcha house or vacant plot and uploads geo-tagged time-stamped photographs via the AwaasApp.',
        tip: 'Installment 1 is disbursed only after geo-tagging verifies an unconstructed or kutcha site.',
      },
      {
        stepNumber: 4,
        title: 'Staggered Installment Release & Construction Milestones',
        mode: 'Online DBT',
        description:
          'Grants are credited in 3 to 4 installments directly into your bank account as construction reaches Plinth level, Lintel level, and Roof casting.',
        tip: 'Do not alter the sanctioned layout dimensions (minimum 25 sq. metres including hygienic cooking space).',
      },
      {
        stepNumber: 5,
        title: 'Swachh Bharat Latrine Grant & Completion Geo-Tag',
        mode: 'Hybrid',
        description:
          'Upon completion, final geo-tag photo is uploaded. Receive supplementary ₹12,000 grant for toilet construction under SBM-G.',
        tip: 'You will also receive your formal PMAY-G completion plaque and certificate from the district authority.',
      },
    ],
    reviewChecklist: [
      'No member of the household owns a pucca house anywhere in India.',
      'Applicant is validated in the Gram Sabha approved housing priority list.',
      'Active bank account is linked with Aadhaar and capable of receiving large DBT credits.',
      'MGNREGA job card number is verified and active.',
      'Identified construction site is free of boundary disputes.',
    ],
  },

  'sukanya-samriddhi': {
    schemeId: 'sukanya-samriddhi',
    title: 'Sukanya Samriddhi Yojana (SSY)',
    ministry: 'Ministry of Finance / National Savings Institute',
    officialPortal: 'https://www.indiapost.gov.in',
    portalName: 'indiapost.gov.in',
    officialSource: 'Sukanya Samriddhi Account Rules, Department of Economic Affairs, Ministry of Finance',
    lastVerifiedDate: '2024-09',
    stateVarianceNote:
      'SSY is a Central Government savings scheme governed by uniform national rules across all states and Union Territories. Accounts can be opened at any India Post Office branch or designated commercial bank (SBI, PNB, BoB, Canara, etc.) and easily transferred anywhere in India.',
    prerequisites: [
      'Girl child must be an Indian resident and under 10 years of age on date of account opening.',
      'Must be opened by natural or legal guardian.',
      'Maximum of two accounts per family (allowed for three if second birth resulted in twins/triplets).',
    ],
    documents: [
      {
        id: 'ssy-birth-cert',
        name: 'Birth Certificate of Girl Child',
        requirementType: 'Mandatory',
        purpose: 'Validates girl child’s date of birth and confirms eligibility below 10 years.',
        condition: null,
        issuingAuthority: 'Municipal Corporation / Registrar of Births and Deaths / Gram Panchayat',
        howToObtain: 'Obtained from municipal office or hospital registrar upon birth registration.',
        commonMistakes: 'Child’s name must be entered on the birth certificate; blank name certificates are rejected.',
      },
      {
        id: 'ssy-guardian-id',
        name: 'Identity Proof of Guardian (Aadhaar / PAN / Voter ID)',
        requirementType: 'Mandatory',
        purpose: 'Establishes legal identity and KYC of the parent or guardian operating the account.',
        condition: null,
        issuingAuthority: 'UIDAI / Income Tax Dept / Election Commission',
        howToObtain: 'Official government-issued identity cards.',
        commonMistakes: 'Address on ID should ideally match proof of residence.',
      },
      {
        id: 'ssy-guardian-address',
        name: 'Address Proof of Guardian',
        requirementType: 'Mandatory',
        purpose: 'Verifies residential address for official postal correspondence.',
        condition: null,
        issuingAuthority: 'Utility Board, UIDAI, or Revenue Department',
        howToObtain: 'Electricity bill, Aadhaar card, Passport, or Ration card.',
        commonMistakes: 'Utility bills should not be older than 3 months.',
      },
      {
        id: 'ssy-photos',
        name: 'Passport Size Photographs (Child & Guardian)',
        requirementType: 'Mandatory',
        purpose: 'Affixed to the physical SSY passbook and account opening ledger.',
        condition: null,
        issuingAuthority: 'Self-procured',
        howToObtain: 'Recent color passport-sized photos with white background.',
        commonMistakes: 'Ensure photos are recent and clearly visible.',
      },
      {
        id: 'ssy-medical-cert-twins',
        name: 'Medical Certificate for Twins / Triplets',
        requirementType: 'Conditional',
        purpose: 'Required only when opening a 3rd account in a family due to multiple births.',
        condition: 'Applicable only if second/subsequent birth resulted in twin or triplet girl children.',
        issuingAuthority: 'Authorized Government Hospital / Civil Surgeon',
        howToObtain: 'Hospital discharge slip and medical certificate from attending gynecologist.',
        commonMistakes: 'Must clearly state twin/triplet birth order.',
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Choose Post Office or Commercial Bank Branch',
        mode: 'Offline',
        description:
          'Identify your nearest India Post branch or authorized nationalized bank (e.g. SBI, Bank of Baroda, PNB).',
        tip: 'Postal accounts can be conveniently operated via India Post Payments Bank (IPPB) mobile banking for digital deposits.',
      },
      {
        stepNumber: 2,
        title: 'Collect & Fill Form-1 (SSY Account Opening Form)',
        mode: 'Offline',
        description:
          'Obtain Form-1 from the counter or download from indiapost.gov.in. Fill child details, guardian details, and nomination details.',
        tip: 'Always declare a nominee to protect the account corpus in unforeseen events.',
      },
      {
        stepNumber: 3,
        title: 'Attach Photocopies & Carry Originals for Verification',
        mode: 'Offline',
        description:
          'Attach self-attested photocopies of the birth certificate and guardian KYC. Present originals for instant counter verification.',
        tip: 'Sign each photocopy as "Self Attested" with date.',
      },
      {
        stepNumber: 4,
        title: 'Deposit Initial Amount (Minimum ₹250)',
        mode: 'Offline',
        description:
          'Make initial deposit of at least ₹250 (up to maximum ₹1,50,000 per financial year) in cash or cheque.',
        tip: 'Keep a receipt of the initial deposit slip until the passbook is printed.',
      },
      {
        stepNumber: 5,
        title: 'Receive Official SSY Passbook',
        mode: 'Offline',
        description:
          'The postal or bank officer will hand over an embossed physical passbook showing the account number, date of opening, child’s name, and maturity date.',
        tip: 'Deposit at least ₹250 every financial year to prevent the account from turning default (which attracts a ₹50 penalty).',
      },
    ],
    reviewChecklist: [
      'Girl child is under 10 years of age on date of submission.',
      'Child’s name on birth certificate matches account opening form.',
      'Guardian identity proof has valid PAN or Form 60.',
      'Minimum deposit amount of ₹250 is arranged.',
      'No more than one existing SSY account exists for this child.',
    ],
  },

  'pm-mudra': {
    schemeId: 'pm-mudra',
    title: 'Pradhan Mantri MUDRA Yojana (PMMY)',
    ministry: 'Department of Financial Services, Ministry of Finance / MUDRA',
    officialPortal: 'https://udyamimitra.in',
    portalName: 'udyamimitra.in',
    officialSource: 'Department of Financial Services (DFS) Operational MUDRA Guidelines',
    lastVerifiedDate: '2024-09',
    stateVarianceNote:
      'National scheme implemented through public sector banks, private banks, Regional Rural Banks (RRBs), Small Finance Banks, and Microfinance Institutions (MFIs). Margin money and processing fee waivers apply nationally for Shishu tier (loans up to ₹50,000).',
    prerequisites: [
      'Non-farm business activity in manufacturing, trading, or service sector.',
      'Applicant must not have defaulted on any prior institutional loan.',
      'Minimum age 18 years.',
    ],
    documents: [
      {
        id: 'mudra-kyc',
        name: 'KYC Documents (Aadhaar / Voter ID / PAN Card)',
        requirementType: 'Mandatory',
        purpose: 'Identity and address verification of business proprietor or partners.',
        condition: null,
        issuingAuthority: 'UIDAI / Election Commission / Income Tax Dept',
        howToObtain: 'Official government identity cards.',
        commonMistakes: 'PAN card is mandatory for business loans above ₹50,000.',
      },
      {
        id: 'mudra-business-proof',
        name: 'Proof of Business Establishment / Udyam Registration',
        requirementType: 'Mandatory',
        purpose: 'Validates existence and activity of commercial micro-enterprise.',
        condition: null,
        issuingAuthority: 'Ministry of MSME (udyamregistration.gov.in) / Municipal Body',
        howToObtain: 'Register free of cost on udyamregistration.gov.in to get instant Udyam Certificate.',
        commonMistakes: 'For new startup (Shishu), shop rent agreement or local trade license can suffice if Udyam is pending.',
      },
      {
        id: 'mudra-bank-statements',
        name: 'Bank Statements (Past 6 Months)',
        requirementType: 'Conditional',
        purpose: 'Assesses financial cash flow and transaction discipline.',
        condition: 'Required for Kishore (up to ₹5L) and Tarun (up to ₹10-20L) tiers; optional for new Shishu borrowers.',
        issuingAuthority: 'Applicant’s bank',
        howToObtain: 'Download digital e-statement via NetBanking or obtain stamped copy from branch.',
        commonMistakes: 'Ensure statements include full 6 months without missing transaction pages.',
      },
      {
        id: 'mudra-quotations',
        name: 'Quotation of Machinery / Equipment to be Purchased',
        requirementType: 'Conditional',
        purpose: 'Allows bank to verify capital expenditure and directly disburse asset costs to suppliers.',
        condition: 'Mandatory if loan is requested for purchasing machinery, tools, vehicles, or equipment.',
        issuingAuthority: 'Authorized equipment seller / vendor',
        howToObtain: 'Request formal pro-forma invoice or quotation from authorized machinery vendor.',
        commonMistakes: 'Quotation must include vendor GST number and detailed unit price breakdown.',
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Determine Loan Category (Shishu, Kishore, or Tarun)',
        mode: 'Self Assessment',
        description:
          'Shishu: up to ₹50,000 (ideal for vendors/micro-shops); Kishore: ₹50,001 to ₹5 Lakhs; Tarun: ₹5,00,001 to ₹10 Lakhs (up to ₹20L for Tarun Plus).',
        tip: 'Shishu loans have zero processing fees and no margin money requirement.',
      },
      {
        stepNumber: 2,
        title: 'Register on Udyamimitra Portal (udyamimitra.in)',
        mode: 'Online',
        description:
          'Visit udyamimitra.in, create a borrower profile, and select "Apply for MUDRA Loan". Fill business revenue projections.',
        tip: 'You can apply to multiple preferred lenders simultaneously through the portal.',
      },
      {
        stepNumber: 3,
        title: 'Upload Documents & Business Proposal',
        mode: 'Online / Offline',
        description:
          'Upload identity proof, address proof, business establishment document, and equipment quotation.',
        tip: 'You can also walk directly into any commercial bank branch with physical copies if preferred.',
      },
      {
        stepNumber: 4,
        title: 'Bank Field Verification & Sanction Letter',
        mode: 'Offline',
        description:
          'The bank manager or credit officer inspects your shop/activity premises and approves credit under the Credit Guarantee Fund (CGFMU).',
        tip: 'No collateral or third-party guarantee can be demanded by any bank for loans up to ₹10 Lakhs under RBI rules.',
      },
      {
        stepNumber: 5,
        title: 'Loan Disbursement & MUDRA RuPay Card',
        mode: 'Online',
        description:
          'Loan is disbursed. Working capital portion is credited with a MUDRA RuPay Debit Card for easy digital expense withdrawals.',
        tip: 'Transact digitally using the RuPay card to build a strong digital credit score for future limit increases.',
      },
    ],
    reviewChecklist: [
      'Business proposal relates to a non-farm activity (retail, tailoring, services, crafts, repairs).',
      'No outstanding defaults exist in CIBIL or with any cooperative/commercial bank.',
      'Udyam Registration certificate or shop proof is attached.',
      'Equipment quotations are obtained from GST-registered vendors.',
    ],
  },

  'pm-vishwakarma': {
    schemeId: 'pm-vishwakarma',
    title: 'PM Vishwakarma Scheme',
    ministry: 'Ministry of Micro, Small and Medium Enterprises (MSME)',
    officialPortal: 'https://pmvishwakarma.gov.in',
    portalName: 'pmvishwakarma.gov.in',
    officialSource: 'Ministry of MSME Central Sector Scheme Guidelines for PM Vishwakarma',
    lastVerifiedDate: '2024-08',
    stateVarianceNote:
      'National scheme covering 18 traditional family trades. Registration is biometric-based and submitted via Common Service Centres (CSCs). Multi-tier verification is conducted by Gram Panchayat / Urban Local Bodies followed by District Implementation Committee.',
    prerequisites: [
      'Artisan or craftsperson working in one of 18 designated family trades (carpenter, blacksmith, tailor, potter, mason, cobbler, barber, etc.).',
      'Minimum age 18 years.',
      'Limited to one member per household.',
      'Must NOT have availed similar central credit schemes (PMEGP, Mudra, SVANidhi) in the last 5 years.',
    ],
    documents: [
      {
        id: 'vishwakarma-aadhaar',
        name: 'Aadhaar Card (Biometric Verification)',
        requirementType: 'Mandatory',
        purpose: 'Biometric fingerprint or iris authentication on CSC portal.',
        condition: null,
        issuingAuthority: 'UIDAI',
        howToObtain: 'Valid Aadhaar card.',
        commonMistakes: 'Ensure fingers are clean and biometric records are updated in Aadhaar database.',
      },
      {
        id: 'vishwakarma-mobile',
        name: 'Active Mobile Linked to Aadhaar',
        requirementType: 'Mandatory',
        purpose: 'Receives registration OTP and training schedule SMS alerts.',
        condition: null,
        issuingAuthority: 'Telecom Service Provider',
        howToObtain: 'Active mobile SIM.',
        commonMistakes: 'Do not use a temporary number; government training batches are notified via SMS.',
      },
      {
        id: 'vishwakarma-bank',
        name: 'Bank Account Passbook / Details',
        requirementType: 'Mandatory',
        purpose: 'Required to receive ₹500/day training stipend and ₹15,000 digital toolkit voucher.',
        condition: null,
        issuingAuthority: 'Scheduled Commercial Bank / RRB',
        howToObtain: 'Bank passbook showing account number and IFSC.',
        commonMistakes: 'Account must be seeded with Aadhaar on NPCI mapper.',
      },
      {
        id: 'vishwakarma-ration',
        name: 'Ration Card / Family Composition Proof',
        requirementType: 'Mandatory',
        purpose: 'Ensures only one eligible member per family receives benefits under scheme rules.',
        condition: null,
        issuingAuthority: 'Food & Civil Supplies Department',
        howToObtain: 'State ration card or parivar register copy.',
        commonMistakes: 'Ensure all family members are listed correctly.',
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Biometric Enrollment at Common Service Centre (CSC)',
        mode: 'Offline',
        description:
          'Visit your nearest Common Service Centre (CSC) with your Aadhaar, bank passbook, and ration card. The VLE performs biometric registration.',
        tip: 'Select your trade accurately from the 18 designated categories. Registration is completely free.',
      },
      {
        stepNumber: 2,
        title: 'Stage 1 Gram Panchayat / ULB Verification',
        mode: 'Official Process',
        description:
          'Your Gram Panchayat head (Sarpanch) or Municipal Executive Officer verifies that you are an active artisan practicing the trade.',
        tip: 'Contact your Panchayat secretary to expedite the first-stage verification queue.',
      },
      {
        stepNumber: 3,
        title: 'District Screening Committee Approval',
        mode: 'Official Process',
        description:
          'The District Implementation Committee headed by the District Magistrate reviews and grants final approval.',
        tip: 'Track your application status online anytime at pmvishwakarma.gov.in using your Aadhaar OTP.',
      },
      {
        stepNumber: 4,
        title: 'Receive PM Vishwakarma Digital ID & Certificate',
        mode: 'Online',
        description:
          'Download your official PM Vishwakarma Certificate and National Digital Craftsperson ID Card from the portal.',
        tip: 'This certificate provides formal government recognition across all commercial markets.',
      },
      {
        stepNumber: 5,
        title: 'Skill Upgradation & ₹15,000 Modern Toolkit Incentive',
        mode: 'In-person & Digital Voucher',
        description:
          'Attend 5–7 days of basic skill training with ₹500/day cash stipend. Receive ₹15,000 e-RUPI digital voucher to purchase modern professional tools.',
        tip: 'You can subsequently apply for collateral-free credit up to ₹1,00,000 at 5% interest.',
      },
    ],
    reviewChecklist: [
      'My traditional trade is among the 18 notified crafts.',
      'No other family member in my household has enrolled in PM Vishwakarma.',
      'I have not taken default credit from Mudra or PMEGP in the past 5 years.',
      'My bank account is active and linked with Aadhaar.',
    ],
  },

  'nsap-oaps': {
    schemeId: 'nsap-oaps',
    title: 'Indira Gandhi National Old Age Pension Scheme (IGNOAPS)',
    ministry: 'Ministry of Rural Development',
    officialPortal: 'https://nsap.nic.in',
    portalName: 'nsap.nic.in',
    officialSource: 'National Social Assistance Programme (NSAP) Guidelines, Ministry of Rural Development',
    lastVerifiedDate: '2024-07',
    stateVarianceNote:
      'The Central Government provides ₹200/month (age 60-79) and ₹500/month (age 80+). State Governments add matching or substantial top-ups, resulting in total monthly pensions typically between ₹1,000 and ₹2,500 depending on your state. Application portals vary by state (e.g. SSPY in UP, SSP in Karnataka, Social Welfare portals).',
    prerequisites: [
      'Applicant must be aged 60 years or older.',
      'Applicant must belong to a household living Below Poverty Line (BPL) according to official state criteria.',
      'Not receiving statutory pension from government or organized sector retirement.',
    ],
    documents: [
      {
        id: 'nsap-aadhaar',
        name: 'Aadhaar Card',
        requirementType: 'Mandatory',
        purpose: 'Identity verification and direct DBT pension credits.',
        condition: null,
        issuingAuthority: 'UIDAI',
        howToObtain: 'Valid Aadhaar card.',
        commonMistakes: 'Ensure date of birth is clearly specified.',
      },
      {
        id: 'nsap-age-proof',
        name: 'Age Proof (Birth Certificate / Voter ID / Medical Certificate)',
        requirementType: 'Mandatory',
        purpose: 'Validates that applicant has completed 60 years of age.',
        condition: null,
        issuingAuthority: 'Election Commission / Civil Surgeon / Municipal Registrar',
        howToObtain: 'Voter ID or Medical Age Certificate issued by District Chief Medical Officer (CMO).',
        commonMistakes: 'If Aadhaar has only year of birth, supporting age document confirms completed 60 years.',
      },
      {
        id: 'nsap-bpl-proof',
        name: 'BPL Ration Card / Income Certificate',
        requirementType: 'Mandatory',
        purpose: 'Proves Below Poverty Line economic status.',
        condition: null,
        issuingAuthority: 'Food & Civil Supplies Dept / Tehsildar',
        howToObtain: 'BPL ration card or income certificate from revenue authority.',
        commonMistakes: 'Income certificate must be within current validity period (typically 1 year).',
      },
      {
        id: 'nsap-passbook',
        name: 'Bank / Post Office Savings Passbook',
        requirementType: 'Mandatory',
        purpose: 'For monthly direct credit of pension amount.',
        condition: null,
        issuingAuthority: 'Commercial Bank or India Post',
        howToObtain: 'Active single savings account passbook with IFSC.',
        commonMistakes: 'Avoid joint accounts with non-pensioners to prevent disbursement holds.',
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Obtain Application Form from BDO or State Portal',
        mode: 'Hybrid',
        description:
          'Collect physical Old Age Pension form from Block Development Office (BDO) / Gram Panchayat Secretary, or apply on your State Social Security Portal (e.g. sspy-up.gov.in in UP).',
        tip: 'Many states offer complete online self-service via their e-District or Social Welfare portals.',
      },
      {
        stepNumber: 2,
        title: 'Attach Age Proof & BPL Verification',
        mode: 'Offline',
        description:
          'Attach self-attested copies of Aadhaar, age certificate, BPL ration card, and bank passbook.',
        tip: 'Ensure the applicant’s name spelling matches across the bank passbook and Aadhaar card.',
      },
      {
        stepNumber: 3,
        title: 'Field Verification by Lekhpal / Patwari',
        mode: 'Official Process',
        description:
          'Local revenue official verifies applicant’s age, living condition, and BPL status.',
        tip: 'Keep the acknowledgment receipt safe to track your file number.',
      },
      {
        stepNumber: 4,
        title: 'Sanction Order by Sub-Divisional Magistrate (SDM)',
        mode: 'Official Process',
        description:
          'The District Social Welfare Officer issues a formal pension sanction order and generates a Pensioner ID.',
        tip: 'Check status on nsap.nic.in under "Reports" -> "Beneficiary Search by Name/Account".',
      },
      {
        stepNumber: 5,
        title: 'Monthly Direct Benefit Transfer',
        mode: 'Online DBT',
        description:
          'Pension credits commence directly into your bank or post office savings account on a monthly or quarterly basis.',
        tip: 'Submit annual Digital Life Certificate (Jeevan Pramaan) once a year to ensure uninterrupted pension payments.',
      },
    ],
    reviewChecklist: [
      'Applicant has completed at least 60 years of age on date of application.',
      'Household possesses valid BPL card or revenue income certificate.',
      'Single savings bank account is linked with Aadhaar.',
      'Applicant does not receive another regular pension from EPFO or civil service.',
    ],
  },

  'pmuy': {
    schemeId: 'pmuy',
    title: 'Pradhan Mantri Ujjwala Yojana (PMUY 2.0)',
    ministry: 'Ministry of Petroleum and Natural Gas',
    officialPortal: 'https://pmuy.gov.in',
    portalName: 'pmuy.gov.in',
    officialSource: 'PMUY 2.0 Operational Framework, Ministry of Petroleum and Natural Gas (MoPNG)',
    lastVerifiedDate: '2024-09',
    stateVarianceNote:
      'National Central Sector Scheme implemented through Oil Marketing Companies (IOCL / Indane, BPCL / Bharatgas, HPCL / HP Gas). Applications are processed at local LPG distributorships with nationwide de-duplication to prevent multiple connections per family.',
    prerequisites: [
      'Applicant must be an adult woman aged 18 years or older.',
      'No existing domestic LPG connection in the same household.',
      'Household must belong to eligible underprivileged categories (SC/ST, PMAY beneficiary, AAY, forest dweller, or under 14-point declaration).',
    ],
    documents: [
      {
        id: 'pmuy-woman-aadhaar',
        name: 'Aadhaar Card of Female Applicant',
        requirementType: 'Mandatory',
        purpose: 'Identity and address proof; connection is registered exclusively in the woman’s name.',
        condition: null,
        issuingAuthority: 'UIDAI',
        howToObtain: 'Valid Aadhaar card.',
        commonMistakes: 'Must be an adult woman (18+ years).',
      },
      {
        id: 'pmuy-family-aadhaar',
        name: 'Aadhaar Cards of All Adult Family Members',
        requirementType: 'Mandatory',
        purpose: 'Used in the national OMC de-duplication software to confirm no other cylinder is held by the household.',
        condition: null,
        issuingAuthority: 'UIDAI',
        howToObtain: 'Aadhaar cards of all adults living in the same kitchen unit.',
        commonMistakes: 'Missing adult member Aadhaar numbers will delay processing.',
      },
      {
        id: 'pmuy-ration-card',
        name: 'Ration Card / Family Composition Proof',
        requirementType: 'Mandatory',
        purpose: 'Certifies family composition and establishes household unit.',
        condition: null,
        issuingAuthority: 'State Food & Civil Supplies Department',
        howToObtain: 'State ration card.',
        commonMistakes: 'For migrant families without local ration cards, self-declaration Annexure-I is accepted under PMUY 2.0.',
      },
      {
        id: 'pmuy-bank',
        name: 'Bank Passbook of Female Applicant',
        requirementType: 'Mandatory',
        purpose: 'For direct crediting of central government refill subsidies (DBTL / PAHAL).',
        condition: null,
        issuingAuthority: 'Commercial Bank or India Post Payments Bank',
        howToObtain: 'Active savings account passbook with IFSC.',
        commonMistakes: 'Account must be exclusively in the woman applicant’s name or joint account where she is primary.',
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Apply Online or Visit Nearest LPG Distributor',
        mode: 'Hybrid',
        description:
          'Visit pmuy.gov.in -> "Apply for New Ujjwala 2.0 Connection" to apply online, or visit nearest Indane, Bharat Gas, or HP Gas distributorship.',
        tip: 'Choose the distributor closest to your residence for quick cylinder home delivery.',
      },
      {
        stepNumber: 2,
        title: 'Submit Application Form & KYC Documents',
        mode: 'Hybrid',
        description:
          'Submit applicant’s Aadhaar, family Aadhaar copies, ration card, and bank passbook with 14-point declaration form.',
        tip: 'Under PMUY 2.0, migrant workers only need a self-declaration for proof of address.',
      },
      {
        stepNumber: 3,
        title: 'OMC Central De-Duplication Verification',
        mode: 'Official Process',
        description:
          'Oil Marketing Companies cross-check the Aadhaar database nationwide to verify no prior LPG connection exists for this family.',
        tip: 'Verification normally takes 3 to 7 working days.',
      },
      {
        stepNumber: 4,
        title: 'Safety Inspection & Kitchen Verification',
        mode: 'Offline',
        description:
          'Distributor verifies that the household has a raised cooking platform and proper ventilation for safe LPG usage.',
        tip: 'Cooking platform must be elevated above floor level.',
      },
      {
        stepNumber: 5,
        title: 'Collect Deposit-Free LPG Connection & Free Stove',
        mode: 'Offline',
        description:
          'Receive gas cylinder with security deposit waived, safety hose, regulator, domestic gas consumer card, plus first cylinder refill and gas stove free of cost.',
        tip: 'Attend the brief safety demonstration conducted by the delivery executive.',
      },
    ],
    reviewChecklist: [
      'Applicant is an adult woman (age 18+).',
      'No member in the household currently holds an active LPG connection with any gas agency.',
      'Aadhaar numbers of all adult family members residing together are provided.',
      'Applicant’s active bank account is seeded with Aadhaar.',
    ],
  },

  'pm-svanidhi': {
    schemeId: 'pm-svanidhi',
    title: 'PM Street Vendor’s AtmaNirbhar Nidhi (PM SVANidhi)',
    ministry: 'Ministry of Housing and Urban Affairs (MoHUA)',
    officialPortal: 'https://pmsvanidhi.mohua.gov.in',
    portalName: 'pmsvanidhi.mohua.gov.in',
    officialSource: 'Scheme Guidelines for PM SVANidhi, Ministry of Housing and Urban Affairs',
    lastVerifiedDate: '2024-09',
    stateVarianceNote:
      'Implemented across all Urban Local Bodies (ULBs) and municipalities nationwide. Vending certificates and Letters of Recommendation (LoR) are issued by local municipal Town Vending Committees (TVC).',
    prerequisites: [
      'Street vendor or hawker vending in urban or peri-urban areas.',
      'Possess Vending Certificate / ID or be identified in municipal survey, or have Letter of Recommendation (LoR).',
      'Aadhaar-linked mobile phone.',
    ],
    documents: [
      {
        id: 'svanidhi-aadhaar',
        name: 'Aadhaar Card',
        requirementType: 'Mandatory',
        purpose: 'Identity verification and digital KYC.',
        condition: null,
        issuingAuthority: 'UIDAI',
        howToObtain: 'Valid Aadhaar card.',
        commonMistakes: 'Mobile number must match Aadhaar record.',
      },
      {
        id: 'svanidhi-vending-proof',
        name: 'Certificate of Vending / Municipal ID / Letter of Recommendation (LoR)',
        requirementType: 'Mandatory',
        purpose: 'Proves street vending occupation in designated municipal jurisdiction.',
        condition: null,
        issuingAuthority: 'Urban Local Body (Municipality/Nagar Nigam) / Town Vending Committee',
        howToObtain: 'Issued by local municipality, or apply for LoR online on pmsvanidhi.mohua.gov.in.',
        commonMistakes: 'Vendors without formal ID can easily request an LoR through their municipal office.',
      },
      {
        id: 'svanidhi-bank',
        name: 'Bank Passbook',
        requirementType: 'Mandatory',
        purpose: 'For direct credit of working capital loan and quarterly 7% interest subsidies.',
        condition: null,
        issuingAuthority: 'Bank or India Post Payments Bank',
        howToObtain: 'Savings or current bank passbook.',
        commonMistakes: 'Ensure account is active with UPI facility enabled.',
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Check Vending Status or Apply for LoR',
        mode: 'Online',
        description:
          'Visit pmsvanidhi.mohua.gov.in or download the PM SVANidhi app. Check if your name is in the municipal vendor survey or apply for an LoR.',
        tip: 'If in survey list, you can proceed immediately without waiting for an LoR.',
      },
      {
        stepNumber: 2,
        title: 'Apply for First Tranche Loan (₹10,000)',
        mode: 'Online',
        description:
          'Fill online loan application, select your preferred bank/lender branch, and submit Aadhaar e-KYC.',
        tip: 'No collateral is required. The loan has a 1-year repayment period.',
      },
      {
        stepNumber: 3,
        title: 'Lender Processing & Verification',
        mode: 'Hybrid',
        description:
          'The selected bank or microfinance institution reviews your vending spot and approves credit.',
        tip: 'A Banking Correspondent (BC) may visit your stall for quick photo verification.',
      },
      {
        stepNumber: 4,
        title: 'Disbursement into Savings Account',
        mode: 'Online',
        description:
          'Loan amount of ₹10,000 is credited directly into your bank account.',
        tip: 'Set up an auto-debit or pay EMIs on time to qualify for 7% interest subsidy.',
      },
      {
        stepNumber: 5,
        title: 'Digital Cashback & Upgrade to ₹20,000 / ₹50,000',
        mode: 'Digital',
        description:
          'Receive UPI QR code from bank. Earn up to ₹100/month in digital cashback on receiving digital payments. Timely repayment unlocks Tranche 2 (₹20,000) and Tranche 3 (₹50,000).',
        tip: 'Prompt repayment improves your credit score dramatically for larger MSME loans.',
      },
    ],
    reviewChecklist: [
      'Street vendor is active in urban or peri-urban municipal area.',
      'Possesses municipal vending ID or active Letter of Recommendation (LoR).',
      'Bank account is active and enabled for digital UPI transactions.',
      'Mobile phone is active and linked with Aadhaar.',
    ],
  },

  'pm-kmy': {
    schemeId: 'pm-kmy',
    title: 'Pradhan Mantri Kisan Maan-Dhan Yojana (PM-KMY)',
    ministry: 'Ministry of Agriculture and Farmers Welfare / LIC',
    officialPortal: 'https://maandhan.in',
    portalName: 'maandhan.in',
    officialSource: 'Operational Guidelines for PM Kisan Maan-Dhan Yojana, Department of Agriculture & Farmers Welfare',
    lastVerifiedDate: '2024-08',
    stateVarianceNote:
      'National Central Sector Scheme managed by Life Insurance Corporation of India (LIC). Voluntary, contributory pension scheme with 50% matching grant from Central Government. Farmers enrolled in PM-KISAN can opt to have contributions auto-debited directly from their ₹2,000 installments.',
    prerequisites: [
      'Small and marginal farmer owning cultivable land up to 2 hectares (5 acres).',
      'Entry age strictly between 18 and 40 years.',
      'Not covered under any other statutory social security scheme (NPS, ESIC, EPFO, PM-SYM).',
    ],
    documents: [
      {
        id: 'pmkmy-aadhaar',
        name: 'Aadhaar Card',
        requirementType: 'Mandatory',
        purpose: 'Identity verification and unique pension account generation.',
        condition: null,
        issuingAuthority: 'UIDAI',
        howToObtain: 'Valid Aadhaar card.',
        commonMistakes: 'Date of birth must confirm age between 18 and 40 years.',
      },
      {
        id: 'pmkmy-land-record',
        name: 'Land Record (Khatauni / Khasra)',
        requirementType: 'Mandatory',
        purpose: 'Validates cultivable landholding up to 2 hectares (5 acres).',
        condition: null,
        issuingAuthority: 'State Revenue Department',
        howToObtain: 'Certified copy from state Bhulekh portal or Lekhpal.',
        commonMistakes: 'Total cultivable area must not exceed 2 hectares across all parcels.',
      },
      {
        id: 'pmkmy-bank',
        name: 'Savings Bank Account Passbook / Cheque',
        requirementType: 'Mandatory',
        purpose: 'Sets up auto-debit mandate for monthly contribution (₹55 to ₹200).',
        condition: null,
        issuingAuthority: 'Bank or Post Office',
        howToObtain: 'Passbook or cancelled cheque with IFSC.',
        commonMistakes: 'Ensure sufficient balance is maintained on auto-debit dates.',
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Visit Nearest CSC or Self-Enroll on maandhan.in',
        mode: 'Hybrid',
        description:
          'Visit any Common Service Centre (CSC) with your Aadhaar, bank passbook, and land records, or visit maandhan.in -> "Click here to apply now".',
        tip: 'CSC enrollment is free; the government pays the service charge to the Village Level Entrepreneur.',
      },
      {
        stepNumber: 2,
        title: 'Calculate Monthly Contribution based on Age',
        mode: 'Online',
        description:
          'Contribution ranges from ₹55/month (age 18) to ₹200/month (age 40). Government matches 100% of your contribution.',
        tip: 'If you are a PM-KISAN beneficiary, you can check the box to auto-debit contributions from your quarterly ₹2,000 installment.',
      },
      {
        stepNumber: 3,
        title: 'Sign Auto-Debit Bank Mandate',
        mode: 'Offline / e-Sign',
        description:
          'Download and sign the auto-debit mandate form. The CSC operator uploads the signed form to the portal.',
        tip: 'Keep a copy of the mandate for your bank records.',
      },
      {
        stepNumber: 4,
        title: 'Receive Kisan Pension Card',
        mode: 'Online & Physical',
        description:
          'The system generates an official Kisan Pension Card displaying your unique 12-digit Pension Account Number (SPAN).',
        tip: 'Laminate and safely preserve your Kisan Pension Card.',
      },
      {
        stepNumber: 5,
        title: 'Receive ₹3,000 Monthly Pension at Age 60',
        mode: 'Online DBT',
        description:
          'Upon attaining 60 years of age, you will receive a guaranteed lifelong monthly pension of ₹3,000 directly into your bank account.',
        tip: 'In the event of the pensioner’s demise, the surviving spouse is entitled to receive 50% family pension (₹1,500/month).',
      },
    ],
    reviewChecklist: [
      'Applicant is between 18 and 40 years of age on date of enrollment.',
      'Cultivable land ownership does not exceed 2 hectares (5 acres).',
      'Applicant is not an income tax payee or member of EPFO/NPS.',
      'Auto-debit bank mandate is signed and linked with an active account.',
    ],
  },
};

/**
 * Storage helpers for document checklist progress.
 * Stores strictly boolean flags ({ [itemId]: boolean }) per scheme.
 * Never stores personal, biometric, financial, or sensitive information.
 */
const CHECKLIST_STORAGE_KEY = 'sahayak_scheme_checklists';

export function loadSchemeChecklistProgress(schemeId) {
  try {
    const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed[schemeId] || {};
  } catch (err) {
    console.error('Failed to load scheme checklist progress:', err);
    return {};
  }
}

export function saveSchemeChecklistProgress(schemeId, progressMap) {
  try {
    const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[schemeId] = progressMap;
    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(parsed));
    return true;
  } catch (err) {
    console.error('Failed to save scheme checklist progress:', err);
    return false;
  }
}

export function resetSchemeChecklistProgress(schemeId) {
  try {
    const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
    if (!raw) return true;
    const parsed = JSON.parse(raw);
    delete parsed[schemeId];
    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(parsed));
    return true;
  } catch (err) {
    console.error('Failed to reset scheme checklist progress:', err);
    return false;
  }
}
