import { supabase } from '../lib/supabase';

/**
 * This script assigns random creators to projects that don't have one.
 * Run this once to populate the created_by field for existing projects.
 */
async function assignRandomCreators() {
  try {
    console.log('🔍 Fetching all users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    console.log(`✅ Found ${users.length} users:`, users.map(u => u.username).join(', '));

    console.log('🔍 Fetching projects without creators...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, project_number, created_by')
      .is('created_by', null);

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      return;
    }

    if (!projects || projects.length === 0) {
      console.log('✅ All projects already have creators assigned!');
      return;
    }

    console.log(`📊 Found ${projects.length} projects without creators`);
    console.log('🎲 Assigning random creators...');

    let successCount = 0;
    let errorCount = 0;

    for (const project of projects) {
      // Pick a random user
      const randomUser = users[Math.floor(Math.random() * users.length)];

      console.log(`  - Project ${project.project_number}: Assigning to ${randomUser.username}`);

      const { error: updateError } = await supabase
        .from('projects')
        .update({ created_by: randomUser.id })
        .eq('id', project.id);

      if (updateError) {
        console.error(`    ❌ Error updating project ${project.project_number}:`, updateError);
        errorCount++;
      } else {
        console.log(`    ✅ Updated successfully`);
        successCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  ✅ Successfully updated: ${successCount} projects`);
    console.log(`  ❌ Failed: ${errorCount} projects`);
    console.log('\n✨ Done!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
assignRandomCreators();
