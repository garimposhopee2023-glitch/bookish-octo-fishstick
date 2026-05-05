// ============================================================
// tracking.js - Google Ads + Meta Pixel + TikTok Pixel
// v3.1 - UTMs, click IDs, polling PIX e protecao contra duplicidade
// Inclua este script na landing page antes de fechar o </body>
// ============================================================

(function () {
  "use strict";

  // ============================================================
  // CONFIGURACAO
  // ============================================================

  var TRACKING_CONFIG = {
    worker_url: "https://paradise2.apimatheus.workers.dev",
    debug: true,

    google: {
      enabled: true,
      accounts: [
        { gtag_id: "AW-18025989883", conversion_label: "LtC_CKHRi40cEPuNu5ND" },
        { gtag_id: "AW-17532295976", conversion_label: "Uwd3CI3305kbEKi2hqhB" },
        { gtag_id: "AW-XXXXXXXXX3", conversion_label: "LABEL_3_AQUI" },
        { gtag_id: "AW-XXXXXXXXX4", conversion_label: "LABEL_4_AQUI" },
        { gtag_id: "AW-XXXXXXXXX5", conversion_label: "LABEL_5_AQUI" },
        { gtag_id: "AW-XXXXXXXXX6", conversion_label: "LABEL_6_AQUI" },
        { gtag_id: "AW-XXXXXXXXX7", conversion_label: "LABEL_7_AQUI" },
        { gtag_id: "AW-XXXXXXXXX8", conversion_label: "LABEL_8_AQUI" },
        { gtag_id: "AW-XXXXXXXXX9", conversion_label: "LABEL_9_AQUI" },
        { gtag_id: "AW-XXXXXXXXX0", conversion_label: "LABEL_10_AQUI" },
      ],
    },

    meta: {
      enabled: true,
      pixel_ids: [
        "704849652401799",
        "1000000000000002",
        "1000000000000003",
        "1000000000000004",
        "1000000000000005",
        "1000000000000006",
        "1000000000000007",
        "1000000000000008",
        "1000000000000009",
        "1000000000000010",
      ],
    },

    tiktok: {
      enabled: true,
      pixel_ids: [
        "TIKTOK_PIXEL_ID_01",
        "TIKTOK_PIXEL_ID_02",
        "TIKTOK_PIXEL_ID_03",
        "TIKTOK_PIXEL_ID_04",
        "TIKTOK_PIXEL_ID_05",
        "TIKTOK_PIXEL_ID_06",
        "TIKTOK_PIXEL_ID_07",
        "TIKTOK_PIXEL_ID_08",
        "TIKTOK_PIXEL_ID_09",
        "TIKTOK_PIXEL_ID_10",
      ],
    },

    polling: {
      interval_ms: 4000,
      max_attempts: 75,
    },
  };

  var cfg = TRACKING_CONFIG;

  // ============================================================
  // STORAGE E PARAMETROS
  // ============================================================

  var STORAGE_KEY = "tracking_params";
  var CONVERSIONS_KEY = "tracking_conversions_fired";
  var STORAGE_TTL = 30 * 24 * 60 * 60 * 1000;

  var CLICK_KEYS = ["gclid", "fbclid", "ttclid", "msclkid"];
  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  var TRACKING_KEYS = CLICK_KEYS.concat(UTM_KEYS);

  function log() {
    if (!cfg.debug || !window.console) return;
    console.log.apply(console, arguments);
  }

  function warn() {
    if (!window.console) return;
    console.warn.apply(console, arguments);
  }

  function parseUrlParams() {
    var params = new URLSearchParams(window.location.search);
    var data = {
      landing_url: window.location.href,
      referrer: document.referrer || "",
      captured_at: new Date().toISOString(),
    };

    TRACKING_KEYS.forEach(function (key) {
      data[key] = params.get(key) || "";
    });

    return data;
  }

  function hasAnyTrackingParam(params) {
    return TRACKING_KEYS.some(function (key) {
      return !!params[key];
    });
  }

  function hasAnyClickId(params) {
    return CLICK_KEYS.some(function (key) {
      return !!params[key];
    });
  }

  function mergeTrackingParams(existing, incoming) {
    var merged = {};

    Object.keys(existing || {}).forEach(function (key) {
      merged[key] = existing[key];
    });

    Object.keys(incoming || {}).forEach(function (key) {
      if (incoming[key]) merged[key] = incoming[key];
    });

    merged.landing_url = incoming.landing_url || existing.landing_url || window.location.href;
    merged.referrer = incoming.referrer || existing.referrer || document.referrer || "";
    merged.captured_at = incoming.captured_at || existing.captured_at || new Date().toISOString();

    return merged;
  }

  function saveTrackingParams(params) {
    var existing = loadTrackingParams() || {};
    var merged;

    if (hasAnyClickId(existing) && !hasAnyClickId(params)) {
      merged = mergeTrackingParams(existing, params);
      log("[Tracking] Mantendo click IDs anteriores e atualizando UTMs disponiveis:", merged);
    } else {
      merged = mergeTrackingParams(existing, params);
      log("[Tracking] Parametros salvos:", merged);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        data: merged,
        expires_at: Date.now() + STORAGE_TTL,
      }));
    } catch (e) {
      warn("[Tracking] Erro ao salvar localStorage:", e);
    }

    return merged;
  }

  function loadTrackingParams() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      var payload = JSON.parse(raw);
      if (!payload || Date.now() > payload.expires_at) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return payload.data || null;
    } catch (e) {
      return null;
    }
  }

  function getTrackingParams() {
    return loadTrackingParams() || {};
  }

  function captureUrlParams() {
    var params = parseUrlParams();
    if (hasAnyTrackingParam(params)) saveTrackingParams(params);
  }

  function buildTrackingQuery(transactionId) {
    var tp = getTrackingParams();
    var query = new URLSearchParams();

    query.set("id", transactionId || "");

    TRACKING_KEYS.forEach(function (key) {
      query.set(key, tp[key] || "");
    });

    if (tp.landing_url) query.set("landing_url", tp.landing_url);
    if (tp.referrer) query.set("referrer", tp.referrer);

    return query;
  }

  // ============================================================
  // PROTECAO CONTRA CONVERSAO DUPLICADA
  // ============================================================

  function loadFiredConversions() {
    try {
      var raw = localStorage.getItem(CONVERSIONS_KEY);
      var payload = raw ? JSON.parse(raw) : {};
      return payload && typeof payload === "object" ? payload : {};
    } catch (e) {
      return {};
    }
  }

  function hasConversionFired(transactionId) {
    if (!transactionId) return false;
    return !!loadFiredConversions()[transactionId];
  }

  function markConversionFired(transactionId) {
    if (!transactionId) return;

    try {
      var fired = loadFiredConversions();
      fired[transactionId] = Date.now();
      localStorage.setItem(CONVERSIONS_KEY, JSON.stringify(fired));
    } catch (e) {
      warn("[Tracking] Erro ao marcar conversao:", e);
    }
  }

  // ============================================================
  // GOOGLE ADS
  // ============================================================

  function validGoogleAccounts() {
    if (!cfg.google.accounts) return [];

    return cfg.google.accounts.filter(function (account) {
      return account.gtag_id &&
        account.conversion_label &&
        account.gtag_id.indexOf("XXXXXXXXX") === -1 &&
        account.conversion_label.indexOf("LABEL") === -1;
    });
  }

  function loadGoogleTag() {
    if (!cfg.google.enabled) return;

    var accounts = validGoogleAccounts();
    if (accounts.length === 0) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };

    window.gtag("js", new Date());

    accounts.forEach(function (account) {
      if (!document.querySelector('script[src*="' + account.gtag_id + '"]')) {
        var script = document.createElement("script");
        script.async = true;
        script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(account.gtag_id);
        document.head.appendChild(script);
      }

      window.gtag("config", account.gtag_id, {
        allow_enhanced_conversions: true,
      });

      log("[Tracking] Google Tag carregado:", account.gtag_id);
    });
  }

  function fireGoogleConversion(value, currency, transactionId) {
    if (!cfg.google.enabled || !window.gtag) return;

    validGoogleAccounts().forEach(function (account) {
      window.gtag("event", "conversion", {
        send_to: account.gtag_id + "/" + account.conversion_label,
        value: parseFloat(value) || 0,
        currency: currency || "BRL",
        transaction_id: transactionId || "",
      });

      log("[Tracking] Google conversao:", account.gtag_id, "| Valor:", value);
    });
  }

  // ============================================================
  // META PIXEL
  // ============================================================

  function validMetaPixels() {
    if (!cfg.meta.pixel_ids) return [];

    return cfg.meta.pixel_ids.filter(function (id) {
      return id && id.indexOf("1000000000000") === -1;
    });
  }

  function loadMetaPixel() {
    if (!cfg.meta.enabled) return;

    var pixelIds = validMetaPixels();
    if (pixelIds.length === 0) return;

    if (!window.fbq) {
      !function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = "2.0";
        n.queue = [];
        t = b.createElement(e);
        t.async = true;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    }

    pixelIds.forEach(function (id) {
      window.fbq("init", id);
      log("[Tracking] Meta Pixel carregado:", id);
    });

    window.fbq("track", "PageView");
  }

  function fireMetaConversion(value, currency, transactionId) {
    if (!cfg.meta.enabled || !window.fbq) return;

    validMetaPixels().forEach(function (id) {
      window.fbq("trackSingle", id, "Purchase", {
        value: parseFloat(value) || 0,
        currency: currency || "BRL",
        order_id: transactionId || "",
        content_ids: [transactionId || ""],
        content_type: "product",
      });

      log("[Tracking] Meta Purchase:", id, "| Valor:", value);
    });
  }

  // ============================================================
  // TIKTOK PIXEL
  // ============================================================

  function validTikTokPixels() {
    if (!cfg.tiktok.pixel_ids) return [];

    return cfg.tiktok.pixel_ids.filter(function (id) {
      return id && id.indexOf("TIKTOK_PIXEL_ID") === -1;
    });
  }

  function loadTikTokPixel() {
    if (!cfg.tiktok.enabled) return;

    var pixelIds = validTikTokPixels();
    if (pixelIds.length === 0) return;

    if (!window.ttq) {
      !function (w, d, t) {
        w.TiktokAnalyticsObject = t;
        var ttq = w[t] = w[t] || [];
        ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie"];
        ttq.setAndDefer = function (obj, method) {
          obj[method] = function () {
            obj.push([method].concat(Array.prototype.slice.call(arguments, 0)));
          };
        };
        for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
        ttq.instance = function (id) {
          var instance = ttq._i[id] || [];
          for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(instance, ttq.methods[i]);
          return instance;
        };
        ttq.load = function (id, options) {
          var src = "https://analytics.tiktok.com/i18n/pixel/events.js";
          ttq._i = ttq._i || {};
          ttq._i[id] = [];
          ttq._i[id]._u = src;
          ttq._r = ttq._r || {};
          ttq._r[id] = options;
          var script = d.createElement("script");
          script.type = "text/javascript";
          script.async = true;
          script.src = src + "?sdkid=" + id + "&lib=" + t;
          var first = d.getElementsByTagName("script")[0];
          first.parentNode.insertBefore(script, first);
        };
      }(window, document, "ttq");
    }

    var tp = getTrackingParams();

    pixelIds.forEach(function (id) {
      window.ttq.load(id, {
        ttclid: tp.ttclid || undefined,
      });

      log("[Tracking] TikTok Pixel carregado:", id);
    });

    window.ttq.page();
  }

  function fireTikTokConversion(value, currency, transactionId) {
    if (!cfg.tiktok.enabled || !window.ttq) return;

    validTikTokPixels().forEach(function (id) {
      window.ttq.instance(id).track("CompletePayment", {
        value: parseFloat(value) || 0,
        currency: currency || "BRL",
        order_id: transactionId || "",
        contents: [{ content_id: transactionId || "", content_type: "product" }],
      });

      log("[Tracking] TikTok CompletePayment:", id, "| Valor:", value);
    });
  }

  // ============================================================
  // CONVERSOES
  // ============================================================

  function fireAllConversions(value, currency, transactionId) {
    if (transactionId && hasConversionFired(transactionId)) {
      log("[Tracking] Conversao ja disparada para:", transactionId);
      return;
    }

    log("[Tracking] Disparando conversoes. Valor: R$" + value);
    log("[Tracking] Parametros ativos:", getTrackingParams());

    fireGoogleConversion(value, currency, transactionId);
    fireMetaConversion(value, currency, transactionId);
    fireTikTokConversion(value, currency, transactionId);

    markConversionFired(transactionId);
  }

  // ============================================================
  // POLLING PIX
  // ============================================================

  function startPolling(transactionId, value, currency) {
    if (!transactionId) {
      warn("[Tracking] Polling nao iniciado: sem transactionId/reference");
      return;
    }

    var attempts = 0;
    var maxAttempts = cfg.polling.max_attempts;
    var interval = cfg.polling.interval_ms;

    log("[Tracking] Iniciando polling para:", transactionId);

    var timer = setInterval(function () {
      attempts++;

      if (attempts > maxAttempts) {
        clearInterval(timer);
        warn("[Tracking] Polling encerrado: tempo maximo atingido.");
        return;
      }

      var statusUrl = cfg.worker_url + "/api/pix-status?" + buildTrackingQuery(transactionId).toString();

      fetch(statusUrl, {
        method: "GET",
        headers: { "Accept": "application/json" },
      })
        .then(function (response) {
          return response.json().catch(function () {
            return {};
          });
        })
        .then(function (data) {
          var status = String(data.status || "").toUpperCase();
          log("[Tracking] Status:", status || "-", "| Tentativa:", attempts);

          if (status === "PAID") {
            clearInterval(timer);
            fireAllConversions(value, currency, transactionId);

            window.dispatchEvent(new CustomEvent("pix:paid", {
              detail: {
                transactionId: transactionId,
                value: value,
                trackingParams: getTrackingParams(),
              },
            }));
          }

          if (status === "CANCELLED" || status === "CANCELED" || status === "EXPIRED") {
            clearInterval(timer);
            log("[Tracking] PIX cancelado ou expirado.");

            window.dispatchEvent(new CustomEvent("pix:cancelled", {
              detail: { transactionId: transactionId },
            }));
          }
        })
        .catch(function (err) {
          warn("[Tracking] Erro no polling:", err);
        });
    }, interval);

    return timer;
  }

  // ============================================================
  // API PUBLICA
  // ============================================================

  window.tracking = {
    pixGerado: function (options) {
      options = options || {};

      return startPolling(
        options.reference || options.transactionId || options.id,
        options.value || options.amount || 0,
        options.currency || "BRL"
      );
    },

    getParams: function () {
      return getTrackingParams();
    },

    capture: function () {
      captureUrlParams();
      return getTrackingParams();
    },

    dispararConversao: function (value, currency, transactionId) {
      fireAllConversions(value, currency || "BRL", transactionId || "");
    },
  };

  // ============================================================
  // INICIALIZACAO
  // ============================================================

  function init() {
    captureUrlParams();
    loadGoogleTag();
    loadMetaPixel();
    loadTikTokPixel();
    log("[Tracking] Pixels inicializados.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}());
