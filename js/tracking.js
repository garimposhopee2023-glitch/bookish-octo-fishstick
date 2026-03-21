// ============================================================
// tracking.js — Google Ads + Meta Pixel + TikTok Pixel
// Inclua este script na sua landing page ANTES de fechar o </body>
// ============================================================

(function () {

  // ============================================================
  // CONFIGURAÇÃO — edite aqui
  // ============================================================
  var TRACKING_CONFIG = {
    worker_url: 'https://clucluad.apimatheus.workers.dev/', // URL da sua Cloudflare Worker

    google: {
      enabled: true,
      gtag_id: 'AW-XXXXXXXXX',         // Seu Google Ads ID
      conversion_label: 'XXXXXXXXXXX', // Label da conversão
    },

    meta: {
      enabled: true,
      pixel_id: 'XXXXXXXXXXXXXXX',     // Seu Meta Pixel ID
    },

    tiktok: {
      enabled: true,
      pixel_id: 'XXXXXXXXXXXXXXX',     // Seu TikTok Pixel ID
    },

    polling: {
      interval_ms: 4000,   // Consulta a cada 4 segundos
      max_attempts: 75,    // Máximo ~5 minutos de polling
    }
  };
  // ============================================================

  var cfg = TRACKING_CONFIG;

  // --- Carrega Google Tag (gtag.js) ---
  function loadGoogleTag() {
    if (!cfg.google.enabled || !cfg.google.gtag_id) return;
    if (document.querySelector('script[src*="gtag/js"]')) return;

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + cfg.google.gtag_id;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', cfg.google.gtag_id);

    console.log('[Tracking] Google Tag carregado:', cfg.google.gtag_id);
  }

  // --- Carrega Meta Pixel ---
  function loadMetaPixel() {
    if (!cfg.meta.enabled || !cfg.meta.pixel_id) return;
    if (window.fbq) return;

    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
      n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    window.fbq('init', cfg.meta.pixel_id);
    window.fbq('track', 'PageView');

    console.log('[Tracking] Meta Pixel carregado:', cfg.meta.pixel_id);
  }

  // --- Carrega TikTok Pixel ---
  function loadTikTokPixel() {
    if (!cfg.tiktok.enabled || !cfg.tiktok.pixel_id) return;
    if (window.ttq) return;

    !function (w, d, t) {
      w.TiktokAnalyticsObject = t;
      var ttq = w[t] = w[t] || [];
      ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'];
      ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; };
      for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
      ttq.instance = function (t) { for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e; };
      ttq.load = function (e, n) {
        var i = 'https://analytics.tiktok.com/i18n/pixel/events.js';
        ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = i; ttq._r = ttq._r || {}; ttq._r[e] = n;
        var o = document.createElement('script'); o.type = 'text/javascript'; o.async = !0; o.src = i + '?sdkid=' + e + '&lib=' + t;
        var a = document.getElementsByTagName('script')[0]; a.parentNode.insertBefore(o, a);
      };
      ttq.load(cfg.tiktok.pixel_id);
      ttq.page();
    }(window, document, 'ttq');

    console.log('[Tracking] TikTok Pixel carregado:', cfg.tiktok.pixel_id);
  }

  // --- Dispara conversão no Google Ads ---
  function fireGoogleConversion(value, currency) {
    if (!cfg.google.enabled || !window.gtag) return;
    window.gtag('event', 'conversion', {
      send_to: cfg.google.gtag_id + '/' + cfg.google.conversion_label,
      value: parseFloat(value),
      currency: currency || 'BRL',
      transaction_id: ''
    });
    console.log('[Tracking] Google conversão disparada. Valor:', value);
  }

  // --- Dispara conversão no Meta ---
  function fireMetaConversion(value, currency) {
    if (!cfg.meta.enabled || !window.fbq) return;
    window.fbq('track', 'Purchase', {
      value: parseFloat(value),
      currency: currency || 'BRL'
    });
    console.log('[Tracking] Meta Purchase disparado. Valor:', value);
  }

  // --- Dispara conversão no TikTok ---
  function fireTikTokConversion(value, currency) {
    if (!cfg.tiktok.enabled || !window.ttq) return;
    window.ttq.track('CompletePayment', {
      value: parseFloat(value),
      currency: currency || 'BRL'
    });
    console.log('[Tracking] TikTok CompletePayment disparado. Valor:', value);
  }

  // --- Dispara todos os pixels de conversão ---
  function fireAllConversions(value, currency) {
    console.log('[Tracking] 🎯 Disparando conversões! Valor: R$' + value);
    fireGoogleConversion(value, currency);
    fireMetaConversion(value, currency);
    fireTikTokConversion(value, currency);
  }

  // --- Polling: fica verificando o status até confirmar ---
  function startPolling(transactionId, value, currency) {
    if (!transactionId) {
      console.warn('[Tracking] Polling não iniciado: sem transactionId');
      return;
    }

    var attempts = 0;
    var maxAttempts = cfg.polling.max_attempts;
    var interval = cfg.polling.interval_ms;

    console.log('[Tracking] ⏳ Iniciando polling para:', transactionId);

    var timer = setInterval(function () {
      attempts++;

      if (attempts > maxAttempts) {
        clearInterval(timer);
        console.warn('[Tracking] ⚠️ Polling encerrado: tempo máximo atingido.');
        return;
      }

      var statusUrl = cfg.worker_url + '/api/pix-status?id=' + encodeURIComponent(transactionId);

      fetch(statusUrl)
        .then(function (r) { return r.json(); })
        .then(function (data) {
          console.log('[Tracking] Status:', data.status, '| Tentativa:', attempts);

          if (data.status === 'PAID') {
            clearInterval(timer);
            fireAllConversions(value, currency);

            // Dispara evento customizado para a LP reagir (ex: mostrar tela de obrigado)
            window.dispatchEvent(new CustomEvent('pix:paid', {
              detail: { transactionId: transactionId, value: value }
            }));
          }

          if (data.status === 'CANCELLED') {
            clearInterval(timer);
            console.log('[Tracking] PIX cancelado ou expirado.');
            window.dispatchEvent(new CustomEvent('pix:cancelled', {
              detail: { transactionId: transactionId }
            }));
          }
        })
        .catch(function (err) {
          console.warn('[Tracking] Erro no polling:', err);
        });

    }, interval);
  }

  // --- API pública exposta para a landing page ---
  window.tracking = {

    // Chame após gerar o PIX na sua landing page:
    // tracking.pixGerado({ transactionId: 'TXN-xxx', value: 97.00 })
    pixGerado: function (options) {
      var transactionId = options.transactionId;
      var value = options.value || 0;
      var currency = options.currency || 'BRL';

      startPolling(transactionId, value, currency);
    },

    // Disparo manual (fallback)
    dispararConversao: function (value, currency) {
      fireAllConversions(value, currency || 'BRL');
    }
  };

  // --- Inicialização automática ao carregar ---
  function init() {
    loadGoogleTag();
    loadMetaPixel();
    loadTikTokPixel();
    console.log('[Tracking] ✅ Pixels inicializados.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
