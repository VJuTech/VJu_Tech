const packageCards = document.querySelectorAll('[data-package]');
const addons = document.querySelectorAll('[data-addon]');
const total = document.querySelector('#quote-total');
const packageName = document.querySelector('#quote-package');
const summaryPackage = document.querySelector('#summary-package');
const summaryAddons = document.querySelector('#summary-addons');
const checkoutButton = document.querySelector('#checkout-button');
const checkoutStatus = document.querySelector('#checkout-status');
let selectedPackage = document.querySelector('[data-package="standard"]');

function updateQuote() {
  const addonTotal = [...addons].filter((addon) => addon.checked).reduce((sum, addon) => sum + Number(addon.dataset.price), 0);
  const packagePrice = Number(selectedPackage.dataset.price);
  total.textContent = `$${packagePrice + addonTotal}`;
  const name = selectedPackage.dataset.package[0].toUpperCase() + selectedPackage.dataset.package.slice(1);
  packageName.textContent = `${name} package`;
  summaryPackage.textContent = name;
  summaryAddons.textContent = `$${addonTotal}`;
}

packageCards.forEach((card) => card.querySelector('.package-select').addEventListener('click', () => {
  selectedPackage.classList.remove('selected');
  selectedPackage = card;
  selectedPackage.classList.add('selected');
  updateQuote();
}));
addons.forEach((addon) => addon.addEventListener('change', updateQuote));
selectedPackage.classList.add('selected');
updateQuote();

checkoutButton?.addEventListener('click', async () => {
  checkoutButton.disabled = true;
  checkoutButton.classList.add('is-loading');
  if (checkoutStatus) checkoutStatus.textContent = 'Preparing your checkout...';
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
  const selectedAddons = [...addons].filter((addon) => addon.checked).map((addon) => addon.dataset.addon);
  try {
    const response = await fetch('/cart', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({ _csrf: csrfToken || '', package: selectedPackage.dataset.package, addons: JSON.stringify(selectedAddons) })
    });
    if (!response.ok) throw new Error(`Checkout request failed (${response.status}).`);
    const result = await response.json();
    if (!result.redirect) throw new Error('Checkout redirect was not returned.');
    window.location.assign(result.redirect);
  } catch (error) {
    checkoutButton.disabled = false;
    checkoutButton.classList.remove('is-loading');
    if (checkoutStatus) checkoutStatus.textContent = 'We could not open checkout. Please try again.';
    console.error('Unable to open checkout:', error);
  }
});