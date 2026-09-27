const packageCards = document.querySelectorAll('[data-package]');
const addons = document.querySelectorAll('[data-addon]');
const total = document.querySelector('#quote-total');
const packageName = document.querySelector('#quote-package');
const summaryPackage = document.querySelector('#summary-package');
const summaryAddons = document.querySelector('#summary-addons');
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