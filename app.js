// ACENEEV CAPITAL - Official Interactive Core Engine
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  initLiveMarketData();
  initCalculator();
  initModal();
  initContactForm();
  initMobileNav();
  initStatsCounter();
});

/* ==========================================================================
   1. Real-Time Live Market Data (Binance Live WebSocket + Exness Benchmarks)
   ========================================================================== */
const marketItems = [
  { symbol: 'BTC/USDT', name: 'Bitcoin (Binance)', price: 67920.00, change: 2.65, prefix: '$', isCrypto: true, stream: 'btcusdt@ticker' },
  { symbol: 'ETH/USDT', name: 'Ethereum (Binance)', price: 3510.40, change: 1.84, prefix: '$', isCrypto: true, stream: 'ethusdt@ticker' },
  { symbol: 'SOL/USDT', name: 'Solana (Binance)', price: 174.20, change: 4.15, prefix: '$', isCrypto: true, stream: 'solusdt@ticker' },
  { symbol: 'BNB/USDT', name: 'BNB (Binance)', price: 590.10, change: 1.22, prefix: '$', isCrypto: true, stream: 'bnbusdt@ticker' },
  { symbol: 'GOLD (XAU/USD)', name: 'Exness Spot', price: 2686.40, change: 0.58, prefix: '$', isCrypto: false },
  { symbol: 'EUR/USD', name: 'Forex Spot', price: 1.0855, change: 0.14, prefix: '$', isCrypto: false, decimals: 4 },
  { symbol: 'USD/INR', name: 'Forex (Exness)', price: 86.44, change: 0.06, prefix: '₹', isCrypto: false, decimals: 2 },
  { symbol: 'NIFTY 50', name: 'NSE Index', price: 25375.80, change: 0.62, prefix: '₹', isCrypto: false }
];

function initLiveMarketData() {
  const tickerTrack = document.getElementById('ticker-track');
  if (!tickerTrack) return;

  function renderTicker() {
    const fullList = [...marketItems, ...marketItems];
    tickerTrack.innerHTML = fullList.map((item, idx) => {
      const isPositive = item.change >= 0;
      const changeClass = isPositive ? 'text-emerald-400' : 'text-rose-400';
      const bgChange = isPositive ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30';
      const sign = isPositive ? '+' : '';
      const decimals = item.decimals !== undefined ? item.decimals : 2;
      const formattedPrice = item.price.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });

      return `
        <div class="inline-flex items-center space-x-3 px-5 py-2 border-r border-slate-800/80 text-xs font-mono ticker-item" data-index="${idx % marketItems.length}">
          <span class="font-bold text-slate-200">${item.symbol}</span>
          <span class="text-slate-500 text-[10px] hidden sm:inline">(${item.name})</span>
          <span class="font-semibold text-white ticker-price">${item.prefix}${formattedPrice}</span>
          <span class="px-1.5 py-0.5 rounded text-[10px] font-bold border ${changeClass} ${bgChange} ticker-change">
            ${sign}${item.change.toFixed(2)}%
          </span>
        </div>
      `;
    }).join('');
  }

  renderTicker();

  function updateItemInDOM(index, flashColor = true) {
    const item = marketItems[index];
    const targetEls = tickerTrack.querySelectorAll(`.ticker-item[data-index="${index}"]`);
    const decimals = item.decimals !== undefined ? item.decimals : 2;
    const formatted = `${item.prefix}${item.price.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
    const isPositive = item.change >= 0;
    const sign = isPositive ? '+' : '';

    targetEls.forEach(el => {
      const priceEl = el.querySelector('.ticker-price');
      if (priceEl) {
        priceEl.textContent = formatted;
        if (flashColor) {
          priceEl.classList.add('text-emerald-300');
          setTimeout(() => priceEl.classList.remove('text-emerald-300'), 500);
        }
      }
      const changeEl = el.querySelector('.ticker-change');
      if (changeEl) {
        changeEl.textContent = `${sign}${item.change.toFixed(2)}%`;
        changeEl.className = `px-1.5 py-0.5 rounded text-[10px] font-bold border ticker-change ${isPositive ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-rose-400 bg-rose-500/10 border-rose-500/30'}`;
      }
    });
  }

  // 1. Live Binance WebSocket Stream (Real-Time Live Exchange Data)
  function connectBinanceWebSocket() {
    try {
      const streams = marketItems.filter(i => i.isCrypto).map(i => i.stream).join('/');
      const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streams}`);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.s) {
            const sym = data.s; // e.g. BTCUSDT
            const itemIndex = marketItems.findIndex(i => i.stream && i.stream.startsWith(sym.toLowerCase()));
            if (itemIndex !== -1) {
              const currentPrice = parseFloat(data.c);
              const priceChange = parseFloat(data.P);
              marketItems[itemIndex].price = currentPrice;
              marketItems[itemIndex].change = priceChange;
              updateItemInDOM(itemIndex, true);
            }
          }
        } catch (err) {}
      };

      ws.onerror = () => {
        // If WebSocket fails (firewall/offline), fallback to REST API polling
        fallbackBinanceREST();
      };

      ws.onclose = () => {
        // Reconnect after 5 seconds
        setTimeout(connectBinanceWebSocket, 5000);
      };
    } catch (e) {
      fallbackBinanceREST();
    }
  }

  // 2. Fallback REST API for Crypto
  async function fallbackBinanceREST() {
    try {
      const res = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT"]');
      if (!res.ok) return;
      const tickers = await res.json();
      tickers.forEach(t => {
        const idx = marketItems.findIndex(i => i.stream && i.stream.startsWith(t.symbol.toLowerCase()));
        if (idx !== -1) {
          marketItems[idx].price = parseFloat(t.lastPrice);
          marketItems[idx].change = parseFloat(t.priceChangePercent);
          updateItemInDOM(idx, false);
        }
      });
    } catch (e) {}
  }

  // Start live WebSocket stream
  connectBinanceWebSocket();
  // Also poll REST every 15s as backup
  setInterval(fallbackBinanceREST, 15000);

  // 3. Live Ticks for Gold & Forex (Exness Spot emulation)
  setInterval(() => {
    const fxIndices = [4, 5, 6, 7];
    const randomIndex = fxIndices[Math.floor(Math.random() * fxIndices.length)];
    const item = marketItems[randomIndex];
    const microMove = (Math.random() * 0.04 - 0.019) / 100;
    item.price += item.price * microMove;
    updateItemInDOM(randomIndex, true);
  }, 2200);
}

/* ==========================================================================
   2. Professional Return Calculator (1% Low Risk & 3% Moderate Risk)
   ========================================================================== */
let weeklyChart = null;

const riskPrograms = {
  low: {
    id: 'low',
    name: 'Low Risk — Capital Preservation',
    weeklyRate: 0.01, // 1% weekly target (~4% monthly)
    ratePercent: 1.0,
    rateDisplay: '1% / week',
    monthlyTarget: '~4% Monthly',
    badgeClass: 'border-slate-500 bg-slate-800 text-slate-200',
    description: 'Disciplined equity allocation and hedged Indian share market strategies engineered for steady capital defense.'
  },
  moderate: {
    id: 'moderate',
    name: 'Moderate Risk — Active Alpha Growth',
    weeklyRate: 0.03, // 3% weekly target (~12% monthly)
    ratePercent: 3.0,
    rateDisplay: '3% / week',
    monthlyTarget: '~12% Monthly',
    badgeClass: 'border-white bg-white text-black',
    description: 'High-liquidity Global Forex and Cryptocurrency asset management targeting calculated, high-conviction compounding.'
  }
};

let currentRiskTier = 'moderate'; // Default to 3% Moderate Risk
let currentDurationWeeks = 12;     // Default 12 weeks (3 months)

function initCalculator() {
  const capitalSlider = document.getElementById('calc-capital');
  const capitalDisplay = document.getElementById('calc-capital-val');

  const resultWeekly = document.getElementById('result-weekly-return');
  const resultMonthly = document.getElementById('result-monthly-return');
  const resultCorpus = document.getElementById('result-projected-corpus');
  const resultGain = document.getElementById('result-net-gain');
  const programDesc = document.getElementById('calc-program-desc');
  const programBadge = document.getElementById('calc-program-badge');
  const rateTitle = document.getElementById('calc-rate-title');

  const riskTierBtns = document.querySelectorAll('.risk-tier-btn');
  const durationBtns = document.querySelectorAll('.duration-btn');
  const presetBtns = document.querySelectorAll('.capital-preset-btn');

  function formatINR(val) {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    } else if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} Lakh`;
    } else {
      return `₹${Math.round(val).toLocaleString('en-IN')}`;
    }
  }

  function calculate() {
    const capital = parseFloat(capitalSlider.value) || 100000;
    const prog = riskPrograms[currentRiskTier];
    const wRate = prog.weeklyRate; // exactly 0.01 or 0.03

    // Returns
    const weeklyReturn = capital * wRate;
    const monthlyReturn = weeklyReturn * 4;

    // Compounded future value over selected duration
    const weeks = currentDurationWeeks;
    const projectedCorpus = capital * Math.pow(1 + wRate, weeks);
    const netGain = Math.max(0, projectedCorpus - capital);

    // Update Text UI
    capitalDisplay.textContent = formatINR(capital);
    if (rateTitle) rateTitle.textContent = `${prog.ratePercent}% Return Per Week`;

    if (resultWeekly) resultWeekly.textContent = formatINR(weeklyReturn);
    if (resultMonthly) resultMonthly.textContent = formatINR(monthlyReturn);
    if (resultCorpus) resultCorpus.textContent = formatINR(projectedCorpus);
    if (resultGain) resultGain.textContent = `+${formatINR(netGain)} Net Return`;

    if (programDesc) {
      programDesc.textContent = prog.description;
    }
    if (programBadge) {
      programBadge.textContent = `${prog.name} (${prog.rateDisplay})`;
    }

    // Update preset button active states
    presetBtns.forEach(btn => {
      const val = parseFloat(btn.dataset.val);
      if (val === capital) {
        btn.classList.add('active', 'border-white', 'bg-white/20', 'text-white');
        btn.classList.remove('border-slate-800', 'bg-slate-900', 'text-slate-400');
      } else {
        btn.classList.remove('active', 'border-white', 'bg-white/20', 'text-white');
        btn.classList.add('border-slate-800', 'bg-slate-900', 'text-slate-400');
      }
    });

    updateWeeklyChart(capital, wRate, weeks);
  }

  // Risk tier switch (Low Risk: 1% | Moderate Risk: 3%)
  riskTierBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      riskTierBtns.forEach(b => {
        b.classList.remove('active-tier', 'border-white', 'bg-white', 'text-black');
        b.classList.add('border-slate-700/80', 'bg-slate-900/60', 'text-slate-300');
      });
      btn.classList.add('active-tier', 'border-white', 'bg-white', 'text-black');
      btn.classList.remove('border-slate-700/80', 'bg-slate-900/60', 'text-slate-300');

      currentRiskTier = btn.dataset.tier;
      calculate();
    });
  });

  // Capital presets
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      capitalSlider.value = btn.dataset.val;
      calculate();
    });
  });

  // Duration buttons
  durationBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      durationBtns.forEach(b => {
        b.classList.remove('bg-white', 'text-black', 'font-bold');
        b.classList.add('bg-slate-800/80', 'text-slate-300');
      });
      btn.classList.add('bg-white', 'text-black', 'font-bold');
      btn.classList.remove('bg-slate-800/80', 'text-slate-300');
      currentDurationWeeks = parseInt(btn.dataset.weeks);
      calculate();
    });
  });

  capitalSlider.addEventListener('input', calculate);

  initWeeklyChart();
  calculate();
}

function initWeeklyChart() {
  const ctx = document.getElementById('weeklyChart');
  if (!ctx || !window.Chart) return;

  weeklyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Compounded Corpus',
          data: [],
          borderColor: '#ffffff',
          backgroundColor: 'rgba(255, 255, 255, 0.12)',
          fill: true,
          tension: 0.3,
          borderWidth: 2.5,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#09090b',
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'Principal Capital',
          data: [],
          borderColor: '#52525b',
          backgroundColor: 'transparent',
          borderDash: [4, 4],
          borderWidth: 1.5,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#e4e4e7',
            font: { family: 'Plus Jakarta Sans', size: 11 }
          }
        },
        tooltip: {
          backgroundColor: '#18181b',
          titleColor: '#ffffff',
          bodyColor: '#e4e4e7',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: function(context) {
              const val = context.raw;
              if (val >= 10000000) return `${context.dataset.label}: ₹${(val / 10000000).toFixed(2)} Cr`;
              if (val >= 100000) return `${context.dataset.label}: ₹${(val / 100000).toFixed(2)} Lakh`;
              return `${context.dataset.label}: ₹${Math.round(val).toLocaleString('en-IN')}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#a1a1aa', font: { family: 'Plus Jakarta Sans' } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: {
            color: '#a1a1aa',
            font: { family: 'Plus Jakarta Sans' },
            callback: function(value) {
              if (value >= 10000000) return '₹' + (value / 10000000).toFixed(1) + ' Cr';
              if (value >= 100000) return '₹' + (value / 100000).toFixed(0) + ' L';
              return '₹' + value;
            }
          }
        }
      }
    }
  });
}

function updateWeeklyChart(capital, wRate, weeks) {
  if (!weeklyChart) return;

  const labels = [];
  const corpusData = [];
  const principalData = [];

  const step = weeks <= 12 ? 1 : (weeks <= 26 ? 2 : 4);

  for (let w = 0; w <= weeks; w += step) {
    labels.push(w === 0 ? 'Start' : `Wk ${w}`);
    principalData.push(capital);
    const val = capital * Math.pow(1 + wRate, w);
    corpusData.push(Math.round(val));
  }

  if ((weeks % step) !== 0) {
    labels.push(`Wk ${weeks}`);
    principalData.push(capital);
    corpusData.push(Math.round(capital * Math.pow(1 + wRate, weeks)));
  }

  weeklyChart.data.labels = labels;
  weeklyChart.data.datasets[0].data = corpusData;
  weeklyChart.data.datasets[1].data = principalData;
  weeklyChart.update();
}

/* ==========================================================================
   3. Consultation Booking Modal & Email Dispatch
   ========================================================================== */
function initModal() {
  const modal = document.getElementById('booking-modal');
  const openButtons = document.querySelectorAll('[data-open-modal="booking"]');
  const closeButtons = document.querySelectorAll('[data-close-modal]');
  const bookingForm = document.getElementById('booking-modal-form');

  if (!modal) return;

  function openModal() {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }

  openButtons.forEach(btn => btn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  }));

  closeButtons.forEach(btn => btn.addEventListener('click', closeModal));

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
  });

  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('modal-name')?.value.trim() || 'Investor';
      const email = document.getElementById('modal-email')?.value.trim() || '';
      const phone = document.getElementById('modal-phone')?.value.trim() || 'Not provided';
      const service = document.getElementById('modal-service')?.value || 'Advisory Program';
      const capital = document.getElementById('modal-capital')?.value || '₹1 Lakh - ₹5 Lakh';
      const notes = document.getElementById('modal-notes')?.value.trim() || 'Consultation request for custom plan.';

      const mailSubject = encodeURIComponent(`Consultation Request: ${name} (${capital})`);
      const mailBody = encodeURIComponent(
        `Hello AceNeev Capital,\n\nI would like to schedule an advisory consultation.\n\n` +
        `• Name: ${name}\n` +
        `• Email: ${email}\n` +
        `• Contact Phone/WhatsApp: ${phone}\n` +
        `• Program: ${service}\n` +
        `• Planned Capital: ${capital}\n` +
        `• Details: ${notes}\n\n` +
        `Kindly review and get in touch.\n`
      );

      const mailUrl = `mailto:aceneevcapital@gmail.com?subject=${mailSubject}&body=${mailBody}`;

      closeModal();
      showToast(`Thank you, ${name}! Opening your email client to send your consultation request to aceneevcapital@gmail.com...`, 'success');

      setTimeout(() => {
        window.location.href = mailUrl;
      }, 1000);

      bookingForm.reset();
    });
  }
}

/* ==========================================================================
   4. Contact Form Handler (Direct Email Dispatch with Phone Option)
   ========================================================================== */
function initContactForm() {
  const contactForm = document.getElementById('contact-form');
  if (!contactForm) return;

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('contact-name')?.value.trim() || 'Investor';
    const email = document.getElementById('contact-email')?.value.trim() || '';
    const phone = document.getElementById('contact-phone')?.value.trim() || 'Not provided';
    const program = document.getElementById('contact-service')?.value || 'Advisory Program';
    const capital = document.getElementById('contact-capital')?.value || '₹1 Lakh+';
    const message = document.getElementById('contact-message')?.value.trim() || 'Please share details on how to get started.';

    const mailSubject = encodeURIComponent(`Website Consultation Enquiry: ${name} (${capital})`);
    const mailBody = encodeURIComponent(
      `Hello AceNeev Capital Team,\n\n` +
      `New consultation enquiry from website:\n\n` +
      `• Investor Name: ${name}\n` +
      `• Contact Email: ${email}\n` +
      `• Contact Phone/WhatsApp: ${phone}\n` +
      `• Program: ${program}\n` +
      `• Capital Budget: ${capital}\n` +
      `• Notes/Goals: ${message}\n\n` +
      `Kindly revert with advisory details.\n`
    );

    const mailUrl = `mailto:aceneevcapital@gmail.com?subject=${mailSubject}&body=${mailBody}`;

    showToast(`Thank you, ${name}! Opening your email client to send your enquiry directly to aceneevcapital@gmail.com...`, 'success');

    setTimeout(() => {
      window.location.href = mailUrl;
    }, 1000);

    contactForm.reset();
  });
}

/* ==========================================================================
   5. Mobile Navigation Drawer
   ========================================================================== */
function initMobileNav() {
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const navLinks = document.querySelectorAll('.mobile-nav-link');

  if (!mobileToggle || !mobileMenu) return;

  mobileToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
  });

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
    });
  });
}

/* ==========================================================================
   6. Stats Counter
   ========================================================================== */
function initStatsCounter() {
  const counters = document.querySelectorAll('.counter-stat');
  let started = false;

  function countUp() {
    counters.forEach(counter => {
      const target = parseFloat(counter.getAttribute('data-target'));
      const prefix = counter.getAttribute('data-prefix') || '';
      const suffix = counter.getAttribute('data-suffix') || '';
      const duration = 1600;
      const startTime = performance.now();

      function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentVal = target * easeProgress;

        if (target % 1 !== 0) {
          counter.textContent = `${prefix}${currentVal.toFixed(1)}${suffix}`;
        } else {
          counter.textContent = `${prefix}${Math.floor(currentVal)}${suffix}`;
        }

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          counter.textContent = `${prefix}${target}${suffix}`;
        }
      }
      requestAnimationFrame(update);
    });
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !started) {
        started = true;
        countUp();
      }
    });
  }, { threshold: 0.25 });

  const statsSection = document.getElementById('stats-section');
  if (statsSection) observer.observe(statsSection);
}

/* ==========================================================================
   7. Toast Notification System
   ========================================================================== */
function showToast(message, type = 'success') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed bottom-6 right-6 z-50 flex flex-col space-y-3 max-w-md pointer-events-none';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `p-4 rounded-2xl border pointer-events-auto shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-y-4 opacity-0 flex items-start space-x-3 text-sm font-medium bg-zinc-900/95 border-zinc-700 text-white`;

  const iconSvg = `<svg class="w-5 h-5 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;

  toast.innerHTML = `
    ${iconSvg}
    <div class="flex-1 leading-snug text-zinc-200">${message}</div>
  `;

  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-4');
    setTimeout(() => toast.remove(), 400);
  }, 4500);
}
