const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === "object" && payload?.message ? payload.message : "Request failed";
    throw new Error(message);
  }

  return payload;
}

export async function login(role, email, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ role, email, password }),
  });
}

export async function registerDonor(payload) {
  return request("/auth/register/donor", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function registerRecipient(payload) {
  return request("/auth/register/recipient", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchDonors(params = {}) {
  return request(`/donors${buildQuery(params)}`);
}

export async function fetchDonorEligibility(donorCode) {
  return request(`/donors/eligibility/${donorCode}`);
}

export async function fetchRecipients(params = {}) {
  return request(`/recipients${buildQuery(params)}`);
}

export async function searchRecipientBanks(params = {}) {
  return request(`/recipients/search-banks${buildQuery(params)}`);
}

export async function fetchBloodBanks(params = {}) {
  return request(`/blood-banks${buildQuery(params)}`);
}

export async function fetchBloodBankSummary(bankCode) {
  return request(`/blood-banks/${bankCode}/summary`);
}

export async function fetchInventory(params = {}) {
  return request(`/inventory${buildQuery(params)}`);
}

export async function fetchDonations(params = {}) {
  return request(`/donations${buildQuery(params)}`);
}

export async function fetchRecipientRequests(params = {}) {
  return request(`/requests/recipient${buildQuery(params)}`);
}

export async function fetchDonorRequests(params = {}) {
  return request(`/requests/donor${buildQuery(params)}`);
}

export async function createRecipientRequest(payload) {
  return request("/requests/recipient", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createDonorRequest(payload) {
  return request("/requests/donor", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateRecipientRequestStatus(requestCode, status) {
  return request(`/requests/recipient/${requestCode}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function updateDonorRequestStatus(requestCode, status, units = 1) {
  return request(`/requests/donor/${requestCode}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, units }),
  });
}

function buildQuery(params) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}
