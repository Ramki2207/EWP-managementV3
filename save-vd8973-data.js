// One-time script to save VD8973 test data to database
// Run this in the browser console while on the EWP app

(async function() {
  console.log('🔍 Looking for VD8973 test data in localStorage...');

  // Find test data for VD8973
  let testData = null;
  let storageKey = null;

  // Search all localStorage keys for VD8973
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('VD8973') || key.includes('verdeler_test_'))) {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          // Check if this looks like test data
          if (parsed.workshopChecklist || parsed.verdelerVanaf630Test || parsed.verdelerTestSimpel) {
            testData = parsed;
            storageKey = key;
            console.log('✅ Found test data in key:', key);
            break;
          }
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }
  }

  if (!testData) {
    console.error('❌ No test data found for VD8973');
    alert('No test data found for VD8973 in localStorage');
    return;
  }

  console.log('📦 Test data:', testData);

  // Determine test type
  let testType = 'workshop_checklist';
  if (testData.verdelerVanaf630Test) testType = 'verdeler_vanaf_630';
  else if (testData.verdelerTestSimpel) testType = 'verdeler_test_simpel';

  console.log('📝 Test type:', testType);

  // Import Supabase client from the app
  const { supabase } = await import('/src/lib/supabase.ts');

  console.log('🔗 Connected to Supabase');

  // Get distributor ID from database
  console.log('🔍 Looking up distributor VD8973...');
  const { data: distributors, error: distError } = await supabase
    .from('distributors')
    .select('id')
    .eq('distributor_id', 'VD8973')
    .maybeSingle();

  if (distError) {
    console.error('❌ Error finding distributor:', distError);
    alert('Error finding distributor: ' + distError.message);
    return;
  }

  if (!distributors) {
    console.error('❌ Distributor VD8973 not found');
    alert('Distributor VD8973 not found in database');
    return;
  }

  const distributorId = distributors.id;
  console.log('✅ Found distributor ID:', distributorId);

  // Save to database
  console.log('💾 Saving test data to database...');
  const { data: savedData, error: saveError } = await supabase
    .from('test_data')
    .insert({
      distributor_id: distributorId,
      test_type: testType,
      data: testData
    })
    .select()
    .single();

  if (saveError) {
    console.error('❌ Error saving to database:', saveError);
    alert('Error saving to database: ' + saveError.message);
    return;
  }

  console.log('✅ SUCCESS! Test data saved to database:', savedData);
  alert('✅ Success! Test data for VD8973 has been saved to the database. Patrick Herman can now see it!');
})();
