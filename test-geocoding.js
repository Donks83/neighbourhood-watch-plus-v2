// Test script for UK postcode geocoding
// Run with: node test-geocoding.js

const MAPTILER_API_KEY = 'YOUR_API_KEY_HERE'; // Replace with your actual key

// Test postcodes
const testQueries = [
  'TS19 7ER',     // Your example - Fairfield area
  'TS197ER',      // Same without space
  'ts19 7er',     // Lowercase
  'TS19',         // Partial postcode
  'SW1A 1AA',     // Buckingham Palace
  'EH1 2NG',      // Edinburgh
  'CF10 3NQ',     // Cardiff
  'Fairfield Street, Stockton',
  'Stockton-on-Tees',
];

async function testSearch(query) {
  console.log(`\n🔍 Testing: "${query}"`);
  
  // Format postcode if detected
  let searchQuery = query.trim();
  const ukPostcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
  
  if (ukPostcodeRegex.test(searchQuery)) {
    searchQuery = searchQuery.toUpperCase();
    if (!searchQuery.includes(' ') && searchQuery.length >= 5) {
      searchQuery = searchQuery.slice(0, -3) + ' ' + searchQuery.slice(-3);
    }
    searchQuery = `${searchQuery}, UK`;
    console.log(`  📮 Formatted as UK postcode: "${searchQuery}"`);
  } else {
    if (!searchQuery.toLowerCase().includes('uk')) {
      searchQuery = `${searchQuery}, UK`;
    }
    console.log(`  📍 Formatted as location: "${searchQuery}"`);
  }
  
  const encodedQuery = encodeURIComponent(searchQuery);
  const url = `https://api.maptiler.com/geocoding/${encodedQuery}.json?` +
    `key=${MAPTILER_API_KEY}` +
    `&country=GB,UK` +
    `&limit=5` +
    `&types=place,postcode,address,poi` +
    `&language=en`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      console.log(`  ✅ Found ${data.features.length} results:`);
      data.features.slice(0, 3).forEach((feature, i) => {
        const [lng, lat] = feature.center;
        console.log(`    ${i + 1}. ${feature.place_name}`);
        console.log(`       Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        console.log(`       Type: ${feature.place_type.join(', ')}`);
      });
    } else {
      console.log(`  ❌ No results found`);
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }
}

// Check if running in Node.js
if (typeof window === 'undefined') {
  // Node.js environment - need to install node-fetch
  console.log('Running geocoding tests...');
  console.log('Note: You need to install node-fetch: npm install node-fetch');
  console.log('And replace YOUR_API_KEY_HERE with your actual MapTiler API key\n');
  
  // Import fetch for Node.js
  import('node-fetch').then(module => {
    global.fetch = module.default;
    
    // Run tests
    (async () => {
      for (const query of testQueries) {
        await testSearch(query);
        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
      }
      console.log('\n✨ Testing complete!');
    })();
  }).catch(() => {
    console.log('Please install node-fetch: npm install node-fetch');
  });
} else {
  // Browser environment
  console.log('You can paste this into browser console to test');
}
