export interface FirstTouch {
  utm: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  referrer?: string;
  landingUrl?: string;
  landingPath?: string;
  cohort?: string;
  capturedAt: string;
}

const STORAGE_KEY = 'ghac_first_touch';

const safeWindow = () => (typeof window !== 'undefined' ? window : (undefined as any));

export function getFirstTouch(): FirstTouch | null {
  try {
    const raw = safeWindow() ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return null;
    return JSON.parse(raw) as FirstTouch;
  } catch {
    return null;
  }
}

export function saveFirstTouch(data: FirstTouch) {
  try {
    if (!safeWindow()) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function parseFromPage(): FirstTouch | null {
  const w = safeWindow();
  if (!w) return null;

  const params = new URLSearchParams(w.location.search || '');

  const firstTouch: FirstTouch = {
    utm: {
      source: params.get('utm_source') || undefined,
      medium: params.get('utm_medium') || undefined,
      campaign: params.get('utm_campaign') || undefined,
      term: params.get('utm_term') || undefined,
      content: params.get('utm_content') || undefined,
    },
    cohort: params.get('cohort') || undefined,
    referrer: document.referrer || undefined,
    landingUrl: w.location.href,
    landingPath: w.location.pathname,
    capturedAt: new Date().toISOString(),
  };

  return firstTouch;
}

// Capture first-touch only; do not overwrite if present
export function captureFirstTouchTracking(): FirstTouch | null {
  const existing = getFirstTouch();
  if (existing) return existing;
  const parsed = parseFromPage();
  if (parsed) saveFirstTouch(parsed);
  return parsed;
}

