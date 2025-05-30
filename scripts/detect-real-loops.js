import { chromium } from 'playwright';

async function detectRealLoops() {
    console.log('🎯 Starting REAL infinite loop detection...');
    
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true 
    });
    
    const page = await browser.newPage();
    
    // Track ALL console messages to catch the real infinite loops
    let infiniteLoopCount = 0;
    const allMessages = [];
    
    page.on('console', msg => {
        const text = msg.text();
        const type = msg.type();
        
        allMessages.push({ text, type, timestamp: Date.now() });
        
        // Detect infinite loop errors with the exact patterns from your console
        if (text.includes('effect_update_depth_exceeded') || 
            text.includes('Maximum update depth exceeded') ||
            text.includes('Uncaught Svelte error: effect_update_depth_exceeded')) {
            infiniteLoopCount++;
            console.log(`🚨 INFINITE LOOP #${infiniteLoopCount}: ${text}`);
        }
        
        // Also log any error messages
        if (type === 'error') {
            console.log(`❌ ERROR: ${text}`);
        }
    });
    
    // Navigate to app
    await page.goto('http://localhost:5179');
    await page.waitForTimeout(3000);
    
    console.log('🎯 App loaded, waiting for start position...');
    
    // Wait for start position elements
    await page.waitForSelector('.start-pos-picker .pictograph-container', { timeout: 10000 });
    
    console.log('🎯 Clicking start position...');
    await page.locator('.start-pos-picker .pictograph-container').first().click();
    await page.waitForTimeout(2000);
    
    console.log(`📊 Infinite loops after start position: ${infiniteLoopCount}`);
    
    // Wait for options to load
    await page.waitForSelector('.option', { timeout: 10000 });
    const optionCount = await page.locator('.option').count();
    console.log(`📊 Found ${optionCount} options`);
    
    console.log('🎯 Clicking option to trigger infinite loops...');
    
    const beforeClick = infiniteLoopCount;
    
    // Click the first option
    await page.locator('.option').first().click();
    
    console.log('✅ Option clicked, monitoring for infinite loops...');
    
    // Monitor for 10 seconds to catch the infinite loops
    for (let i = 0; i < 20; i++) {
        await page.waitForTimeout(500);
        
        const currentLoops = infiniteLoopCount;
        const newLoops = currentLoops - beforeClick;
        
        console.log(`📊 Check ${i + 1}: ${newLoops} new infinite loops (total: ${currentLoops})`);
        
        if (newLoops > 0) {
            console.log('🚨 INFINITE LOOPS DETECTED AFTER OPTION CLICK!');
            
            // Show recent console messages
            console.log('\n📋 RECENT CONSOLE MESSAGES:');
            const recentMessages = allMessages.filter(msg => 
                msg.timestamp > Date.now() - 10000
            ).slice(-20);
            
            recentMessages.forEach((msg, index) => {
                console.log(`  ${index + 1}. [${msg.type}] ${msg.text}`);
            });
            
            console.log('\n🔧 CONCLUSION: Option click triggers infinite loops!');
            console.log('🔧 The setTimeout in optionPickerState.svelte.ts:275 is the trigger.');
            console.log('🔧 Need to find which effect is being triggered by the beat-added event.');
            
            break;
        }
    }
    
    console.log('\n📋 FINAL REPORT:');
    console.log(`Total infinite loops detected: ${infiniteLoopCount}`);
    console.log(`Loops triggered by option click: ${infiniteLoopCount - beforeClick}`);
    
    if (infiniteLoopCount > beforeClick) {
        console.log('🚨 CONFIRMED: Option selection causes infinite loops!');
    } else {
        console.log('✅ No infinite loops detected from option selection');
    }
    
    console.log('\n🔍 Browser kept open for manual inspection...');
    
    // Keep browser open
    // await browser.close();
}

detectRealLoops().catch(console.error);
