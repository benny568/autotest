/**
 * Zephyr Scale Cloud REST v2 helpers (Bearer token).
 * @see https://support.smartbear.com/zephyr-scale/
 */

const BASE = 'https://api.zephyrscale.smartbear.com/v2';

async function parseJsonRes(res) {
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`Zephyr ${res.status}: ${text.slice(0, 500)}`);
  }
  return data;
}

export function getToken() {
  const t = process.env.ZEPHYR_API_TOKEN;
  if (!t) throw new Error('ZEPHYR_API_TOKEN not set');
  return t;
}

export async function getTestCase(testCaseKey, token = getToken()) {
  const res = await fetch(`${BASE}/testcases/${encodeURIComponent(testCaseKey)}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  return parseJsonRes(res);
}

/**
 * Scale expects a full testcase on PUT; merge with GET result.
 */
export async function updateTestCaseName(testCaseKey, newName, token = getToken()) {
  const current = await getTestCase(testCaseKey, token);
  const body = { ...current, name: newName };
  const res = await fetch(`${BASE}/testcases/${encodeURIComponent(testCaseKey)}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  return parseJsonRes(res);
}

/**
 * @param {{ projectKey: string, testCaseKey: string, testCycleKey: string, statusName: string, comment?: string }} payload
 */
export async function createTestExecution(payload, token = getToken()) {
  const res = await fetch(`${BASE}/testexecutions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return parseJsonRes(res);
}
