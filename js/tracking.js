// ============================================================
// tracking.js — Google Ads + Meta Pixel + TikTok Pixel
// v3.0 — Suporte a múltiplos pixels (até 10 por plataforma)
// Inclua este script na sua landing page ANTES de fechar o </body>
// ============================================================

(function () {

  // ============================================================
  // CONFIGURAÇÃO — edite aqui
  // Adicione ou remova entradas dos arrays conforme necessário
  // ============================================================
  var TRACKING_CONFIG = {
    worker_url: 'https://clucluad.apimatheus.workers.dev',

    google: {
      enabled: true,
      accounts: [
        { gtag_id: 'AW-18025989883', conversion_label: 'LtC_CKHRi40cEPuNu5ND' },
        { gtag_id: 'AW-17532295976', conversion_label: 'Uwd3CI3305kbEKi2hqhB' },
        { gtag_id: 'AW-XXXXXXXXX3', conversion_label: 'LABEL_3_AQUI' },
        { gtag_id: 'AW-XXXXXXXXX4', conversion_label: 'LABEL_4_AQUI' },
        { gtag_id: 'AW-XXXXXXXXX5', conversion_label: 'LABEL_5_AQUI' },
        { gtag_id: 'AW-XXXXXXXXX6', conversion_label: 'LABEL_6_AQUI' },
        { gtag_id: 'AW-XXXXXXXXX7', conversion_label: 'LABEL_7_AQUI' },
        { gtag_id: 'AW-XXXXXXXXX8', conversion_label: 'LABEL_8_AQUI' },
        { gtag_id: 'AW-XXXXXXXXX9', conversion_label: 'LABEL_9_AQUI' },
        { gtag_id: 'AW-XXXXXXXXX0', conversion_label: 'LABEL_10_AQUI' },
      ]
    },

    meta: {
      enabled: true,
      pixel_ids: [
        '704849652401799',
        '1000000000000002',
        '1000000000000003',
        '1000000000000004',
        '1000000000000005',
        '1000000000000006',
        '1000000000000007',
        '1000000000000008',
        '1000000000000009',
        '1000000000000010',
      ]
    },

    tiktok: {
      enabled: true,
      pixel_ids: [
        'TIKTOK_PIXEL_ID_01',
        'TIKTOK_PIXEL_ID_02',
        'TIKTOK_PIXEL_ID_03',
        'TIKTOK_PIXEL_ID_04',
        'TIKTOK_PIXEL_ID_05',
        'TIKTOK_PIXEL_ID_06',
        'TIKTOK_PIXEL_ID_07',
        'TIKTOK_PIXEL_ID_08',
        'TIKTOK_PIXEL_ID_09',
        'TIKTOK_PIXEL_ID_10',
      ]
    },

    polling: {
      interval_ms: 4000,
      max_attempts: 75, // ~5 minutos
    }
  };
  // ============================================================

  var cfg = TRACKING_CONFIG;

  // ============================================================
  // RASTREAMENTO DE URL — gclid, fbclid, ttclid, UTMs
  // ============================================================

  var STORAGE_KEY = 'tracking_params';
  var STORAGE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 dias

  function parseUrlParams() {
    var params = new URLSearchParams(window.location.search);
    return {
      gclid:        params.get('gclid')        || '',
      fbclid:       params.get('fbclid')       || '',
      ttclid:       params.get('ttclid')       || '',
      msclkid:      params.get('msclkid')      || '',
      utm_source:   params.get('utm_source')   || '',
      utm_medium:   params.get('utm_medium')   || '',
      utm_campaign: params.get('utm_campaign') || '',
      utm_content:  params.get('utm_content')  || '',
      utm_term:     params.get('utm_term')     || '',
      landing_url:  window.location.href,
      referrer:     document.referrer          || '',
      captured_at:  new Date().toISOString(),
    };
  }

  function saveTrackingParams(params) {
    var existing = loadTrackingParams();
    var hasNewClick = params.gclid || params.fbclid || params.ttclid || params.msclkid;
    var hasExistingClick = existing && (existing.gclid || existing.fbclid || existing.ttclid || existing.msclkid);

    if (hasExistingClick && !hasNewClick) {
      console.log('[Tracking] Mantendo parâmetros de clique anteriores.');
      return existing;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        data: params,
        expires_at: Date.now() + STORAGE_TTL,
      }));
      console.log('[Tracking] Parâmetros salvos:', params);
    } catch (e) {
      console.warn('[Tracking] Erro ao salvar localStorage:', e);
    }

    return params;
  }

  function loadTrackingParams() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var payload = JSON.parse(raw);
      if (Date.now() > payload.expires_at) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return payload.data;
    } catch (e) {
      return null;
    }
  }

  function getTrackingParams() {
    return loadTrackingParams() || {};
  }

  function captureUrlParams() {
    var params = parseUrlParams();
    var hasAnyParam = Object.keys(params).some(function (k) {
      return k !== 'landing_url' && k !== 'referrer' && k !== 'captured_at' && params[k] !== '';
    });
    if (hasAnyParam) saveTrackingParams(params);
  }

  // ============================================================
  // GOOGLE ADS — múltiplas contas
  // ============================================================

  function loadGoogleTag() {
    if (!cfg.google.enabled) return;
    if (!cfg.google.accounts || cfg.google.accounts.length === 0) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());

    cfg.google.accounts.forEach(function (account) {
      // Pula entradas não preenchidas
      if (!account.gtag_id || account.gtag_id.includes('XXXXXXXXX')) return;

      if (!document.querySelector('script[src*="' + account.gtag_id + '"]')) {
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + account.gtag_id;
        document.head.appendChild(s);
      }

      window.gtag('config', account.gtag_id, {
        allow_enhanced_conversions: true,
      });

      console.log('[Tracking] Google Tag carregado:', account.gtag_id);
    });
  }

  function fireGoogleConversion(value, currency, transactionId) {
    if (!cfg.google.enabled || !window.gtag) return;
    if (!cfg.google.accounts || cfg.google.accounts.length === 0) return;

    var tp = getTrackingParams();

    cfg.google.accounts.forEach(function (account) {
      if (!account.gtag_id || account.gtag_id.includes('XXXXXXXXX')) return;
      if (!account.conversion_label || account.conversion_label.includes('LABEL')) return;

      window.gtag('event', 'conversion', {
        send_to: account.gtag_id + '/' + account.conversion_label,
        value: parseFloat(value),
        currency: currency || 'BRL',
        transaction_id: transactionId || '',
        gclid: tp.gclid || '',
      });

      console.log('[Tracking] Google conversão:', account.gtag_id, '| Valor:', value);
    });
  }

  // ============================================================
  // META PIXEL — múltiplos pixels
  // ============================================================

  function loadMetaPixel() {
    if (!cfg.meta.enabled) return;
    if (!cfg.meta.pixel_ids || cfg.meta.pixel_ids.length === 0) return;

    // Carrega o SDK fbevents apenas uma vez
    if (!window.fbq) {
      !function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n; n.loaded = !0; n.version = '2.0';
        n.queue = [];
        t = b.createElement(e); t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    }

    var tp = getTrackingParams();

    // Inicializa cada pixel individualmente
    cfg.meta.pixel_ids.forEach(function (id) {
      if (!id || id.includes('1000000000000')) return;

      window.fbq('init', id, {
        external_id: tp.fbclid || undefined,
      });

      console.log('[Tracking] Meta Pixel carregado:', id);
    });

    // PageView dispara para todos os pixels inicializados
    window.fbq('track', 'PageView');
  }

  function fireMetaConversion(value, currency, transactionId) {
    if (!cfg.meta.enabled || !window.fbq) return;
    if (!cfg.meta.pixel_ids || cfg.meta.pixel_ids.length === 0) return;

    cfg.meta.pixel_ids.forEach(function (id) {
      if (!id || id.includes('1000000000000')) return;

      // trackSingle garante que o evento vai só para este pixel
      window.fbq('trackSingle', id, 'Purchase', {
        value: parseFloat(value),
        currency: currency || 'BRL',
        order_id: transactionId || '',
        content_ids: [transactionId || ''],
        content_type: 'product',
      });

      console.log('[Tracking] Meta Purchase:', id, '| Valor:', value);
    });
  }

  // ============================================================
  // TIKTOK PIXEL — múltiplos pixels
  // ============================================================

  function loadTikTokPixel() {
    if (!cfg.tiktok.enabled) return;
    if (!cfg.tiktok.pixel_ids || cfg.tiktok.pixel_ids.length === 0) return;

    // Carrega o SDK do TikTok apenas uma vez
    if (!window.ttq) {
      !function (w, d, t) {
        w.TiktokAnalyticsObject = t;
        var ttq = w[t] = w[t] || [];
        ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'];
        ttq.setAndDefer = function (t, e) {
          t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); };
        };
        for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
        ttq.instance = function (t) {
          for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
          return e;
        };
        ttq.load = function (e, n) {
          var i = 'https://analytics.tiktok.com/i18n/pixel/events.js';
          ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = i;
          ttq._r = ttq._r || {}; ttq._r[e] = n;
          var o = document.createElement('script');
          o.type = 'text/javascript'; o.async = !0;
          o.src = i + '?sdkid=' + e + '&lib=' + t;
          var a = document.getElementsByTagName('script')[0];
          a.parentNode.insertBefore(o, a);
        };
      }(window, document, 'ttq');
    }

    var tp = getTrackingParams();

    // Carrega e registra cada pixel individualmente
    cfg.tiktok.pixel_ids.forEach(function (id) {
      if (!id || id.includes('TIKTOK_PIXEL_ID')) return;

      window.ttq.load(id, { ttclid: tp.ttclid || undefined });
      window.ttq.page();

      console.log('[Tracking] TikTok Pixel carregado:', id);
    });
  }

  function fireTikTokConversion(value, currency, transactionId) {
    if (!cfg.tiktok.enabled || !window.ttq) return;
    if (!cfg.tiktok.pixel_ids || cfg.tiktok.pixel_ids.length === 0) return;

    cfg.tiktok.pixel_ids.forEach(function (id) {
      if (!id || id.includes('TIKTOK_PIXEL_ID')) return;

      // instance() garante que o evento vai só para este pixel
      window.ttq.instance(id).track('CompletePayment', {
        value: parseFloat(value),
        currency: currency || 'BRL',
        order_id: transactionId || '',
        contents: [{ content_id: transactionId || '', content_type: 'product' }],
      });

      console.log('[Tracking] TikTok CompletePayment:', id, '| Valor:', value);
    });
  }

  // ============================================================
  // DISPARO GERAL
  // ============================================================

  function fireAllConversions(value, currency, transactionId) {
    var tp = getTrackingParams();
    console.log('[Tracking] 🎯 Disparando conversões! Valor: R$' + value);
    console.log('[Tracking] Parâmetros ativos:', {
      gclid:        tp.gclid        || '-',
      fbclid:       tp.fbclid       || '-',
      ttclid:       tp.ttclid       || '-',
      utm_source:   tp.utm_source   || '-',
      utm_campaign: tp.utm_campaign || '-',
    });

    fireGoogleConversion(value, currency, transactionId);
    fireMetaConversion(value, currency, transactionId);
    fireTikTokConversion(value, currency, transactionId);
  }

  // ============================================================
  // POLLING — verifica pagamento PIX
  // ============================================================

  function startPolling(transactionId, value, currency) {
    if (!transactionId) {
      console.warn('[Tracking] Polling não iniciado: sem transactionId');
      return;
    }

    var attempts    = 0;
    var maxAttempts = cfg.polling.max_attempts;
    var interval    = cfg.polling.interval_ms;

    console.log('[Tracking] ⏳ Iniciando polling para:', transactionId);

    var timer = setInterval(function () {
      attempts++;

      if (attempts > maxAttempts) {
        clearInterval(timer);
        console.warn('[Tracking] ⚠️ Polling encerrado: tempo máximo atingido.');
        return;
      }

      var tp = getTrackingParams();

      var queryParams = new URLSearchParams({
        id:           transactionId,
        gclid:        tp.gclid        || '',
        fbclid:       tp.fbclid       || '',
        ttclid:       tp.ttclid       || '',
        utm_source:   tp.utm_source   || '',
        utm_medium:   tp.utm_medium   || '',
        utm_campaign: tp.utm_campaign || '',
        utm_content:  tp.utm_content  || '',
        utm_term:     tp.utm_term     || '',
      });

      var statusUrl = cfg.worker_url + '/api/pix-status?' + queryParams.toString();

      fetch(statusUrl)
        .then(function (r) { return r.json(); })
        .then(function (data) {
          console.log('[Tracking] Status:', data.status, '| Tentativa:', attempts);

          if (data.status === 'PAID') {
            clearInterval(timer);
            fireAllConversions(value, currency, transactionId);

            window.dispatchEvent(new CustomEvent('pix:paid', {
              detail: {
                transactionId:  transactionId,
                value:          value,
                trackingParams: tp,
              }
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

  // ============================================================
  // API PÚBLICA
  // ============================================================

  window.tracking = {

    // Chame após gerar o PIX
    // tracking.pixGerado({ transactionId: 'TXN-xxx', value: 97.00 })
    pixGerado: function (options) {
      startPolling(
        options.transactionId,
        options.value    || 0,
        options.currency || 'BRL'
      );
    },

    // Retorna parâmetros de rastreamento ativos
    getParams: function () {
      return getTrackingParams();
    },

    // Disparo manual de conversão (fallback)
    dispararConversao: function (value, currency, transactionId) {
      fireAllConversions(value, currency || 'BRL', transactionId || '');
    }
  };

  // ============================================================
  // INICIALIZAÇÃO
  // ============================================================

  function init() {
    captureUrlParams();
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
