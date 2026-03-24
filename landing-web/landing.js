(function () {
  const volumeEl = document.getElementById('volume');
  const volumeValueEl = document.getElementById('volume-value');
  const rateEl = document.getElementById('rate');
  const apiCostEl = document.getElementById('api-cost');
  const ownCostEl = document.getElementById('own-cost');
  const savingsEl = document.getElementById('savings');

  function formatNum(n) {
    return n.toLocaleString();
  }

  function formatMoney(n) {
    return '$' + n.toFixed(2);
  }

  function updateCalc() {
    const volume = parseInt(volumeEl.value, 10);
    const rate = parseFloat(rateEl.value);

    volumeValueEl.textContent = formatNum(volume);
    const apiCost = volume * rate;
    apiCostEl.textContent = formatMoney(apiCost);
    ownCostEl.textContent = '$0';
    savingsEl.textContent = formatMoney(apiCost) + '/mo';
  }

  if (volumeEl) volumeEl.addEventListener('input', updateCalc);
  if (rateEl) rateEl.addEventListener('change', updateCalc);
  updateCalc();
})();
