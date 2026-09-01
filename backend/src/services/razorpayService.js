import Razorpay from 'razorpay';
import crypto from 'crypto';

/**
 * Initialize Razorpay instance with Test Mode credentials
 */
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (
    !key_id ||
    !key_secret ||
    key_id === 'rzp_test_YourKeyIdHere' ||
    key_secret === 'YourKeySecretHere'
  ) {
    return null;
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
};

/**
 * Create a Razorpay Order
 * @param {Object} params
 * @param {string} params.invoiceId
 * @param {string} params.invoiceNumber
 * @param {number} params.amountInRupees
 */
export const createOrder = async ({ invoiceId, invoiceNumber, amountInRupees }) => {
  const razorpay = getRazorpayInstance();

  // If Razorpay keys are not configured yet, generate a simulated mock order for college demo testing
  if (!razorpay) {
    const mockOrderId = `order_sim_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    console.log(`💳 [Razorpay Test Mock Order Created]: ${mockOrderId} for ₹${amountInRupees}`);
    return {
      id: mockOrderId,
      amount: Math.round(amountInRupees * 100),
      currency: 'INR',
      receipt: `inv_${invoiceNumber || invoiceId}`,
      status: 'created',
      isSimulated: true,
    };
  }

  const options = {
    amount: Math.round(amountInRupees * 100), // Amount in paise (1 INR = 100 paise)
    currency: 'INR',
    receipt: `inv_${(invoiceNumber || invoiceId).slice(-30)}`,
    notes: {
      invoiceId: invoiceId.toString(),
    },
  };

  const order = await razorpay.orders.create(options);
  return order;
};

/**
 * Verify Razorpay payment signature HMAC SHA256
 * @param {Object} params
 * @param {string} params.orderId
 * @param {string} params.paymentId
 * @param {string} params.signature
 */
export const verifySignature = ({ orderId, paymentId, signature }) => {
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  // If simulated mock order
  if (orderId && orderId.startsWith('order_sim_')) {
    return true;
  }

  if (!key_secret || key_secret === 'YourKeySecretHere') {
    return true;
  }

  const generatedSignature = crypto
    .createHmac('sha256', key_secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
};

export default {
  createOrder,
  verifySignature,
};
