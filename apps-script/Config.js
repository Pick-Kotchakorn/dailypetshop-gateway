/**
 * ⚙️ CONFIG.js - Daily Pet Shop (Production Ready — v3.1)
 * Central Configuration & Dependency Validation
 *
 * Fixes v3.1:
 *   [F1] เพิ่ม CACHE_TTL — ป้องกัน getCachedData() ใน SheetService.js TypeError
 *   [F2] เพิ่ม INVENTORY block — ป้องกัน redeemReward() / sendAdminAlert() TypeError
 *   [F3] เพิ่ม SHEET_NAME.NUTRITION + SHEET_NAME.CRM_BENEFITS — ป้องกัน setupDatabase() TypeError
 *
 * Script Properties ที่ต้องตั้งค่า:
 *   REQUIRED: LINE_CHANNEL_ACCESS_TOKEN, LINE_CHANNEL_SECRET, DB_SPREADSHEET_ID, LIFF_ID
 *   OPTIONAL: DF_PROJECT_ID, DF_SERVICE_ACCOUNT_EMAIL, DF_PRIVATE_KEY, ADMIN_WHITELIST, DIALOGFLOW_WEBHOOK
 *
 * Dependencies: ไม่มี — ต้องโหลดเป็นไฟล์แรกสุดใน filePushOrder
 */

let _CONFIG_CACHE = null;

// ═════════════════════════════════════════════════════════════════════════════
// 1. getConfig() — Lazy Initialization + In-Memory Cache
// ═════════════════════════════════════════════════════════════════════════════
function getConfig() {
  if (_CONFIG_CACHE !== null) return _CONFIG_CACHE;

  const props = PropertiesService.getScriptProperties();

  // ── Sensitive keys ────────────────────────────────────────────────────────
  const rawKey    = props.getProperty('DF_PRIVATE_KEY');
  const dfKey     = rawKey ? rawKey.replace(/\\n/g, '\n') : null;
  const liffId    = props.getProperty('LIFF_ID') || '';
  const liffUrl   = liffId ? `https://liff.line.me/${liffId}` : '';
  const whitelist = (props.getProperty('ADMIN_WHITELIST') || '')
                      .split(',').map(s => s.trim()).filter(Boolean);

  _CONFIG_CACHE = {

    // ── LINE ──────────────────────────────────────────────────────────────
    LINE_ACCESS_TOKEN:   props.getProperty('LINE_CHANNEL_ACCESS_TOKEN'),
    LINE_CHANNEL_SECRET: props.getProperty('LINE_CHANNEL_SECRET'),

    // ── Google Sheets ─────────────────────────────────────────────────────
    SPREADSHEET_ID: props.getProperty('DB_SPREADSHEET_ID'),
    SHEET_NAME: {
      FOLLOWERS:     'Followers',
      CONVERSATIONS: 'Conversations',
      MEMBERS:       'Membership',
      REWARDS:       'Rewards',
      ORDERS:        'Orders',
      LOGS:          'Logs',
      PRODUCTS:      'Products',
      NUTRITION:     'Nutrition_Logs',   // [F3]
      CRM_BENEFITS:  'CRM_Benefits'      // [F3]
    },

    // ── Cache ─────────────────────────────────────────────────────────────
    CACHE_TTL: 21600,  // [F1] 6 hours — used by getCachedData() in SheetService.js

    // ── LIFF ──────────────────────────────────────────────────────────────
    LIFF_ID:  liffId,
    LIFF_URL: liffUrl,

    // ── Brand Colors ──────────────────────────────────────────────────────
    COLORS: {
      PRIMARY:   '#C84528',
      SECONDARY: '#FDB814',
      BG_CREAM:  '#FFF4EF',
      TEXT_MAIN: '#4A3F35',
      TIER: {
        BRONZE:   '#C84528',
        SILVER:   '#95A5A6',
        GOLD:     '#D4AF37',
        PLATINUM: '#2C3E50'
      }
    },

    // ── Loyalty & Membership ──────────────────────────────────────────────
    LOYALTY: {
      WELCOME_POINTS: 50,
      THB_PER_TOKEN:  25,
      TIERS: {
        BRONZE:   { NAME: 'Bronze Friend',   THRESHOLD: 0    },
        SILVER:   { NAME: 'Silver Member',   THRESHOLD: 500  },
        GOLD:     { NAME: 'Gold Family',     THRESHOLD: 2000 },
        PLATINUM: { NAME: 'Platinum Family', THRESHOLD: 5000 }
      }
    },

    // ── Inventory & Alerts ────────────────────────────────────────────────
    INVENTORY: {                     // [F2]
      LOW_STOCK_THRESHOLD: 5,        // trigger alert when stock <= this value
      ADMIN_GROUP_ID:      props.getProperty('ADMIN_GROUP_ID') || ''
    },

    // ── Validation ────────────────────────────────────────────────────────
    VALIDATION: {
      PHONE_REGEX:     /^0[0-9]{8,9}$/,
      NAME_MIN_LENGTH: 2
    },

    // ── Rich Menu Aliases ─────────────────────────────────────────────────
    ALIAS: {
      VISITOR: { HOME: 'visitor_tab_home', SHOP: 'visitor_tab_shop', REWARD: 'visitor_tab_reward' },
      MEMBER:  { HOME: 'member_tab_home',  SHOP: 'member_tab_shop',  REWARD: 'member_tab_reward'  }
    },

    // ── Dialogflow ────────────────────────────────────────────────────────
    DF_PROJECT_ID:            props.getProperty('DF_PROJECT_ID')            || '',
    DF_SERVICE_ACCOUNT_EMAIL: props.getProperty('DF_SERVICE_ACCOUNT_EMAIL') || '',
    DF_PRIVATE_KEY:           dfKey,
    DIALOGFLOW_WEBHOOK:       props.getProperty('DIALOGFLOW_WEBHOOK')       || '',

    // ── Admin ─────────────────────────────────────────────────────────────
    ADMIN_WHITELIST: whitelist,

    // ── Nutrition ─────────────────────────────────────────────────────────
    NUTRITION: {
      TRIGGER_TEXT:     'ปรึกษาโภชนาการ',
      TRIAL_SET_POINTS: 0,
      QUESTION_STEPS:   5,
      SHEET_NAME:       'Nutrition_Logs'
    }
  };

  return _CONFIG_CACHE;
}


// ═════════════════════════════════════════════════════════════════════════════
// 2. CONFIG Proxy — Backward Compatibility Shim
//    ไฟล์ที่ยังใช้ CONFIG.xxx จะ delegate มาที่ getConfig().xxx โดยอัตโนมัติ
// ═════════════════════════════════════════════════════════════════════════════
const CONFIG = new Proxy({}, {
  get(target, prop) {
    try {
      const cfg = getConfig();
      if (prop in cfg) return cfg[prop];
      console.warn(`⚠️ [CONFIG] Unknown key: "${String(prop)}"`);
      return undefined;
    } catch (e) {
      console.error(`❌ [CONFIG] getConfig() failed at "${String(prop)}": ${e.message}`);
      return undefined;
    }
  },
  set(target, prop) {
    console.error(`❌ [CONFIG] Read-only — cannot set "${String(prop)}" directly`);
    return false;
  }
});


// ═════════════════════════════════════════════════════════════════════════════
// 3. validateConfig() — Pre-flight check (called in doGet / doPost)
// ═════════════════════════════════════════════════════════════════════════════
function validateConfig() {
  const props = PropertiesService.getScriptProperties();

  const CRITICAL = [
    { key: 'LINE_CHANNEL_ACCESS_TOKEN', label: 'LINE Access Token'   },
    { key: 'LINE_CHANNEL_SECRET',       label: 'LINE Channel Secret' },
    { key: 'DB_SPREADSHEET_ID',         label: 'Spreadsheet ID'      },
    { key: 'LIFF_ID',                   label: 'LIFF ID'             }
  ];
  const OPTIONAL = [
    { key: 'DF_PROJECT_ID',            label: 'Dialogflow Project ID'      },
    { key: 'DF_SERVICE_ACCOUNT_EMAIL', label: 'Dialogflow Service Account' },
    { key: 'DF_PRIVATE_KEY',           label: 'Dialogflow Private Key'     },
    { key: 'ADMIN_WHITELIST',          label: 'Admin Whitelist'            },
    { key: 'ADMIN_GROUP_ID',           label: 'Admin Group ID'             },
    { key: 'DIALOGFLOW_WEBHOOK',       label: 'Dialogflow Webhook URL'     }
  ];

  const missing = CRITICAL.reduce((acc, { key, label }) => {
    const val = props.getProperty(key);
    if (!val || !val.trim()) {
      console.error(`❌ [validateConfig] MISSING: ${key}`);
      acc.push(`${label} (${key})`);
    }
    return acc;
  }, []);

  OPTIONAL.forEach(({ key, label }) => {
    if (!props.getProperty(key)) console.warn(`⚠️ [validateConfig] Not set: ${key} (${label})`);
  });

  // Validate ADMIN_WHITELIST format
  const adminRaw = props.getProperty('ADMIN_WHITELIST') || '';
  if (adminRaw) {
    const lineUid = /^U[0-9a-f]{32}$/;
    adminRaw.split(',').map(s => s.trim()).filter(Boolean).forEach(uid => {
      if (!lineUid.test(uid)) console.warn(`⚠️ [validateConfig] Suspicious UID: "${uid}"`);
    });
  }

  if (missing.length > 0) {
    throw new Error(
      `❌ System cannot start — missing Script Properties:\n` +
      missing.map(f => `  • ${f}`).join('\n') +
      `\n\nGAS Editor → Project Settings → Script Properties`
    );
  }

  console.log('✅ [validateConfig] All critical properties verified');
}


// ═════════════════════════════════════════════════════════════════════════════
// 4. checkIsAdmin() — Admin authorization check
// ═════════════════════════════════════════════════════════════════════════════
function checkIsAdmin(userId) {
  if (!userId || typeof userId !== 'string') {
    console.warn('⚠️ [checkIsAdmin] Invalid userId:', userId);
    return false;
  }
  try {
    const wl = getConfig().ADMIN_WHITELIST;
    if (!wl || wl.length === 0) {
      console.error('❌ [checkIsAdmin] ADMIN_WHITELIST is empty');
      return false;
    }
    return wl.includes(userId.trim());
  } catch (e) {
    console.error('❌ [checkIsAdmin]', e.message);
    return false;
  }
}


// ═════════════════════════════════════════════════════════════════════════════
// 5. Dev Utilities (GAS Editor only — not called in production flow)
// ═════════════════════════════════════════════════════════════════════════════
function _devResetConfigCache() {
  _CONFIG_CACHE = null;
  console.log('🔄 CONFIG cache cleared');
}

function _devPrintConfig() {
  const REDACT = ['LINE_ACCESS_TOKEN', 'LINE_CHANNEL_SECRET', 'DF_PRIVATE_KEY'];
  try {
    const cfg = getConfig();
    const safe = JSON.parse(JSON.stringify(cfg, (k, v) => REDACT.includes(k) && v ? '[REDACTED]' : v));
    console.log('📋 CONFIG:\n' + JSON.stringify(safe, null, 2));
    console.log('LIFF_ID   :', cfg.LIFF_ID        || '❌ NOT SET');
    console.log('LIFF_URL  :', cfg.LIFF_URL        || '❌ NOT SET');
    console.log('SHEET_ID  :', cfg.SPREADSHEET_ID  ? '✅ SET' : '❌ NOT SET');
    console.log('DF_PROJECT:', cfg.DF_PROJECT_ID   || '⚠️ NOT SET');
    console.log('CACHE_TTL :', cfg.CACHE_TTL);
    console.log('ADMINS    :', cfg.ADMIN_WHITELIST.length > 0 ? `✅ ${cfg.ADMIN_WHITELIST.length} admin(s)` : '❌ NONE');
    console.log('INVENTORY :', JSON.stringify(cfg.INVENTORY));
  } catch (e) {
    console.error('❌ [_devPrintConfig]', e.message);
  }
}

function _devCheckProperties() {
  const REQUIRED = [
    'LINE_CHANNEL_ACCESS_TOKEN', 'LINE_CHANNEL_SECRET', 'DB_SPREADSHEET_ID',
    'LIFF_ID', 'DF_PROJECT_ID', 'DF_SERVICE_ACCOUNT_EMAIL', 'DF_PRIVATE_KEY', 'ADMIN_WHITELIST'
  ];
  const props = PropertiesService.getScriptProperties();
  let ok = true;
  REQUIRED.forEach(k => {
    const v = props.getProperty(k);
    if (!v) { console.error(`❌ Missing: ${k}`); ok = false; }
    else console.log(`✅ OK: ${k} = ${k.match(/KEY|TOKEN|SECRET/) ? '[REDACTED]' : v}`);
  });
  console.log(ok ? '🎉 All properties set!' : '⚠️ Fix missing properties before deploying.');
}