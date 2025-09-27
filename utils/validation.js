const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateGrade = (grade) => {
  return grade >= 1 && grade <= 12;
};

const validateIdNumber = (idNum) => {
  return /^\d{13}$/.test(idNum);
};

const validatePassword = (password) => {
  return password.length >= 6;
};

const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  return input;
};

module.exports = {
  validateEmail,
  validateGrade,
  validateIdNumber,
  validatePassword,
  sanitizeInput
};