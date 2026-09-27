const crypto = require('node:crypto');
const inquiryModel = require('../models/inquiryModel');
const auditModel = require('../models/auditModel');
const mailer = require('../services/mailer');
const env = require('../config/env');
const cartModel = require('../models/cartModel');
const { packages, addOnCatalog } = require('../config/packages');

function buildCart(packageKey, addOnNames) {
  const selectedPackage = packages[packageKey] || packages.standard;
  const addOns = [...new Set(Array.isArray(addOnNames) ? addOnNames : [])]
    .filter((name) => Object.hasOwn(addOnCatalog, name))
    .map((name) => ({ name, price: addOnCatalog[name].price }));

  return {
    package: selectedPackage,
    packageKey,
    addOns,
    total: selectedPackage.price + addOns.reduce((sum, addOn) => sum + addOn.price, 0)
  };
}

async function renderCheckout(req, res, next) {
  try {
    const storedCart = await cartModel.findCart(req.sessionID);
    const cart = cartModel.toCart(storedCart) || buildCart('standard', []);
    return res.render('page/checkout', { title: 'Checkout', cart, paymentReady: Boolean(env.flutterwave.secretKey), checkout: null });
  } catch (error) { return next(error); }
}

async function addCart(req, res, next) {
  let addOns = [];
  try {
    addOns = Array.isArray(req.body.addons) ? req.body.addons : JSON.parse(req.body.addons || '[]');
  } catch (error) { addOns = []; }
  try {
    const cart = buildCart(req.body.package, addOns);
    await cartModel.saveCart({ sessionId: req.sessionID, cart });
    return res.json({ redirect: '/checkout' });
  } catch (error) { return next(error); }
}

async function startPayment(req, res, next) {
  try {
    const { name, email, company } = req.body;
    const storedCart = await cartModel.findCart(req.sessionID);
    const cart = cartModel.toCart(storedCart);
    if (!cart || !name || !email) {
      return res.status(400).render('page/checkout', {
        title: 'Checkout', cart: cart || buildCart('standard', []), paymentReady: Boolean(env.flutterwave.secretKey),
        checkout: { error: 'Name and email are required to continue.' }
      });
    }
    if (!env.flutterwave.secretKey) {
      return res.status(503).render('page/checkout', {
        title: 'Checkout', cart, paymentReady: false,
        checkout: { error: 'Online payment is not configured yet. Please contact VJU Tech to complete your order.' }
      });
    }

    const txRef = `vjutech-${Date.now()}-${crypto.randomBytes(5).toString('hex')}`;
    await cartModel.saveCart({ sessionId: req.sessionID, cart, customer: { name, email, company }, txRef });
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.flutterwave.secretKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: cart.total,
        currency: env.flutterwave.currency,
        redirect_url: `${env.appUrl}/checkout/complete`,
        payment_options: 'card,banktransfer,ussd,mobilemoney',
        customer: { name, email, phonenumber: '' },
        customizations: { title: 'VJU Tech project package', description: `${cart.package.name} website package`, logo: `${env.appUrl}/images/site/vjutech-logo.png` },
        meta: { company: company || '', package: cart.packageKey, addOns: cart.addOns.map((addOn) => addOn.name) }
      })
    });
    const payment = await response.json();
    if (!response.ok || payment.status !== 'success' || !payment.data?.link) throw new Error(payment.message || 'Flutterwave could not start the payment.');
    return res.redirect(payment.data.link);
  } catch (error) { return next(error); }
}

async function completePayment(req, res, next) {
  try {
    const { status, transaction_id: transactionId, tx_ref: txRef } = req.query;
    const storedCart = await cartModel.findCart(req.sessionID);
    const pending = cartModel.toCart(storedCart);
    if (status !== 'successful' || !transactionId || !pending || pending.txRef !== txRef) {
      return res.render('page/checkout-result', { title: 'Payment not completed', success: false, message: 'The payment was cancelled or could not be matched to this checkout.' });
    }
    if (!env.flutterwave.secretKey) throw new Error('Flutterwave is not configured.');
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`, { headers: { Authorization: `Bearer ${env.flutterwave.secretKey}` } });
    const verification = await response.json();
    const transaction = verification.data;
    const verified = response.ok && verification.status === 'success' && transaction?.status === 'successful' && transaction.tx_ref === pending.txRef && transaction.currency === env.flutterwave.currency && Number(transaction.amount) >= pending.total;
    if (!verified) return res.render('page/checkout-result', { title: 'Payment could not be verified', success: false, message: 'We could not verify this payment. Please contact VJU Tech before trying again.' });

    if (pending.paymentStatus === 'paid') return res.render('page/checkout-result', { title: 'Payment received', success: true, message: 'This payment has already been confirmed. Our team will contact you shortly.' });
    const paidCart = await cartModel.markPaid({ sessionId: req.sessionID, transactionId });
    if (!paidCart) return res.render('page/checkout-result', { title: 'Payment received', success: true, message: 'This payment has already been confirmed. Our team will contact you shortly.' });
    const description = `Paid website package: ${pending.package.name}. Add-ons: ${pending.addOns.map((addOn) => addOn.name).join(', ') || 'None'}. Flutterwave transaction: ${transactionId}`;
    const inquiry = await inquiryModel.createInquiry({ name: pending.customer.name, email: pending.customer.email, company: pending.customer.company, projectDescription: description, budget: pending.total });
    await auditModel.record({ action: 'payment.completed', entityType: 'inquiry', entityId: inquiry.id, metadata: { transactionId, txRef: pending.txRef, amount: pending.total }, req });
    await mailer.send({ to: pending.customer.email, subject: 'VJU Tech payment received', text: `Thanks ${pending.customer.name}. Your payment of ${env.flutterwave.currency} ${pending.total} was received. Our team will contact you shortly.` });
    return res.render('page/checkout-result', { title: 'Payment received', success: true, message: 'Your payment was received and your project request is now with the VJU Tech team.' });
  } catch (error) { return next(error); }
}

module.exports = { addCart, renderCheckout, startPayment, completePayment };
