// ACENEEV CAPITAL - Official Interactive Core Engine
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  initTheme();
  initTicker();
  initCalculator();
  initModal();
  initContactForm();
  initMobileNav();
  initStatsCounter();
});

/* ==========================================================================
   1. Theme Toggle (Dark / Light)
   ========================================================================== */
function initTheme() {
  const themeToggleBtn = document.getElementById('theme-toggle');
  const themeToggleMobileBtn = document.getElementById('theme-toggle-mobile');
  const html = document.documentElement;

  const savedTheme = localStorage.getItem('aceneev_theme') || 'dark';
  applyTheme(savedTheme);

  function applyTheme(theme) {
    if (theme === 'light') {
      html.classList.add('light');
      html.classList.remove('dark');
    } else {
      html.classList.add('dark');
      html.classList.remove('light');
    }
    localStorage.setItem('aceneev_theme', theme);
    if (window.weeklyChart) {
      updateChartTheme(theme);
    }
  }

  function toggle() {
    const current = html.classList.contains('light') ? 'light' : 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
  }

  if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggle);
  if (themeToggleMobileBtn) themeToggleMobileBtn.addEventListener('click', toggle);
}

/* ==========================================================================
   2. Real-Time Market Ticker (Binance Live API + Exness Benchmarks)
   ========================================================================== */
const marketItems = [
  { symbol: 'BTC/USDT', name: 'Bitcoin (Binance)', price: 67850.00, change: 2.84, prefix: '$', isCrypto: true, binanceSym: 'BTCUSDT' },
  { symbol: 'ETH/USDT', name: 'Ethereum (Binance)', price: 3490.50, change: 1.95, prefix: '$', isCrypto: true, binanceSym: 'ETHUSDT' },
  { symbol: 'SOL/USDT', name: 'Solana (Binance)', price: 172.40, change: 4.60, prefix: '$', isCrypto: true, binanceSym: 'SOLUSDT' },
  { symbol: 'BNB/USDT', name: 'BNB (Binance)', price: 588.20, change: 1.45, prefix: '$', isCrypto: true, binanceSym: 'BNBUSDT' },
  { symbol: 'GOLD (XAU/USD)', name: 'Exness Spot', price: 2684.50, change: 0.62, prefix: '$', isCrypto: false },
  { symbol: 'EUR/USD', name: 'Forex Spot', price: 1.0865, change: 0.18, prefix: '$', isCrypto: false, decimals: 4 },
  { symbol: 'USD/INR', name: 'Forex (Exness)', price: 86.42, change: 0.08, prefix: '₹', isCrypto: false, decimals: 2 },
  { symbol: 'NIFTY 50', name: 'NSE Index', price: 25360.20, change: 0.65, prefix: '₹', isCrypto: false }
];

function initTicker() {
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
          <span class="px-1.5 py-0.5 rounded text-[10px] font-bold border ${changeClass} ${bgChange}">
            ${sign}${item.change.toFixed(2)}%
          </span>
        </div>
      `;
    }).join('');
  }

  renderTicker();

  // 1. Fetch live Crypto prices from Binance Public API
  async function fetchBinancePrices() {
    try {
      const cryptoSymbols = marketItems.filter(i => i.isCrypto).map(i => `"${i.binanceSym}"`).join(',');
      const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=[${cryptoSymbols}]`);
      if (!res.ok) return;
      const data = await res.json();
      
      data.forEach(ticker => {
        const item = marketItems.find(i => i.binanceSym === ticker.symbol);
        if (item) {
          item.price = parseFloat(ticker.lastPrice);
          item.change = parseFloat(ticker.priceChangePercent);
        }
      });
      updateTickerDOM();
    } catch (e) {
      // Offline fallback: graceful silent handling
    }
  }

  function updateTickerDOM() {
    marketItems.forEach((item, idx) => {
      const targetEls = tickerTrack.querySelectorAll(`.ticker-item[data-index="${idx}"]`);
      const decimals = item.decimals !== undefined ? item.decimals : 2;
      const formatted = `${item.prefix}${item.price.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
      const isPositive = item.change >= 0;
      const sign = isPositive ? '+' : '';

      targetEls.forEach(el => {
        const priceEl = el.querySelector('.ticker-price');
        if (priceEl) priceEl.textContent = formatted;
        const changeEl = el.querySelector('span:last-child');
        if (changeEl) {
          changeEl.textContent = `${sign}${item.change.toFixed(2)}%`;
          changeEl.className = `px-1.5 py-0.5 rounded text-[10px] font-bold border ${isPositive ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-rose-400 bg-rose-500/10 border-rose-500/30'}`;
        }
      });
    });
  }

  // Attempt initial live Binance fetch
  fetchBinancePrices();
  // Poll Binance every 12 seconds when online
  setInterval(fetchBinancePrices, 12000);

  // Subtle live tick simulation for Forex & Gold
  setInterval(() => {
    const nonCryptoIndices = [4, 5, 6, 7];
    const randomIndex = nonCryptoIndices[Math.floor(Math.random() * nonCryptoIndices.length)];
    const item = marketItems[randomIndex];
    const fluctuationPercent = (Math.random() * 0.08 - 0.038) / 100;
    item.price += item.price * fluctuationPercent;

    const targetElements = tickerTrack.querySelectorAll(`.ticker-item[data-index="${randomIndex}"]`);
    const decimals = item.decimals !== undefined ? item.decimals : 2;
    targetElements.forEach(el => {
      const priceEl = el.querySelector('.ticker-price');
      if (priceEl) {
        priceEl.textContent = `${item.prefix}${item.price.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
      }
    });
  }, 2800);
}

/* ==========================================================================
   3. Simplified Return Calculator (2-3% Weekly Return Model, From ₹1 Lakh)
   ========================================================================== */
let weeklyChart = null;

const riskPrograms = {
  low: {
    id: 'low',
    name: 'Low Risk — Indian Share Market & Equities',
    shortName: 'Low Risk (Equities)',
    weeklyRate: 0.01, // 1% weekly target (~4% monthly)
    rateDisplay: '0.75% – 1% / week',
    badgeClass: 'badge-low-risk',
    tag: 'Capital Preservation',
    description: 'Disciplined blue-chip equity allocation, low-volatility swing positioning, and defensive market hedges.'
  },
  medium: {
    id: 'medium',
    name: 'Moderate Risk — Crypto Asset Management',
    shortName: 'Moderate Risk (Crypto)',
    weeklyRate: 0.02, // 2% weekly target (~8% monthly)
    rateDisplay: '1.5% – 2% / week',
    badgeClass: 'badge-mid-risk',
    tag: 'Strategic Alpha',
    description: 'High-conviction digital assets (Bitcoin, Ethereum) managed with multi-sig safety and cycle momentum.'
  },
  high: {
    id: 'high',
    name: 'High Risk — F&O (Derivatives) & Forex',
    shortName: 'High Risk (F&O & Forex)',
    weeklyRate: 0.025, // 2.5% weekly target (2-3% range, ~10-12% monthly)
    rateDisplay: '2% – 3% / week',
    badgeClass: 'badge-high-risk',
    tag: 'Maximum Alpha',
    description: 'Quantitative derivatives execution in NSE F&O and high-liquidity global Forex pairs with strict stop-losses.'
  }
};

let currentRiskTier = 'high'; // Default high risk highlighting 2-3% per week
let currentDurationWeeks = 12; // Default 12 weeks (3 months)

function initCalculator() {
  const capitalSlider = document.getElementById('calc-capital');
  const capitalDisplay = document.getElementById('calc-capital-val');
  const weeklyRateSlider = document.getElementById('calc-rate');
  const weeklyRateDisplay = document.getElementById('calc-rate-val');

  const resultWeekly = document.getElementById('result-weekly-return');
  const resultMonthly = document.getElementById('result-monthly-return');
  const resultCorpus = document.getElementById('result-projected-corpus');
  const resultGain = document.getElementById('result-net-gain');
  const programDesc = document.getElementById('calc-program-desc');
  const programBadge = document.getElementById('calc-program-badge');

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
    const weeklyRatePercent = parseFloat(weeklyRateSlider.value) || 2.5;
    const wRate = weeklyRatePercent / 100;

    // Simple weekly returns
    const weeklyReturn = capital * wRate;
    const monthlyReturn = weeklyReturn * 4;

    // Compounded future value over selected duration
    const weeks = currentDurationWeeks;
    const projectedCorpus = capital * Math.pow(1 + wRate, weeks);
    const netGain = Math.max(0, projectedCorpus - capital);

    // Update Text UI
    capitalDisplay.textContent = formatINR(capital);
    weeklyRateDisplay.textContent = `${weeklyRatePercent.toFixed(1)}% / week`;

    if (resultWeekly) resultWeekly.textContent = formatINR(weeklyReturn);
    if (resultMonthly) resultMonthly.textContent = formatINR(monthlyReturn);
    if (resultCorpus) resultCorpus.textContent = formatINR(projectedCorpus);
    if (resultGain) resultGain.textContent = `+${formatINR(netGain)} Net Return`;

    if (programDesc) {
      programDesc.textContent = riskPrograms[currentRiskTier].description;
    }
    if (programBadge) {
      programBadge.textContent = riskPrograms[currentRiskTier].name;
      programBadge.className = `inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-bold ${riskPrograms[currentRiskTier].badgeClass}`;
    }

    // Update preset button active states
    presetBtns.forEach(btn => {
      const val = parseFloat(btn.dataset.val);
      if (val === capital) {
        btn.classList.add('active', 'border-emerald-500', 'bg-emerald-500/20', 'text-emerald-300');
        btn.classList.remove('border-slate-800', 'bg-slate-900', 'text-slate-400');
      } else {
        btn.classList.remove('active', 'border-emerald-500', 'bg-emerald-500/20', 'text-emerald-300');
        btn.classList.add('border-slate-800', 'bg-slate-900', 'text-slate-400');
      }
    });

    updateWeeklyChart(capital, wRate, weeks);
  }

  // Risk tier switch
  riskTierBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      riskTierBtns.forEach(b => {
        b.classList.remove('active-tier', 'border-emerald-500', 'bg-slate-800', 'text-white');
        b.classList.add('border-slate-700/80', 'bg-slate-900/60', 'text-slate-400');
      });
      btn.classList.add('active-tier', 'border-emerald-500', 'bg-slate-800', 'text-white');
      btn.classList.remove('border-slate-700/80', 'bg-slate-900/60', 'text-slate-400');

      currentRiskTier = btn.dataset.tier;
      const prog = riskPrograms[currentRiskTier];
      weeklyRateSlider.value = (prog.weeklyRate * 100).toFixed(1);
      calculate();
    });
  });

  // Capital preset clicks
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      capitalSlider.value = btn.dataset.val;
      calculate();
    });
  });

  // Duration button clicks
  durationBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      durationBtns.forEach(b => {
        b.classList.remove('bg-emerald-500', 'text-slate-950', 'font-bold');
        b.classList.add('bg-slate-800/80', 'text-slate-300');
      });
      btn.classList.add('bg-emerald-500', 'text-slate-950', 'font-bold');
      btn.classList.remove('bg-slate-800/80', 'text-slate-300');
      currentDurationWeeks = parseInt(btn.dataset.weeks);
      calculate();
    });
  });

  // Slider change listeners
  capitalSlider.addEventListener('input', calculate);
  weeklyRateSlider.addEventListener('input', calculate);

  initWeeklyChart();
  calculate();
}

function initWeeklyChart() {
  const ctx = document.getElementById('weeklyChart');
  if (!ctx || !window.Chart) return;

  const isLight = document.documentElement.classList.contains('light');

  weeklyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Compounded Capital',
          data: [],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          fill: true,
          tension: 0.3,
          borderWidth: 3,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#ffffff',
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'Initial Principal',
          data: [],
          borderColor: '#64748b',
          backgroundColor: 'transparent',
          borderDash: [4, 4],
          borderWidth: 2,
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
            color: isLight ? '#334155' : '#cbd5e1',
            font: { family: 'Plus Jakarta Sans', size: 12 }
          }
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleColor: '#ffffff',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(16, 185, 129, 0.4)',
          borderWidth: 1,
          padding: 12,
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
          grid: {
            color: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255, 255, 255, 0.06)'
          },
          ticks: {
            color: isLight ? '#64748b' : '#94a3b8',
            font: { family: 'Plus Jakarta Sans' }
          }
        },
        y: {
          grid: {
            color: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255, 255, 255, 0.06)'
          },
          ticks: {
            color: isLight ? '#64748b' : '#94a3b8',
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

  // Determine label step to keep x-axis clean
  const step = weeks <= 12 ? 1 : (weeks <= 26 ? 2 : 4);

  for (let w = 0; w <= weeks; w += step) {
    labels.push(w === 0 ? 'Start' : `Wk ${w}`);
    principalData.push(capital);
    const val = capital * Math.pow(1 + wRate, w);
    corpusData.push(Math.round(val));
  }

  // Ensure last week is always included
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

function updateChartTheme(theme) {
  if (!weeklyChart) return;
  const isLight = theme === 'light';
  weeklyChart.options.plugins.legend.labels.color = isLight ? '#334155' : '#cbd5e1';
  weeklyChart.options.scales.x.grid.color = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255, 255, 255, 0.06)';
  weeklyChart.options.scales.x.ticks.color = isLight ? '#64748b' : '#94a3b8';
  weeklyChart.options.scales.y.grid.color = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255, 255, 255, 0.06)';
  weeklyChart.options.scales.y.ticks.color = isLight ? '#64748b' : '#94a3b8';
  weeklyChart.update();
}

/* ==========================================================================
   4. Consultation Booking Modal & Email Dispatch
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
      const service = document.getElementById('modal-service')?.value || 'Digital Asset & Trading Advisory';
      const capital = document.getElementById('modal-capital')?.value || '₹1 Lakh - ₹5 Lakh';
      const notes = document.getElementById('modal-notes')?.value.trim() || 'Consultation request for custom investment plan.';

      const mailSubject = encodeURIComponent(`Advisory Consultation Request — ${name} (${capital})`);
      const mailBody = encodeURIComponent(
        `Hello AceNeev Capital,\n\nI would like to schedule a private advisory consultation.\n\n` +
        `• Name: ${name}\n` +
        `• Email: ${email}\n` +
        `• Strategy Interest: ${service}\n` +
        `• Capital Budget: ${capital}\n` +
        `• Message/Goals: ${notes}\n\n` +
        `Looking forward to hearing from you.\n`
      );

      const mailUrl = `mailto:aceneevcapital@gmail.com?subject=${mailSubject}&body=${mailBody}`;

      closeModal();
      showToast(`Thank you, ${name}! Your consultation details have been prepared. Opening email client to send to aceneevcapital@gmail.com...`, 'success');

      setTimeout(() => {
        window.location.href = mailUrl;
      }, 1000);

      bookingForm.reset();
    });
  }
}

/* ==========================================================================
   5. Contact Form Handler (Direct Email Dispatch)
   ========================================================================== */
function initContactForm() {
  const contactForm = document.getElementById('contact-form');
  if (!contactForm) return;

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('contact-name')?.value.trim() || 'Investor';
    const email = document.getElementById('contact-email')?.value.trim() || '';
    const program = document.getElementById('contact-service')?.value || 'Investment Inquiry';
    const capital = document.getElementById('contact-capital')?.value || '₹1 Lakh+';
    const message = document.getElementById('contact-message')?.value.trim() || 'Please share details on how to get started.';

    const mailSubject = encodeURIComponent(`Website Inquiry: ${program} — ${name}`);
    const mailBody = encodeURIComponent(
      `Hello AceNeev Capital Team,\n\n` +
      `New consultation & inquiry from website:\n\n` +
      `• Investor Name: ${name}\n` +
      `• Contact Email: ${email}\n` +
      `• Preferred Program: ${program}\n` +
      `• Capital Budget: ${capital}\n` +
      `• Specific Query: ${message}\n\n` +
      `Kindly review and revert with advisory details.\n`
    );

    const mailUrl = `mailto:aceneevcapital@gmail.com?subject=${mailSubject}&body=${mailBody}`;

    showToast(`Thank you, ${name}! Opening your email client to send your inquiry directly to aceneevcapital@gmail.com...`, 'success');

    setTimeout(() => {
      window.location.href = mailUrl;
    }, 1000);

    contactForm.reset();
  });
}

/* ==========================================================================
   6. Mobile Navigation Drawer
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
   7. Grounded Realistic Stats Counter
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
   8. Toast Notification System
   ========================================================================== */
function showToast(message, type = 'info') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed bottom-6 right-6 z-50 flex flex-col space-y-3 max-w-md pointer-events-none';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `p-4 rounded-2xl border pointer-events-auto shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-y-4 opacity-0 flex items-start space-x-3 text-sm font-medium ${
    type === 'success'
      ? 'bg-slate-900/95 border-emerald-500/50 text-white shadow-emerald-950/40'
      : 'bg-slate-900/95 border-slate-700 text-white'
  }`;

  const iconSvg = `<svg class="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;

  toast.innerHTML = `
    ${iconSvg}
    <div class="flex-1 leading-snug">${message}</div>
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
