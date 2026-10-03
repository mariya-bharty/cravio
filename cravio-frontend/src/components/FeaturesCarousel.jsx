import React, { useState } from 'react';

const DINER_FEATURES = [
  {
    id: 'd1',
    category: 'Restaurant Discovery',
    title: 'Search & Find Places',
    description: 'Find restaurants by name, cuisine, city, or pincode. View complete menus with current dish pricing, operating hours, and location.',
    listItems: [
      'Search by dish name or cuisine type',
      'Filter results by city and pincode',
      'View accurate menus, pricing, and operating status'
    ]
  },
  {
    id: 'd2',
    category: 'Reservations',
    title: 'Table Bookings',
    description: 'Reserve a table for your chosen date, time slot, and guest count with direct restaurant confirmation.',
    listItems: [
      'Simple online booking form',
      'Select party size and custom time slots',
      'Add guest notes or dietary preferences'
    ]
  },
  {
    id: 'd3',
    category: 'Food Ordering',
    title: 'Delivery & Takeaway',
    description: 'Place food orders directly through the platform and follow your order progress from prep to delivery.',
    listItems: [
      'Digital menu selection & easy checkout',
      'Live order status updates',
      'Order history log to easily re-order your favorite meals'
    ]
  },
  {
    id: 'd4',
    category: 'Decision Helpers',
    title: 'Food Games & Pickers',
    description: 'Fun, interactive tools to help you decide what to eat when you cannot make up your mind.',
    listItems: [
      'Crave Roulette: Spin the wheel for a random local restaurant pick',
      'Flavor Duel: Compare dishes head-to-head to find today\'s craving'
    ]
  }
];

const OWNER_FEATURES = [
  {
    id: 'o1',
    category: 'Profile & Setup',
    title: 'Restaurant Listing',
    description: 'Register and manage your restaurant profile, contact details, operating hours, and business location.',
    listItems: [
      'Set business details, photos, and address',
      'Toggle open/closed status anytime',
      'Configure regular opening and closing hours'
    ]
  },
  {
    id: 'o2',
    category: 'Menu Control',
    title: 'Catalog & Items',
    description: 'Organize your food menu with custom categories, pricing, descriptions, and dish availability.',
    listItems: [
      'Add or edit menu categories and dishes',
      'Upload menu items in bulk',
      'Update item pricing and availability status'
    ]
  },
  {
    id: 'o3',
    category: 'Operations',
    title: 'Orders & Table Requests',
    description: 'Handle incoming delivery orders and table reservation requests from a centralized dashboard.',
    listItems: [
      'Receive real-time order and booking alerts',
      'Accept, process, or update order statuses',
      'View upcoming table reservations'
    ]
  },
  {
    id: 'o4',
    category: 'Insights',
    title: 'Sales Overview',
    description: 'Keep track of daily and monthly restaurant performance with essential sales summaries.',
    listItems: [
      'View total order volume and revenue stats',
      'Monitor popular menu items',
      'Track peak ordering hours'
    ]
  }
];

export default function FeaturesCarousel() {
  const [activeTab, setActiveTab] = useState('diners');

  const activeFeatures = activeTab === 'diners' ? DINER_FEATURES : OWNER_FEATURES;

  return (
    <section id="features" style={styles.section}>
      <div className="container-cravio">
        
        {/* Section Header */}
        <div style={styles.headerBlock}>
          <div>
            <span style={styles.badge}>Platform Features</span>
            <h2 style={styles.title}>What you can do on Cravio</h2>
            <p style={styles.subtitle}>
              A straightforward overview of features available for diners and restaurant partners.
            </p>
          </div>

          {/* Role Toggle Switcher */}
          <div style={styles.tabContainer}>
            <button
              onClick={() => setActiveTab('diners')}
              style={{
                ...styles.tabButton,
                backgroundColor: activeTab === 'diners' ? '#3B4F39' : 'transparent',
                color: activeTab === 'diners' ? '#FFFFFF' : '#686D6A',
                fontWeight: activeTab === 'diners' ? 600 : 500,
              }}
            >
              For Diners
            </button>
            <button
              onClick={() => setActiveTab('owners')}
              style={{
                ...styles.tabButton,
                backgroundColor: activeTab === 'owners' ? '#3B4F39' : 'transparent',
                color: activeTab === 'owners' ? '#FFFFFF' : '#686D6A',
                fontWeight: activeTab === 'owners' ? 600 : 500,
              }}
            >
              For Restaurant Owners
            </button>
          </div>
        </div>

        {/* Clean Static Feature List Grid */}
        <div style={styles.listGrid}>
          {activeFeatures.map((item, index) => (
            <div key={item.id} style={styles.listItemCard}>
              <div style={styles.cardHeader}>
                <span style={styles.indexBadge}>0{index + 1}</span>
                <div>
                  <span style={styles.categoryLabel}>{item.category}</span>
                  <h3 style={styles.itemTitle}>{item.title}</h3>
                </div>
              </div>

              <p style={styles.itemDesc}>{item.description}</p>

              <ul style={styles.bulletList}>
                {item.listItems.map((point, pIdx) => (
                  <li key={pIdx} style={styles.bulletItem}>
                    <span style={styles.bulletDot}>•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

const styles = {
  section: {
    backgroundColor: '#FAF7F2',
    padding: '56px 0 64px',
    borderTop: '1px solid #EAE6DF',
    borderBottom: '1px solid #EAE6DF',
  },
  headerBlock: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: '20px',
    marginBottom: '36px',
  },
  badge: {
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '1px',
    color: '#C27047',
    textTransform: 'uppercase',
    display: 'inline-block',
    marginBottom: '6px',
  },
  title: {
    fontFamily: "'Playfair Display', 'Cormorant Garamond', serif",
    fontSize: '2rem',
    fontWeight: 700,
    color: '#1C1E1D',
    margin: '0 0 8px',
  },
  subtitle: {
    color: '#707572',
    fontSize: '0.92rem',
    maxWidth: '540px',
    lineHeight: 1.5,
    margin: 0,
  },
  tabContainer: {
    display: 'inline-flex',
    padding: '4px',
    backgroundColor: '#EAE5DB',
    borderRadius: '24px',
    gap: '4px',
  },
  tabButton: {
    border: 'none',
    borderRadius: '20px',
    padding: '8px 20px',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: "'Inter', sans-serif",
  },
  listGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
  },
  listItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #EAE6DF',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    marginBottom: '12px',
  },
  indexBadge: {
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#3B4F39',
    backgroundColor: '#EAF0E9',
    padding: '4px 8px',
    borderRadius: '6px',
    fontFamily: 'monospace',
  },
  categoryLabel: {
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#C27047',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'block',
  },
  itemTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.15rem',
    fontWeight: 700,
    color: '#1C1E1D',
    margin: '2px 0 0',
  },
  itemDesc: {
    fontSize: '0.86rem',
    color: '#656A67',
    lineHeight: 1.5,
    margin: '0 0 16px',
  },
  bulletList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    borderTop: '1px solid #F3EFEA',
    paddingTop: '14px',
    marginTop: 'auto',
  },
  bulletItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    fontSize: '0.82rem',
    color: '#333735',
    lineHeight: 1.4,
  },
  bulletDot: {
    color: '#3B4F39',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    lineHeight: 1,
  },
};
