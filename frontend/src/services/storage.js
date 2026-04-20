// LocalStorage Service - All data management
const STORAGE_KEYS = {
  USERS: 'users',
  CURRENT_USER: 'currentUser',
  CLIENTS: 'clients',
  GUARDS: 'guards',
  EQUIPMENT: 'equipment',
  ATTENDANCE: 'attendance',
  SALARIES: 'salaries',
  INVOICES: 'invoices',
  MESSAGES: 'messages',
};

// Generic storage functions
export const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error getting ${key}:`, error);
      return null;
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting ${key}:`, error);
      return false;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      return false;
    }
  },

  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  },
};

// Initialize default data if not exists
export const initializeStorage = () => {
  // Initialize users with default admin
  if (!storage.get(STORAGE_KEYS.USERS)) {
    storage.set(STORAGE_KEYS.USERS, [
      {
        id: '1',
        name: 'Admin User',
        email: 'admin@krishafire.com',
        password: 'admin123',
        role: 'Admin',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Employee User',
        email: 'employee@krishafire.com',
        password: 'employee123',
        role: 'Employee',
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'HR',
        email: 'hr@krishafire.com',
        password: 'hr123',
        role: 'HR',
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  // Initialize empty arrays for other data
  if (!storage.get(STORAGE_KEYS.CLIENTS)) storage.set(STORAGE_KEYS.CLIENTS, []);
  if (!storage.get(STORAGE_KEYS.GUARDS)) storage.set(STORAGE_KEYS.GUARDS, []);
  if (!storage.get(STORAGE_KEYS.EQUIPMENT)) storage.set(STORAGE_KEYS.EQUIPMENT, []);
  if (!storage.get(STORAGE_KEYS.ATTENDANCE)) storage.set(STORAGE_KEYS.ATTENDANCE, []);
  if (!storage.get(STORAGE_KEYS.SALARIES)) storage.set(STORAGE_KEYS.SALARIES, []);
  if (!storage.get(STORAGE_KEYS.INVOICES)) storage.set(STORAGE_KEYS.INVOICES, []);
  if (!storage.get(STORAGE_KEYS.MESSAGES)) storage.set(STORAGE_KEYS.MESSAGES, []);
};

// Auth functions
export const authService = {
  login: (email, password) => {
    const users = storage.get(STORAGE_KEYS.USERS) || [];
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      storage.set(STORAGE_KEYS.CURRENT_USER, userWithoutPassword);
      return { success: true, user: userWithoutPassword };
    }
    
    return { success: false, error: 'Invalid email or password' };
  },

  signup: (userData) => {
    const users = storage.get(STORAGE_KEYS.USERS) || [];
    
    // Check if email exists
    if (users.find(u => u.email === userData.email)) {
      return { success: false, error: 'Email already exists' };
    }

    const newUser = {
      id: Date.now().toString(),
      ...userData,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    storage.set(STORAGE_KEYS.USERS, users);

    const { password: _, ...userWithoutPassword } = newUser;
    storage.set(STORAGE_KEYS.CURRENT_USER, userWithoutPassword);
    
    return { success: true, user: userWithoutPassword };
  },

  logout: () => {
    storage.remove(STORAGE_KEYS.CURRENT_USER);
    return { success: true };
  },

  getCurrentUser: () => {
    return storage.get(STORAGE_KEYS.CURRENT_USER);
  },
};

// Clients functions
export const clientsService = {
  getAll: () => storage.get(STORAGE_KEYS.CLIENTS) || [],
  
  create: (client) => {
    const clients = storage.get(STORAGE_KEYS.CLIENTS) || [];
    const newClient = {
      id: Date.now().toString(),
      ...client,
      sitesCount: 0,
      guardsCount: 0,
      createdAt: new Date().toISOString(),
    };
    clients.push(newClient);
    storage.set(STORAGE_KEYS.CLIENTS, clients);
    return newClient;
  },
  
  update: (id, updates) => {
    const clients = storage.get(STORAGE_KEYS.CLIENTS) || [];
    const index = clients.findIndex(c => c.id === id);
    if (index !== -1) {
      clients[index] = { ...clients[index], ...updates, updatedAt: new Date().toISOString() };
      storage.set(STORAGE_KEYS.CLIENTS, clients);
      return clients[index];
    }
    return null;
  },
  
  delete: (id) => {
    const clients = storage.get(STORAGE_KEYS.CLIENTS) || [];
    const filtered = clients.filter(c => c.id !== id);
    storage.set(STORAGE_KEYS.CLIENTS, filtered);
    return true;
  },
};

// Guards functions
export const guardsService = {
  getAll: () => storage.get(STORAGE_KEYS.GUARDS) || [],
  
  create: (guard) => {
    const guards = storage.get(STORAGE_KEYS.GUARDS) || [];
    const newGuard = {
      id: Date.now().toString(),
      ...guard,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };
    guards.push(newGuard);
    storage.set(STORAGE_KEYS.GUARDS, guards);
    return newGuard;
  },
  
  update: (id, updates) => {
    const guards = storage.get(STORAGE_KEYS.GUARDS) || [];
    const index = guards.findIndex(g => g.id === id);
    if (index !== -1) {
      guards[index] = { ...guards[index], ...updates, updatedAt: new Date().toISOString() };
      storage.set(STORAGE_KEYS.GUARDS, guards);
      return guards[index];
    }
    return null;
  },
  
  delete: (id) => {
    const guards = storage.get(STORAGE_KEYS.GUARDS) || [];
    const filtered = guards.filter(g => g.id !== id);
    storage.set(STORAGE_KEYS.GUARDS, filtered);
    return true;
  },
};

// Equipment functions
export const equipmentService = {
  getAll: () => storage.get(STORAGE_KEYS.EQUIPMENT) || [],
  
  create: (equipment) => {
    const equipmentList = storage.get(STORAGE_KEYS.EQUIPMENT) || [];
    
    const installDate = new Date(equipment.installDate);
    const maintenanceInterval = parseInt(equipment.maintenanceInterval) || 6;
    const nextMaintenance = new Date(installDate);
    nextMaintenance.setMonth(nextMaintenance.getMonth() + maintenanceInterval);
    
    const newEquipment = {
      id: Date.now().toString(),
      ...equipment,
      lastMaintenance: equipment.installDate,
      nextMaintenance: nextMaintenance.toISOString().split('T')[0],
      status: 'Good',
      createdAt: new Date().toISOString(),
    };
    
    equipmentList.push(newEquipment);
    storage.set(STORAGE_KEYS.EQUIPMENT, equipmentList);
    return newEquipment;
  },
  
  update: (id, updates) => {
    const equipmentList = storage.get(STORAGE_KEYS.EQUIPMENT) || [];
    const index = equipmentList.findIndex(e => e.id === id);
    if (index !== -1) {
      equipmentList[index] = { ...equipmentList[index], ...updates, updatedAt: new Date().toISOString() };
      storage.set(STORAGE_KEYS.EQUIPMENT, equipmentList);
      return equipmentList[index];
    }
    return null;
  },
  
  delete: (id) => {
    const equipmentList = storage.get(STORAGE_KEYS.EQUIPMENT) || [];
    const filtered = equipmentList.filter(e => e.id !== id);
    storage.set(STORAGE_KEYS.EQUIPMENT, filtered);
    return true;
  },
};

// Attendance functions
export const attendanceService = {
  getByDate: (date) => {
    const attendance = storage.get(STORAGE_KEYS.ATTENDANCE) || [];
    return attendance.filter(a => a.date === date);
  },
  
  markAttendance: (guardId, guardName, date, status) => {
    const attendance = storage.get(STORAGE_KEYS.ATTENDANCE) || [];
    const existing = attendance.findIndex(a => a.guardId === guardId && a.date === date);
    
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const record = {
      id: existing !== -1 ? attendance[existing].id : Date.now().toString(),
      guardId,
      guardName,
      date,
      status,
      checkIn: status === 'Present' ? time : '-',
      checkOut: '-',
      createdAt: new Date().toISOString(),
    };
    
    if (existing !== -1) {
      attendance[existing] = record;
    } else {
      attendance.push(record);
    }
    
    storage.set(STORAGE_KEYS.ATTENDANCE, attendance);
    return record;
  },
};

// Salary functions
export const salaryService = {
  getAll: () => storage.get(STORAGE_KEYS.SALARIES) || [],
  
  create: (salary) => {
    const salaries = storage.get(STORAGE_KEYS.SALARIES) || [];
    const newSalary = {
      id: Date.now().toString(),
      ...salary,
      status: 'Unpaid',
      paidDate: null,
      createdAt: new Date().toISOString(),
    };
    salaries.push(newSalary);
    storage.set(STORAGE_KEYS.SALARIES, salaries);
    return newSalary;
  },
  
  markAsPaid: (id) => {
    const salaries = storage.get(STORAGE_KEYS.SALARIES) || [];
    const index = salaries.findIndex(s => s.id === id);
    if (index !== -1) {
      salaries[index].status = 'Paid';
      salaries[index].paidDate = new Date().toISOString().split('T')[0];
      storage.set(STORAGE_KEYS.SALARIES, salaries);
      return salaries[index];
    }
    return null;
  },
  
  delete: (id) => {
    const salaries = storage.get(STORAGE_KEYS.SALARIES) || [];
    const filtered = salaries.filter(s => s.id !== id);
    storage.set(STORAGE_KEYS.SALARIES, filtered);
    return true;
  },
};

// Invoice functions
export const invoiceService = {
  getAll: () => storage.get(STORAGE_KEYS.INVOICES) || [],
  
  create: (invoice) => {
    const invoices = storage.get(STORAGE_KEYS.INVOICES) || [];
    const newInvoice = {
      id: Date.now().toString(),
      invoiceNo: `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
      ...invoice,
      status: 'Unpaid',
      paidDate: null,
      createdAt: new Date().toISOString(),
    };
    invoices.push(newInvoice);
    storage.set(STORAGE_KEYS.INVOICES, invoices);
    return newInvoice;
  },
  
  markAsPaid: (id) => {
    const invoices = storage.get(STORAGE_KEYS.INVOICES) || [];
    const index = invoices.findIndex(i => i.id === id);
    if (index !== -1) {
      invoices[index].status = 'Paid';
      invoices[index].paidDate = new Date().toISOString().split('T')[0];
      storage.set(STORAGE_KEYS.INVOICES, invoices);
      return invoices[index];
    }
    return null;
  },
  
  delete: (id) => {
    const invoices = storage.get(STORAGE_KEYS.INVOICES) || [];
    const filtered = invoices.filter(i => i.id !== id);
    storage.set(STORAGE_KEYS.INVOICES, filtered);
    return true;
  },
};

// Messages functions
export const messagesService = {
  getAll: () => storage.get(STORAGE_KEYS.MESSAGES) || [],
  
  getConversation: (userId1, userId2) => {
    const messages = storage.get(STORAGE_KEYS.MESSAGES) || [];
    return messages.filter(m => 
      (m.senderId === userId1 && m.receiverId === userId2) ||
      (m.senderId === userId2 && m.receiverId === userId1)
    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  },
  
  send: (senderId, receiverId, message) => {
    const messages = storage.get(STORAGE_KEYS.MESSAGES) || [];
    const newMessage = {
      id: Date.now().toString(),
      senderId,
      receiverId,
      message,
      timestamp: new Date().toISOString(),
    };
    messages.push(newMessage);
    storage.set(STORAGE_KEYS.MESSAGES, messages);
    return newMessage;
  },
  
  getConversations: (userId) => {
    const messages = storage.get(STORAGE_KEYS.MESSAGES) || [];
    const users = storage.get(STORAGE_KEYS.USERS) || [];
    
    const conversations = new Map();
    
    messages.forEach(msg => {
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (msg.senderId === userId || msg.receiverId === userId) {
        if (!conversations.has(otherUserId) || 
            new Date(msg.timestamp) > new Date(conversations.get(otherUserId).timestamp)) {
          conversations.set(otherUserId, msg);
        }
      }
    });
    
    return Array.from(conversations.values()).map(msg => {
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const otherUser = users.find(u => u.id === otherUserId);
      return {
        userId: otherUserId,
        userName: otherUser?.name || 'Unknown',
        lastMessage: msg.message,
        timestamp: msg.timestamp,
        unread: 0,
      };
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },
};

export default STORAGE_KEYS;
