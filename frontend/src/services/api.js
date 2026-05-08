const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || '/api/v1';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message = data?.message || `Request failed with ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return data;
}

// Dashboard
export const dashboardApi = {
  summary:      (token) => request('/dashboard/summary',        { token }),
  onDutyForce:  (token) => request('/dashboard/on-duty-force',  { token }),
  onDutyGuards: (token) => request('/dashboard/on-duty-guards', { token }),
};

// Auth
export const authApi = {
  login:    (email, password) => request('/auth/login',    { method: 'POST', body: { email, password } }),
  register: (payload)         => request('/auth/register', { method: 'POST', body: payload }),
  me:       (token)           => request('/auth/me',       { token }),
};

// Clients
export const clientsApi = {
  list:   (token)           => request('/clients',       { token }),
  create: (token, payload)  => request('/clients',       { method: 'POST',  body: payload, token }),
  update: (token, id, data) => request(`/clients/${id}`, { method: 'PATCH', body: data,    token }),
  remove: (token, id)       => request(`/clients/${id}`, { method: 'DELETE',               token }),
};

// Guards
export const guardsApi = {
  list:         (token)           => request('/guards',               { token }),
  create:       (token, data)     => request('/guards',               { method: 'POST',   body: data, token }),
  update:       (token, id, data) => request(`/guards/${id}`,         { method: 'PUT',    body: data, token }),
  remove:       (token, id)       => request(`/guards/${id}`,         { method: 'DELETE',             token }),
  toggleStatus: (token, id, body) => request(`/guards/${id}/status`,  { method: 'PATCH',  body,       token }),
};

// Guard Live Location
export const guardLocationApi = {
  updateLocation: (token, body)       => request('/location/update',         { method: 'POST',  body, token }),
  getAll:         (token)             => request('/location',                 { token }),
  getAllGuards:   (token)             => request('/location/all-guards',      { token }),        // All guards for Admin tracker
  getById:        (token, id)         => request(`/location/${id}`,          { token }),
  setById:        (token, id, body)   => request(`/location/${id}`,          { method: 'PATCH', body, token }),
  assignLocation: (token, id, body)   => request(`/location/${id}/assign`,   { method: 'PATCH', body, token }), // Assign Gujarat location + duty status
};

// Equipment
export const equipmentApi = {
  list:   (token)           => request('/equipment',       { token }),
  create: (token, payload)  => request('/equipment',       { method: 'POST',  body: payload, token }),
  update: (token, id, data) => request(`/equipment/${id}`, { method: 'PATCH', body: data,    token }),
  remove: (token, id)       => request(`/equipment/${id}`, { method: 'DELETE',               token }),
};

// Attendance
export const attendanceApi = {
  getByDate: (token, date)    => request(`/attendance?date=${date}`,   { token }),
  mark:      (token, payload) => request('/attendance',                { method: 'POST', body: payload, token }),
  getByGuard:(token, guardId) => request(`/attendance/guard/${guardId}`,{ token }),
};

// Salaries
export const salariesApi = {
  list:    (token)              => request('/salaries',           { token }),
  create:  (token, payload)     => request('/salaries',           { method: 'POST',  body: payload, token }),
  update:  (token, id, payload) => request(`/salaries/${id}`,    { method: 'PATCH', body: payload, token }),
  remove:  (token, id)          => request(`/salaries/${id}`,    { method: 'DELETE',               token }),
  markPaid:(token, id)          => request(`/salaries/${id}/pay`, { method: 'PATCH',               token }),
};

// Invoices
export const invoicesApi = {
  list:    (token)         => request('/invoices',           { token }),
  create:  (token, payload)=> request('/invoices',           { method: 'POST',  body: payload, token }),
  markPaid:(token, id)     => request(`/invoices/${id}/pay`, { method: 'PATCH',               token }),
  remove:  (token, id)     => request(`/invoices/${id}`,     { method: 'DELETE',              token }),
};

// Messages / Chat
export const messagesApi = {
  list: (token)         => request('/messages', { token }),
  send: (token, payload)=> request('/messages', { method: 'POST', body: payload, token }),
};

// Sites
export const siteApi = {
  list:   (token)              => request('/sites',       { token }),
  create: (token, payload)     => request('/sites',       { method: 'POST',  body: payload, token }),
  update: (token, id, payload) => request(`/sites/${id}`, { method: 'PATCH', body: payload, token }),
  remove: (token, id)          => request(`/sites/${id}`, { method: 'DELETE',               token }),
};

// Reports
export const reportsApi = {
  list:      (token, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reports${qs ? `?${qs}` : ''}`, { token });
  },
  create:    (token, payload) => request('/reports',            { method: 'POST', body: payload, token }),
  get:       (token, id)      => request(`/reports/${id}`,      { token }),
  update:    (token, id, payload) => request(`/reports/${id}`,  { method: 'PUT',  body: payload, token }),
  remove:    (token, id)      => request(`/reports/${id}`,      { method: 'DELETE',              token }),
  analytics: (token)          => request('/reports/analytics',  { token }),
};

// Activities
export const activitiesApi = {
  list:   (token)              => request('/activities',       { token }),
  create: (token, data)        => request('/activities',       { method: 'POST',   body: data, token }),
  update: (token, id, data)    => request(`/activities/${id}`, { method: 'PUT',    body: data, token }),
  delete: (token, id)          => request(`/activities/${id}`, { method: 'DELETE',             token }),
};