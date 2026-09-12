// ACENEEV CAPITAL - Interactive Core Engine
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons if available
  if (window.lucide) {
    window.lucide.createIcons();
  }

  initTheme();
  initTicker();
  initCalculator();
  initStrategyTabs();
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
    if (window.investmentChart) {
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
   2. Real-Time Market Ticker Streamer
   ========================================================================== */
const marketData = [
  { symbol: 'BTC/USDT', name: 'Bitcoin', price: 68420.50, change: 3.42, prefix: '$' },
  { symbol: 'ETH/USDT', name: 'Ethereum', price: 3580.20, change: 2.15, prefix: '$' },
  { symbol: 'SOL/USDT', name: 'Solana', price: 178.60, change: 5.80, prefix: '$' },
  { symbol: 'NIFTY 50', name: 'NSE Nifty', price: 25380.10, change: 0.74, prefix: '₹' },
  { symbol: 'BANK NIFTY', name: 'NSE Bank', price: 51840.40, change: -0.22, prefix: '₹' },
  { symbol: 'S&P 500', name: 'US Index', price: 5645.20, change: 0.58, prefix: '$' },
  { symbol: 'GOLD (10g)', name: 'Commodity', price: 74200.00, change: 0.35, prefix: '₹' },
  { symbol: 'BNB/USDT', name: 'BNB Chain', price: 592.30, change: 1.88, prefix: '$' }
];

function initTicker() {
  const tickerTrack = document.getElementById('ticker-track');
  if (!tickerTrack) return;

  function renderTicker() {
    // Duplicate items to ensure seamless infinite looping marquee
    const fullList = [...marketData, ...marketData];
    tickerTrack.innerHTML = fullList.map((item, idx) => {
      const isPositive = item.change >= 0;
      const changeClass = isPositive ? 'text-emerald-400' : 'text-rose-400';
      const sign = isPositive ? '+' : '';
      const formattedPrice = item.price.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      return `
        <div class="inline-flex items-center space-x-3 px-6 py-2 border-r border-slate-800 text-xs font-mono ticker-item" data-index="${idx % marketData.length}">
          <span class="font-bold text-slate-300 dark:text-slate-200">${item.symbol}</span>
          <span class="text-slate-400 text-[11px] hidden sm:inline">(${item.name})</span>
          <span class="font-semibold text-white ticker-price">${item.prefix}${formattedPrice}</span>
          <span class="px-1.5 py-0.5 rounded text-[11px] font-bold ${changeClass} ${isPositive ? 'bg-emerald-500/10' : 'bg-rose-500/10'}">
            ${sign}${item.change.toFixed(2)}%
          </span>
        </div>
      `;
    }).join('');
  }

  renderTicker();

  // Subtle live price fluctuation simulation
  setInterval(() => {
    const randomIndex = Math.floor(Math.random() * marketData.length);
    const item = marketData[randomIndex];
    const fluctuationPercent = (Math.random() * 0.4 - 0.19) / 100;
    item.price += item.price * fluctuationPercent;
    item.change += (Math.random() * 0.1 - 0.048);

    const targetElements = tickerTrack.querySelectorAll(`.ticker-item[data-index="${randomIndex}"]`);
    targetElements.forEach(el => {
      const priceEl = el.querySelector('.ticker-price');
      if (priceEl) {
        priceEl.textContent = `${item.prefix}${item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        priceEl.classList.add('text-emerald-300');
        setTimeout(() => priceEl.classList.remove('text-emerald-300'), 800);
      }
    });
  }, 2400);
}

/* ==========================================================================
   3. Interactive Portfolio & Investment Growth Calculator
   ========================================================================== */
let investmentChart = null;

const strategyProfiles = {
  conservative: {
    title: 'Capital Shield (Conservative)',
    cagr: 0.12,
    description: 'Hedged equity portfolios, blue-chip market neutrality, low-drawdown debt instruments, and 10% Bitcoin reserve backing.'
  },
  balanced: {
    title: 'Quant Balanced Alpha',
    cagr: 0.185,
    description: 'Multi-strategy systematic trading (NSE/F&O) combined with 25% allocation to high-conviction digital assets (BTC/ETH).'
  },
  aggressive: {
    title: 'High-Alpha Dynamic Quant',
    cagr: 0.284,
    description: 'Algorithmic momentum, crypto spot/derivative hedging, arbitrage execution, and active Web3 digital asset alpha capture.'
  }
};

let currentProfile = 'balanced';

function initCalculator() {
  const initialSlider = document.getElementById('calc-initial');
  const monthlySlider = document.getElementById('calc-monthly');
  const yearsSlider = document.getElementById('calc-years');

  const initialValDisplay = document.getElementById('calc-initial-val');
  const monthlyValDisplay = document.getElementById('calc-monthly-val');
  const yearsValDisplay = document.getElementById('calc-years-val');

  const totalInvestedDisplay = document.getElementById('result-invested');
  const totalReturnsDisplay = document.getElementById('result-returns');
  const finalCorpusDisplay = document.getElementById('result-corpus');
  const alphaDisplay = document.getElementById('result-alpha');

  const profileButtons = document.querySelectorAll('.strategy-btn');

  function formatINR(val) {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    } else if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} Lakh`;
    } else {
      return `₹${val.toLocaleString('en-IN')}`;
    }
  }

  function calculate() {
    const P = parseFloat(initialSlider.value);
    const PMT = parseFloat(monthlySlider.value);
    const t = parseInt(yearsSlider.value);
    const r = strategyProfiles[currentProfile].cagr;

    // Compound growth with monthly compounding
    const months = t * 12;
    const monthlyRate = r / 12;

    // FV = P * (1 + r/12)^(12t) + PMT * [ ((1 + r/12)^(12t) - 1) / (r/12) ]
    const compoundInitial = P * Math.pow(1 + monthlyRate, months);
    let compoundMonthly = 0;
    if (monthlyRate > 0) {
      compoundMonthly = PMT * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    }

    const futureValue = compoundInitial + compoundMonthly;
    const totalInvested = P + (PMT * months);
    const totalWealthGained = Math.max(0, futureValue - totalInvested);

    // Standard benchmark comparison (assume 8% traditional benchmark)
    const benchmarkRate = 0.08 / 12;
    const benchmarkFV = (P * Math.pow(1 + benchmarkRate, months)) + 
      (PMT * ((Math.pow(1 + benchmarkRate, months) - 1) / benchmarkRate));
    const alphaGenerated = Math.max(0, futureValue - benchmarkFV);

    // Update Text UI
    initialValDisplay.textContent = formatINR(P);
    monthlyValDisplay.textContent = formatINR(PMT) + '/mo';
    yearsValDisplay.textContent = `${t} Year${t > 1 ? 's' : ''}`;

    totalInvestedDisplay.textContent = formatINR(totalInvested);
    totalReturnsDisplay.textContent = formatINR(totalWealthGained);
    finalCorpusDisplay.textContent = formatINR(futureValue);
    alphaDisplay.textContent = `+${formatINR(alphaGenerated)} vs 8% Benchmark`;

    updateChart(P, PMT, t, r);
  }

  // Profile selection
  profileButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      profileButtons.forEach(b => {
        b.classList.remove('bg-emerald-500', 'text-slate-900', 'font-bold', 'border-emerald-400');
        b.classList.add('bg-slate-800/80', 'text-slate-300', 'border-slate-700');
      });
      btn.classList.add('bg-emerald-500', 'text-slate-900', 'font-bold', 'border-emerald-400');
      btn.classList.remove('bg-slate-800/80', 'text-slate-300', 'border-slate-700');
      currentProfile = btn.dataset.profile;
      calculate();
    });
  });

  // Slider events
  [initialSlider, monthlySlider, yearsSlider].forEach(slider => {
    slider.addEventListener('input', calculate);
  });

  // Initial calculation and chart build
  initChart();
  calculate();
}

function initChart() {
  const ctx = document.getElementById('investmentChart');
  if (!ctx || !window.Chart) return;

  const isLight = document.documentElement.classList.contains('light');

  investmentChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Aceneev Projected Wealth',
          data: [],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.18)',
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#ffffff',
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'Total Principal Invested',
          data: [],
          borderColor: '#64748b',
          backgroundColor: 'rgba(100, 116, 139, 0.08)',
          fill: true,
          tension: 0,
          borderWidth: 2,
          borderDash: [5, 5],
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
              if (val >= 10000000) {
                return `${context.dataset.label}: ₹${(val / 10000000).toFixed(2)} Cr`;
              } else if (val >= 100000) {
                return `${context.dataset.label}: ₹${(val / 100000).toFixed(2)} Lakh`;
              }
              return `${context.dataset.label}: ₹${val.toLocaleString('en-IN')}`;
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
  window.investmentChart = investmentChart;
}

function updateChart(P, PMT, years, cagr) {
  if (!investmentChart) return;

  const labels = [];
  const wealthData = [];
  const investedData = [];

  for (let year = 0; year <= years; year++) {
    labels.push(`Year ${year}`);
    const months = year * 12;
    const monthlyRate = cagr / 12;

    const invested = P + (PMT * months);
    investedData.push(invested);

    if (year === 0) {
      wealthData.push(P);
    } else {
      const fv = (P * Math.pow(1 + monthlyRate, months)) +
        (PMT * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate));
      wealthData.push(Math.round(fv));
    }
  }

  investmentChart.data.labels = labels;
  investmentChart.data.datasets[0].data = wealthData;
  investmentChart.data.datasets[1].data = investedData;
  investmentChart.update();
}

function updateChartTheme(theme) {
  if (!investmentChart) return;
  const isLight = theme === 'light';
  investmentChart.options.plugins.legend.labels.color = isLight ? '#334155' : '#cbd5e1';
  investmentChart.options.scales.x.grid.color = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255, 255, 255, 0.06)';
  investmentChart.options.scales.x.ticks.color = isLight ? '#64748b' : '#94a3b8';
  investmentChart.options.scales.y.grid.color = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255, 255, 255, 0.06)';
  investmentChart.options.scales.y.ticks.color = isLight ? '#64748b' : '#94a3b8';
  investmentChart.update();
}

/* ==========================================================================
   4. Strategy Matrix Tab Controller
   ========================================================================== */
function initStrategyTabs() {
  const tabs = document.querySelectorAll('.strategy-tab');
  const panels = document.querySelectorAll('.strategy-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.target;
      tabs.forEach(t => t.classList.remove('tab-active', 'border-emerald-500', 'text-white'));
      panels.forEach(p => p.classList.add('hidden'));

      tab.classList.add('tab-active', 'border-emerald-500', 'text-white');
      const targetPanel = document.getElementById(target);
      if (targetPanel) targetPanel.classList.remove('hidden');
    });
  });
}

/* ==========================================================================
   5. Consultation Booking Modal & WhatsApp Fast-Track
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
      const phone = document.getElementById('modal-phone')?.value.trim() || '8920460739';
      const service = document.getElementById('modal-service')?.value || 'Trading & Crypto Advisory';
      const capital = document.getElementById('modal-capital')?.value || '₹10L - ₹50L';

      // Create pre-composed WhatsApp inquiry
      const waMsg = encodeURIComponent(
        `Hello Aceneev Capital,\n\nI would like to book a consultation session.\nName: ${name}\nContact: ${phone}\nInterested Area: ${service}\nPlanned Capital: ${capital}\nOffice: NPX Tower, Sector 153, Noida`
      );
      const waUrl = `https://wa.me/918920460739?text=${waMsg}`;

      closeModal();
      showToast(`Thank you, ${name}! Your consultation request has been queued. Redirecting to WhatsApp for instant priority confirmation...`, 'success');

      setTimeout(() => {
        window.open(waUrl, '_blank');
      }, 1200);

      bookingForm.reset();
    });
  }
}

/* ==========================================================================
   6. Contact Form & Direct Actions
   ========================================================================== */
function initContactForm() {
  const contactForm = document.getElementById('contact-form');
  if (!contactForm) return;

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('contact-name')?.value.trim() || 'Investor';
    const email = document.getElementById('contact-email')?.value.trim();
    const phone = document.getElementById('contact-phone')?.value.trim();
    const message = document.getElementById('contact-message')?.value.trim();

    const waMsg = encodeURIComponent(
      `Hello Aceneev Capital,\n\nNew Inquiry from Website:\nName: ${name}\nPhone: ${phone}\nEmail: ${email}\nMessage: ${message}`
    );
    const waUrl = `https://wa.me/918920460739?text=${waMsg}`;

    showToast(`Thank you ${name}! Our senior financial advisor will connect with you at ${phone || '8920460739'}. Opening WhatsApp priority channel...`, 'success');

    setTimeout(() => {
      window.open(waUrl, '_blank');
    }, 1200);

    contactForm.reset();
  });
}

/* ==========================================================================
   7. Mobile Navigation Drawer
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
   8. Stats Dynamic Counter
   ========================================================================== */
function initStatsCounter() {
  const counters = document.querySelectorAll('.counter-stat');
  let started = false;

  function countUp() {
    counters.forEach(counter => {
      const target = parseFloat(counter.getAttribute('data-target'));
      const prefix = counter.getAttribute('data-prefix') || '';
      const suffix = counter.getAttribute('data-suffix') || '';
      const duration = 1800; // ms
      const startTime = performance.now();

      function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3); // ease-out cubic
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
  }, { threshold: 0.3 });

  const statsSection = document.getElementById('stats-section');
  if (statsSection) observer.observe(statsSection);
}

/* ==========================================================================
   Toast Notification Utility
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
  toast.className = `p-4 rounded-xl border pointer-events-auto shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-y-4 opacity-0 flex items-start space-x-3 text-sm font-medium ${
    type === 'success'
      ? 'bg-slate-900/95 border-emerald-500/50 text-white shadow-emerald-900/30'
      : 'bg-slate-900/95 border-slate-700 text-white'
  }`;

  const iconSvg = type === 'success'
    ? `<svg class="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`
    : `<svg class="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;

  toast.innerHTML = `
    ${iconSvg}
    <div class="flex-1 leading-snug">${message}</div>
  `;

  toastContainer.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-4');
    setTimeout(() => toast.remove(), 400);
  }, 4500);
}
