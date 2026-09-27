const packageCards = [...document.querySelectorAll('[data-package-card]')];
const packageAddons = [...document.querySelectorAll('[data-package-addon]')];
const checkoutButton = document.querySelector('#packages-checkout');
const statusMessage = document.querySelector('#packages-status');
let selectedPackage = document.querySelector('[data-package-card].featured') || packageCards[0];

function updateEstimate() {
  const addOnTotal = packageAddons.filter((addon) => addon.checked).reduce((total, addon) => total + Number(addon.dataset.price), 0);
  const total = Number(selectedPackage.dataset.price) + addOnTotal;
  packageCards.forEach((card) => card.classList.toggle('is-selected', card === selectedPackage));
  document.querySelector('#packages-total').textContent = `$${total}`;
  document.querySelector('#packages-selection').textContent = `${selectedPackage.querySelector('.package-label').textContent} package`;
  document.querySelector('#packages-package-name').textContent = selectedPackage.querySelector('.package-label').textContent;
  document.querySelector('#packages-addons-total').textContent = `$${addOnTotal}`;
}

packageCards.forEach((card) => card.querySelector('.package-choice').addEventListener('click', () => { selectedPackage = card; updateEstimate(); }));
packageAddons.forEach((addon) => addon.addEventListener('change', updateEstimate));
checkoutButton?.addEventListener('click', async () => {
  checkoutButton.disabled = true;
  if (statusMessage) statusMessage.textContent = 'Preparing your checkout...';
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
  const selectedAddons = packageAddons.filter((addon) => addon.checked).map((addon) => addon.value);
  try {
    const response = await fetch('/cart', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: new URLSearchParams({ _csrf: csrfToken || '', package: selectedPackage.dataset.package, addons: JSON.stringify(selectedAddons) }) });
    if (!response.ok) throw new Error(`Checkout request failed (${response.status}).`);
    const result = await response.json();
    if (!result.redirect) throw new Error('Checkout redirect was not returned.');
    window.location.assign(result.redirect);
  } catch (error) {
    checkoutButton.disabled = false;
    if (statusMessage) statusMessage.textContent = 'We could not open checkout. Please try again.';
    console.error('Unable to open checkout:', error);
  }
});

updateEstimate();