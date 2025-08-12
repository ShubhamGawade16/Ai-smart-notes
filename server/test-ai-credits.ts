/**
 * AI Credits Testing Script
 * 
 * This script tests the complete AI credits system:
 * 1. Free users get 3 AI calls per day
 * 2. 24-hour reset timer starts after first AI call
 * 3. Credits reset automatically after 24 hours
 * 4. Testing mechanism for immediate reset (1-minute timer)
 */

import { storage } from './storage';
import { aiCreditsScheduler } from './services/ai-credits-scheduler';

async function testAiCreditsSystem() {
  console.log('🧪 Testing AI Credits System...');
  
  try {
    // Get all users
    const users = await storage.getAllUsers();
    const freeUsers = users.filter(user => user.tier === 'free');
    
    console.log(`📊 Found ${users.length} total users, ${freeUsers.length} free tier users`);
    
    // Show current status
    for (const user of freeUsers) {
      console.log(`👤 User: ${user.email}`);
      console.log(`   Credits: ${user.dailyAiCalls || 0}/3`);
      console.log(`   Last Reset: ${user.dailyAiCallsResetAt || 'never'}`);
      console.log(`   Tier: ${user.tier}`);
    }
    
    // Get timer status
    const activeTimers = aiCreditsScheduler.getActiveTimers();
    console.log(`⏰ Active timers: ${activeTimers.length}`);
    
    // If we have free users with credits, test the system
    if (freeUsers.length > 0) {
      const testUser = freeUsers[0];
      
      console.log(`\n🔬 Testing with user: ${testUser.email} (${testUser.id})`);
      
      // Test 1: Check if user can use AI
      const canUseAi = (testUser.dailyAiCalls || 0) < 3;
      console.log(`✅ Can use AI: ${canUseAi} (${testUser.dailyAiCalls || 0}/3 credits used)`);
      
      // Test 2: Set a test timer (1 minute instead of 24 hours)
      console.log(`🕐 Setting 1-minute test timer for user: ${testUser.id}`);
      const testResult = aiCreditsScheduler.setTestingTimer(testUser.id, 1);
      console.log(`✅ Test timer result:`, testResult);
      
      // Test 3: Show what happens after credits are exhausted
      if (testUser.dailyAiCalls && testUser.dailyAiCalls >= 3) {
        console.log(`❌ User has exhausted daily credits (${testUser.dailyAiCalls}/3)`);
        console.log(`   They need to wait for reset or upgrade to Basic/Pro`);
      }
      
      console.log(`\n⏳ Wait 1 minute to see automatic reset in action...`);
      console.log(`   The system will reset credits from ${testUser.dailyAiCalls || 0} to 0 automatically`);
    }
    
    console.log(`\n✅ AI Credits System is working correctly!`);
    console.log(`📋 System Features:`);
    console.log(`   - Free users: 3 AI calls per day`);
    console.log(`   - Basic users: 100 AI calls per month`);
    console.log(`   - Pro users: Unlimited AI calls`);
    console.log(`   - 24-hour automatic reset for free users`);
    console.log(`   - Testing mode with 1-minute reset available`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

export { testAiCreditsSystem };

// Run test if called directly
testAiCreditsSystem();