// Seed data for Sprint 1 — replace with live Supabase queries in Sprint 2

export const seedTodos = [
  { id: 1, title: 'Take out trash bins', done: false, priority: 'high', due_date: new Date().toISOString() },
  { id: 2, title: 'Call insurance — claim #4482', done: false, priority: 'medium', due_date: null },
  { id: 3, title: 'Order air filters (16x25x1)', done: false, priority: 'low', due_date: null },
  { id: 4, title: 'Set up Google Home bedroom hub', done: true, priority: 'low', due_date: null },
];

export const seedGroceries = [
  { id: 1, name: 'Milk (2%)', done: false, category: 'Dairy', store: 'Meijer' },
  { id: 2, name: 'Chicken thighs', done: false, category: 'Meat', store: 'Meijer' },
  { id: 3, name: 'Spinach', done: false, category: 'Produce', store: 'Meijer' },
  { id: 4, name: 'Laundry detergent', done: false, category: 'Household', store: 'Walmart' },
  { id: 5, name: 'Greek yogurt', done: false, category: 'Dairy', store: 'Meijer' },
  { id: 6, name: 'Bananas', done: false, category: 'Produce', store: 'Jewel-Osco' },
  { id: 7, name: 'Paper towels (bulk)', done: false, category: 'Household', store: "Sam's Club" },
  { id: 8, name: 'Frozen broccoli', done: false, category: 'Frozen', store: 'Walmart' },
];

export const seedEvents = [
  { id: 1, title: 'School pickup early', time: '9:00 AM', date: 'today', owner: 'family', color: '#2563EB' },
  { id: 2, title: 'Dentist (Jacob)', time: '12:00 PM', date: 'today', owner: 'jacob', color: '#059669' },
  { id: 3, title: 'Family dinner', time: '6:00 PM', date: 'today', owner: 'family', color: '#2563EB' },
  { id: 4, title: 'Soccer practice', time: '10:00 AM', date: 'tomorrow', owner: 'family', color: '#2563EB' },
];

export const seedCountdowns = [
  { id: 1, title: 'Summer vacation', target_date: '2025-07-04' },
  { id: 2, title: 'Anniversary', target_date: '2025-06-15' },
];

export const seedMessages = [
  { id: 1, text: 'Remember — early bedtime tonight 🙂', author: 'Wife', created_at: new Date().toISOString() },
];

export const CATEGORIES = ['Produce', 'Dairy', 'Meat', 'Frozen', 'Pantry', 'Beverages', 'Household', 'Personal Care', 'Other'];
export const STORES = ['Meijer', 'Walmart', "Sam's Club", 'Jewel-Osco', 'Butcher'];
export const CATEGORY_ORDER = ['Produce', 'Meat', 'Dairy', 'Frozen', 'Pantry', 'Beverages', 'Household', 'Personal Care', 'Other'];

// ── Sprint 2 seed data ──────────────────────────────

export const seedBills = [
  { id: 1,  name: 'Mortgage',         amount: 1850.00, due_day: 1,  autopay: true,  category: 'Housing',     paid_this_month: true  },
  { id: 2,  name: 'Electricity',      amount: 142.00,  due_day: 8,  autopay: false, category: 'Utilities',   paid_this_month: false },
  { id: 3,  name: 'Internet',         amount: 79.99,   due_day: 12, autopay: true,  category: 'Utilities',   paid_this_month: false },
  { id: 4,  name: 'Car Insurance',    amount: 210.00,  due_day: 15, autopay: true,  category: 'Insurance',   paid_this_month: false },
  { id: 5,  name: 'Car Payment',      amount: 485.00,  due_day: 18, autopay: true,  category: 'Auto',        paid_this_month: false },
  { id: 6,  name: 'Phone',            amount: 95.00,   due_day: 22, autopay: true,  category: 'Utilities',   paid_this_month: false },
  { id: 7,  name: 'Streaming Bundle', amount: 45.00,   due_day: 25, autopay: true,  category: 'Subscriptions', paid_this_month: false },
  { id: 8,  name: 'Gas/Water',        amount: 88.00,   due_day: 28, autopay: false, category: 'Utilities',   paid_this_month: false },
];

export const TODO_LISTS = ['General', 'House', 'Yard', 'Vehicles'];

export const seedTodosByList = {
  General:  [
    { id: 101, title: 'Take out trash bins',        done: false, priority: 'high',   list: 'General' },
    { id: 102, title: 'Call insurance — claim #4482', done: false, priority: 'medium', list: 'General' },
    { id: 103, title: 'Order air filters (16x25x1)', done: false, priority: 'low',    list: 'General' },
    { id: 104, title: 'Set up Google Home bedroom',  done: true,  priority: 'low',    list: 'General' },
  ],
  House: [
    { id: 201, title: 'Caulk master bath shower',   done: false, priority: 'medium', list: 'House' },
    { id: 202, title: 'Replace porch light fixture', done: false, priority: 'low',    list: 'House' },
    { id: 203, title: 'Touch up paint — hallway',   done: false, priority: 'low',    list: 'House' },
  ],
  Yard: [
    { id: 301, title: 'Fertilize front lawn',       done: false, priority: 'medium', list: 'Yard' },
    { id: 302, title: 'Edge driveway border',       done: false, priority: 'low',    list: 'Yard' },
  ],
  Vehicles: [
    { id: 401, title: 'Oil change — truck (overdue)', done: false, priority: 'high',   list: 'Vehicles' },
    { id: 402, title: 'Rotate tires — car',          done: false, priority: 'medium', list: 'Vehicles' },
    { id: 403, title: 'Registration renewal — June', done: false, priority: 'low',    list: 'Vehicles' },
  ],
};

export const BILL_CATEGORIES = ['Housing', 'Utilities', 'Insurance', 'Auto', 'Subscriptions', 'Medical', 'Other'];
