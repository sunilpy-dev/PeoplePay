/**
 * Standard Indian Rupee (₹) Currency Formatter with Indian Numbering System
 * e.g., ₹50,000.00, ₹1,00,000.00, ₹12,50,000.00
 */
export const formatCurrency = (amount) => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(isNaN(num) ? 0 : num);
};

export const formatDeduction = (amount) => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount || 0);
  const absVal = Math.abs(isNaN(num) ? 0 : num);
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absVal);
  return `-${formatted}`;
};