const COMMON_REQUIRED_FIELDS = ['name', 'phone', 'address', 'city', 'state', 'pincode'];

const ROLE_REQUIRED_FIELDS = {
  CUSTOMER: COMMON_REQUIRED_FIELDS,
  BUYER: COMMON_REQUIRED_FIELDS,
  FARMER: [...COMMON_REQUIRED_FIELDS, 'farmName', 'farmPhoto', 'verificationDocument'],
  MANAGER: COMMON_REQUIRED_FIELDS,
  ADMIN: COMMON_REQUIRED_FIELDS,
};

const FIELD_LABELS = {
  name: 'Full Name',
  phone: 'Phone Number',
  address: 'Address',
  city: 'City',
  state: 'State',
  pincode: 'Pincode',
  farmName: 'Farm Name',
  farmPhoto: 'Farm Photo',
  verificationDocument: 'Verification Document',
};

export const resolvePrimaryRole = (roles = []) => {
  const roleList = Array.isArray(roles) ? roles : [];

  if (roleList.includes('ADMIN')) return 'ADMIN';
  if (roleList.includes('MANAGER')) return 'MANAGER';
  if (roleList.includes('FARMER')) return 'FARMER';
  if (roleList.includes('CUSTOMER')) return 'CUSTOMER';
  if (roleList.includes('BUYER')) return 'BUYER';

  return 'CUSTOMER';
};

export const getProfileEndpointForRole = (role) => {
  if (role === 'FARMER') return '/profiles/farmer';
  if (role === 'MANAGER') return '/profiles/manager';
  return '/profiles/customer';
};

export const getRequiredFieldsForRole = (role) => {
  return ROLE_REQUIRED_FIELDS[role] || COMMON_REQUIRED_FIELDS;
};

export const getFieldLabel = (fieldName) => {
  return FIELD_LABELS[fieldName] || fieldName;
};

const hasValue = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value);
};

export const calculateProfileCompletion = (profileData = {}, role = 'CUSTOMER') => {
  const requiredFields = getRequiredFieldsForRole(role);

  const filledFields = requiredFields.filter((field) => hasValue(profileData[field]));
  const missingFields = requiredFields.filter((field) => !hasValue(profileData[field]));

  const percentage = requiredFields.length
    ? Math.round((filledFields.length / requiredFields.length) * 100)
    : 100;

  const isComplete = Boolean(profileData.profileComplete) || missingFields.length === 0;

  return {
    role,
    percentage: isComplete ? 100 : percentage,
    totalFields: requiredFields.length,
    filledFields: filledFields.length,
    missingFields,
    isComplete,
  };
};
