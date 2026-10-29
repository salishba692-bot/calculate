
function fmt(n){ return 'Rs ' + Math.round(n).toLocaleString('en-PK'); }
function num(id){ var el = document.getElementById(id); return el ? (parseFloat(el.value) || 0) : 0; }
function show(id, html){
  var el = document.getElementById(id);
  el.innerHTML = html;
  el.classList.remove('show');
  void el.offsetWidth;            // animation dobara chalane ke liye
  el.classList.add('show');
}
function onSubmit(formId, fn){
  var f = document.getElementById(formId);
  if (f) f.addEventListener('submit', function(e){ e.preventDefault(); fn(); });
}

/* ---------- Scroll animation: cards, tables, headings dheere se aate hain ---------- */
(function(){
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var items = document.querySelectorAll('main .card, main .tools a, main table, main h2, main details');
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      io.unobserve(en.target);
      en.target.addEventListener('animationend', function(){
        en.target.classList.remove('reveal', 'in');   // hover effects wapas kaam karein
      }, { once: true });
    });
  }, { threshold: 0.12 });
  items.forEach(function(el, i){
    el.classList.add('reveal');
    el.style.animationDelay = ((i % 4) * 0.07) + 's';
    io.observe(el);
  });
})();

/* ---------- 1. Salary tax (Tax Year 2027, FY 2026-27, salaried individuals) ---------- */
// [from, to, fixed tax, rate on excess]
var SLABS = [
  [0, 600000, 0, 0],
  [600000, 1200000, 0, 0.01],
  [1200000, 2200000, 6000, 0.11],
  [2200000, 3200000, 116000, 0.20],
  [3200000, 4100000, 316000, 0.25],
  [4100000, 5600000, 541000, 0.29],
  [5600000, 7000000, 976000, 0.32],
  [7000000, Infinity, 1424000, 0.35]
];
function salaryTax(annual){
  for (var i = 0; i < SLABS.length; i++){
    var s = SLABS[i];
    if (annual <= s[1]) return { tax: s[2] + (annual - s[0]) * s[3], rate: s[3] };
  }
}
onSubmit('salaryForm', function(){
  var amount = num('salary');
  var annual = document.getElementById('period').value === 'monthly' ? amount * 12 : amount;
  if (annual <= 0){ show('result', '<p>Please enter your salary.</p>'); return; }
  var r = salaryTax(annual);
  var monthlyTax = r.tax / 12;
  var effective = (r.tax / annual) * 100;
  show('result',
    '<p>Annual taxable salary: <b>' + fmt(annual) + '</b></p>' +
    '<p>Annual income tax: <span class="big">' + fmt(r.tax) + '</span></p>' +
    '<p>Monthly tax deduction: <b>' + fmt(monthlyTax) + '</b></p>' +
    '<p>Monthly salary after tax: <b>' + fmt(annual / 12 - monthlyTax) + '</b></p>' +
    '<p>Effective tax rate: <b>' + effective.toFixed(2) + '%</b> (your top slab rate: ' + (r.rate * 100) + '%)</p>');
});

/* ---------- 2. Zakat ---------- */
onSubmit('zakatForm', function(){
  var silverRate = num('silverRate');
  if (silverRate <= 0){ show('result', '<p>Please enter the current silver rate per tola (needed for Nisab).</p>'); return; }
  var nisab = 52.5 * silverRate;               // 52.5 tola silver
  var assets = num('cash') + num('goldTola') * num('goldRate') + num('silverTola') * silverRate +
               num('business') + num('receivables');
  var net = assets - num('debts');
  var html = '<p>Nisab (52.5 tola silver): <b>' + fmt(nisab) + '</b></p>' +
             '<p>Your net zakatable wealth: <b>' + fmt(net) + '</b></p>';
  if (net >= nisab){
    html += '<p>Zakat payable (2.5%): <span class="big">' + fmt(net * 0.025) + '</span></p>';
  } else {
    html += '<p><b>Zakat is not obligatory</b> because your wealth is below the Nisab.</p>';
  }
  show('result', html);
});

/* ---------- 3. Loan EMI ---------- */
onSubmit('emiForm', function(){
  var p = num('loan'), yearly = num('rate'), t = num('tenure');
  var n = document.getElementById('unit').value === 'years' ? t * 12 : t;
  if (p <= 0 || n <= 0){ show('result', '<p>Please enter loan amount and tenure.</p>'); return; }
  var r = yearly / 12 / 100;
  var emi = r === 0 ? p / n : p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  var total = emi * n;
  show('result',
    '<p>Monthly EMI: <span class="big">' + fmt(emi) + '</span></p>' +
    '<p>Total payment: <b>' + fmt(total) + '</b></p>' +
    '<p>Total interest / markup: <b>' + fmt(total - p) + '</b></p>');
});

/* ---------- 4. Electricity units ---------- */
var APPLIANCES = [
  ['Ceiling fan', 75, 10], ['LED bulb', 10, 6], ['Inverter AC (1.5 ton, avg)', 900, 8],
  ['Non-inverter AC (1.5 ton)', 1600, 8], ['Refrigerator (avg running)', 150, 12],
  ['LED TV', 100, 4], ['Iron', 1000, 0.5], ['Washing machine', 500, 1],
  ['Water pump / motor', 750, 1], ['Laptop', 60, 5]
];
var applBox = document.getElementById('appliances');
if (applBox){
  var h = '<table><tr><th>Appliance</th><th>Watts</th><th>Qty</th><th>Hours/day</th></tr>';
  APPLIANCES.forEach(function(a, i){
    h += '<tr><td>' + a[0] + '</td>' +
         '<td><input type="number" id="w' + i + '" value="' + a[1] + '" min="0"></td>' +
         '<td><input type="number" id="q' + i + '" value="0" min="0"></td>' +
         '<td><input type="number" id="h' + i + '" value="' + a[2] + '" min="0" step="0.5"></td></tr>';
  });
  applBox.innerHTML = h + '</table>';
}
onSubmit('elecForm', function(){
  var units = 0;
  APPLIANCES.forEach(function(a, i){
    units += num('w' + i) * num('q' + i) * num('h' + i) * 30 / 1000;
  });
  var rate = num('unitRate');
  show('result',
    '<p>Estimated usage: <span class="big">' + units.toFixed(0) + ' units / month</span></p>' +
    '<p>Estimated energy cost: <b>' + fmt(units * rate) + '</b> at Rs ' + rate + ' per unit</p>' +
    '<p class="note">Taxes, fuel adjustment and slab changes on your real bill can make the final amount different.</p>');
});

/* ---------- 5. Percentage ---------- */
onSubmit('pct1', function(){
  show('result1', '<p><span class="big">' + (num('a1') * num('b1') / 100).toLocaleString('en-PK') + '</span></p>');
});
onSubmit('pct2', function(){
  var b = num('b2');
  show('result2', b === 0 ? '<p>Second number cannot be 0.</p>' :
    '<p><span class="big">' + (num('a2') / b * 100).toFixed(2) + '%</span></p>');
});
onSubmit('pct3', function(){
  var o = num('a3');
  if (o === 0){ show('result3', '<p>Old value cannot be 0.</p>'); return; }
  var c = (num('b3') - o) / o * 100;
  show('result3', '<p><span class="big">' + Math.abs(c).toFixed(2) + '% ' + (c >= 0 ? 'increase' : 'decrease') + '</span></p>');
});
