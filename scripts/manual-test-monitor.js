import { chromium } from 'playwright';

async function manualTestMonitor() {
    console.log('🎯 Starting manual test monitor...');
    
    const browser = await chromium.launch({ 
        headless: false,
        devtools: true 
    });
    
    const page = await browser.newPage();
    
    // Track ALL console messages to see what we're missing
    let totalMessages = 0;
    let errorCount = 0;
    let infiniteLoopCount = 0;
    
    page.on('console', msg => {
        totalMessages++;
        const text = msg.text();
        const type = msg.type();
        
        // Log ALL console activity to see what's happening
        console.log(`[${type.toUpperCase()}] ${text}`);
        
        if (type === 'error') {
            errorCount++;
            console.log(`🚨 ERROR #${errorCount}: ${text}`);
        }
        
        // Try to catch infinite loops with multiple patterns
        if (text.includes('effect_update_depth_exceeded') || 
            text.includes('Maximum update depth exceeded') ||
            text.includes('infinite loop') ||
            text.includes('Last ten effects were')) {
            infiniteLoopCount++;
            console.log(`🔥 INFINITE LOOP DETECTED #${infiniteLoopCount}: ${text}`);
        }
    });
    
    // Also listen for page errors
    page.on('pageerror', error => {
        console.log(`🚨 PAGE ERROR: ${error.message}`);
        if (error.message.includes('effect_update_depth_exceeded')) {
            infiniteLoopCount++;
            console.log(`🔥 PAGE ERROR INFINITE LOOP #${infiniteLoopCount}`);
        }
    });
    
    try {
        // Navigate to app
        console.log('🎯 Loading app...');
        await page.goto('http://localhost:5179');
        await page.waitForTimeout(3000);
        
        console.log('✅ App loaded');
        console.log(`📊 Total console messages so far: ${totalMessages}`);
        console.log(`📊 Errors so far: ${errorCount}`);
        console.log(`📊 Infinite loops so far: ${infiniteLoopCount}`);
        
        console.log('\n🎯 MANUAL TEST INSTRUCTIONS:');
        console.log('1. Click a start position in the browser window');
        console.log('2. Click an option');
        console.log('3. Watch this console for infinite loop detection');
        console.log('4. Press Ctrl+C when done testing');
        
        // Keep monitoring indefinitely
        let checkCount = 0;
        while (true) {
            await page.waitForTimeout(2000);
            checkCount++;
            
            if (checkCount % 5 === 0) { // Every 10 seconds
                console.log(`\n📊 Status check #${checkCount}:`);
                console.log(`  Total console messages: ${totalMessages}`);
                console.log(`  Total errors: ${errorCount}`);
                console.log(`  Infinite loops detected: ${infiniteLoopCount}`);
                
                if (infiniteLoopCount > 0) {
                    console.log('🔥 INFINITE LOOPS HAVE BEEN DETECTED!');
                }
            }
        }
        
    } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
    }
}

// Run the monitor
manualTestMonitor().catch(console.error);
