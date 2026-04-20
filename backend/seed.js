const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Client = require('./models/Client');
const Site = require('./models/Site');
const Guard = require('./models/Guard');
const Equipment = require('./models/Equipment');
const Attendance = require('./models/Attendance');
const Salary = require('./models/Salary');
const Invoice = require('./models/Invoice');
const Message = require('./models/Message');

// ─── Helpers ───────────────────────────────────────
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randPhone = () => `9${randInt(100000000, 999999999)}`;
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0, 0, 0, 0); return d; };

// ─── Seed Data ─────────────────────────────────────
const clientsData = [
    { clientName: 'Rajesh Kumar', companyName: 'Infosys Technologies', contactEmail: 'rajesh@infosys.com', contactPhone: '9876543210', address: 'Electronic City, Bangalore', isActive: true },
    { clientName: 'Priya Sharma', companyName: 'Tata Consultancy Services', contactEmail: 'priya@tcs.com', contactPhone: '9823456789', address: 'Hinjewadi, Pune', isActive: true },
    { clientName: 'Amit Patel', companyName: 'Reliance Industries', contactEmail: 'amit@reliance.com', contactPhone: '9912345678', address: 'Navi Mumbai, Maharashtra', isActive: true },
    { clientName: 'Sneha Reddy', companyName: 'Wipro Limited', contactEmail: 'sneha@wipro.com', contactPhone: '9734567890', address: 'Whitefield, Bangalore', isActive: true },
    { clientName: 'Vikram Singh', companyName: 'Adani Group', contactEmail: 'vikram@adani.com', contactPhone: '9845678901', address: 'Ahmedabad, Gujarat', isActive: true },
];

const siteNames = [
    { siteName: 'Infosys Campus Block A', location: 'Electronic City Phase 1, Bangalore' },
    { siteName: 'Infosys Campus Block B', location: 'Electronic City Phase 2, Bangalore' },
    { siteName: 'TCS Synergy Park', location: 'Hinjewadi Phase 2, Pune' },
    { siteName: 'TCS Sahyadri Park', location: 'Hinjewadi Phase 3, Pune' },
    { siteName: 'Reliance Corporate Office', location: 'BKC, Navi Mumbai' },
    { siteName: 'Reliance Refinery Gate', location: 'Jamnagar, Gujarat' },
    { siteName: 'Wipro SEZ Tower', location: 'Whitefield Main Road, Bangalore' },
    { siteName: 'Wipro Sarjapur Campus', location: 'Sarjapur Road, Bangalore' },
    { siteName: 'Adani House HQ', location: 'SG Highway, Ahmedabad' },
    { siteName: 'Adani Port Terminal', location: 'Mundra Port, Gujarat' },
];

const guardNames = [
    'Ramesh Yadav', 'Suresh Patil', 'Mahesh Gupta', 'Rakesh Verma', 'Dinesh Joshi',
    'Ganesh Sharma', 'Naresh Tiwari', 'Mukesh Chauhan', 'Lokesh Mishra', 'Rajendra Singh',
    'Bhupendra Rawat', 'Ashok Meena', 'Santosh Nair', 'Deepak Thakur', 'Anil Pandey',
];

const equipmentTypes = ['Extinguisher', 'Alarm', 'CCTV', 'Hydrant'];
const equipmentPrefixes = {
    Extinguisher: ['ABC Dry Powder', 'CO2', 'Foam', 'Water Mist'],
    Alarm: ['Smoke Detector', 'Heat Detector', 'Manual Call Point', 'Fire Alarm Panel'],
    CCTV: ['Dome Camera', 'Bullet Camera', 'PTZ Camera', 'IP Camera'],
    Hydrant: ['Pillar Hydrant', 'Landing Valve', 'Hose Reel', 'Underground Hydrant'],
};

const chatMessages = [
    'Good morning, all guards please report to duty on time today.',
    'Shift change at Gate 3 completed successfully.',
    'Fire drill scheduled for tomorrow at 10 AM. All guards must participate.',
    'New equipment delivery expected at Site B today.',
    'Security breach reported at Block A. Immediate attention required.',
    'Monthly salary has been processed. Please check your accounts.',
    'CCTV camera at parking lot needs maintenance.',
    'Night shift patrol completed without incidents.',
    'Please update attendance logs before 6 PM today.',
    'Client meeting scheduled at Infosys campus tomorrow.',
    'Guard Ramesh has reported sick today. Need replacement.',
    'Fire extinguishers at TCS campus due for inspection.',
    'All gates must be locked by 10 PM sharp.',
    'Training session for new guards on Wednesday.',
    'Equipment inventory check completed for Wipro SEZ.',
    'Emergency exit signs need replacement at Block B.',
    'Visitor management system updated successfully.',
    'Power backup check done at all sites.',
    'Guard uniform distribution on Friday.',
    'Monthly performance report submitted to admin.',
];

const senderNames = ['Admin', 'Ramesh Yadav', 'Suresh Patil', 'Control Room', 'Supervisor Dinesh', 'Manager Priya'];

// ─── Main Seed Function ────────────────────────────
const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear all collections
        await Promise.all([
            User.deleteMany({}),
            Client.deleteMany({}),
            Site.deleteMany({}),
            Guard.deleteMany({}),
            Equipment.deleteMany({}),
            Attendance.deleteMany({}),
            Salary.deleteMany({}),
            Invoice.deleteMany({}),
            Message.deleteMany({}),
        ]);
        console.log('All collections cleared');

        // 1️⃣ Create Admin User
        const admin = await User.create({
            name: 'Admin',
            email: 'admin@krishafire.com',
            password: 'admin123',
            role: 'Admin',
            isActive: true,
        });
        console.log(`✅ Admin user created: ${admin.email} / admin123`);

        // 2️⃣ Create 5 Clients
        const clients = await Client.insertMany(clientsData);
        console.log(`✅ ${clients.length} clients created`);

        // 3️⃣ Create 10 Sites (linked to clients, 2 per client)
        const siteDocs = siteNames.map((s, i) => ({
            ...s,
            client: clients[Math.floor(i / 2)]._id,
            guards: [],
        }));
        const sites = await Site.insertMany(siteDocs);
        console.log(`✅ ${sites.length} sites created`);

        // 4️⃣ Create 15 Guards (assigned randomly across sites)
        const guardDocs = guardNames.map((name) => ({
            name,
            phone: randPhone(),
            salary: randInt(12000, 25000),
            assignedSite: pick(sites)._id,
            status: Math.random() > 0.15 ? 'active' : 'inactive',
        }));
        const guards = await Guard.insertMany(guardDocs);
        console.log(`✅ ${guards.length} guards created`);

        // Update sites with guard references
        for (const guard of guards) {
            await Site.findByIdAndUpdate(guard.assignedSite, { $addToSet: { guards: guard._id } });
        }
        console.log('✅ Sites updated with guard assignments');

        // 5️⃣ Create 20 Equipment records (linked to sites)
        const eqDocs = [];
        for (let i = 0; i < 20; i++) {
            const type = pick(equipmentTypes);
            eqDocs.push({
                equipmentName: pick(equipmentPrefixes[type]),
                type,
                quantity: randInt(1, 10),
                site: pick(sites)._id,
                lastInspectionDate: daysAgo(randInt(5, 90)),
            });
        }
        const equipment = await Equipment.insertMany(eqDocs);
        console.log(`✅ ${equipment.length} equipment records created`);

        // 6️⃣ Create attendance for last 7 days for active guards
        const activeGuards = guards.filter((g) => g.status === 'active');
        const attDocs = [];
        for (let day = 0; day < 7; day++) {
            const date = daysAgo(day);
            for (const guard of activeGuards) {
                attDocs.push({
                    guard: guard._id,
                    site: guard.assignedSite,
                    date,
                    status: Math.random() > 0.2 ? 'present' : 'absent',
                });
            }
        }
        const attendance = await Attendance.insertMany(attDocs);
        console.log(`✅ ${attendance.length} attendance records created (7 days)`);

        // 7️⃣ Create salary records for current month
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const salDocs = activeGuards.map((guard) => {
            const present = randInt(18, 28);
            return {
                guard: guard._id,
                month: currentMonth,
                totalDaysPresent: present,
                totalSalary: Math.round((guard.salary / 30) * present),
            };
        });
        const salaries = await Salary.insertMany(salDocs);
        console.log(`✅ ${salaries.length} salary records created`);

        // 8️⃣ Create 5 invoices linked to clients
        const invDocs = clients.map((client) => ({
            client: client._id,
            amount: randInt(50000, 200000),
            month: currentMonth,
            status: Math.random() > 0.4 ? 'paid' : 'unpaid',
        }));
        const invoices = await Invoice.insertMany(invDocs);
        console.log(`✅ ${invoices.length} invoices created`);

        // 9️⃣ Create 20 chat messages
        const msgDocs = chatMessages.map((msg, i) => ({
            senderName: pick(senderNames),
            message: msg,
            timestamp: new Date(Date.now() - (20 - i) * 3600000),
        }));
        const messages = await Message.insertMany(msgDocs);
        console.log(`✅ ${messages.length} messages created`);

        console.log('\n🎉 Database seeded successfully!\n');
        console.log('Login credentials:');
        console.log('  Email:    admin@krishafire.com');
        console.log('  Password: admin123\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Seed error:', err);
        process.exit(1);
    }
};

seed();
