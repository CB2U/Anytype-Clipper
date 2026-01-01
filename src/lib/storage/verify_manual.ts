import { StorageManager } from './storage-manager';
import { AppSettings } from './schema';

/**
 * Run manual verification of StorageManager.
 * Call this from background.ts console or on startup to verify behavior.
 */
export async function verifyStorageManager() {
    console.log('🧪 Starting StorageManager Verification...');
    const storage = StorageManager.getInstance();

    try {
        // 1. Clear all data
        console.log('1. Clearing data...');
        await storage.clear();
        console.log('   ✅ Cleared.');

        // 2. Check Defaults
        console.log('2. Checking defaults...');
        const settings = await storage.get('settings');
        console.assert(settings.theme === 'system', 'Default theme should be system');
        console.assert(settings.apiPort === 31009, 'Default port should be 31009');
        console.log('   ✅ Defaults verified:', settings);

        // 3. Set Data
        console.log('3. Setting custom data...');
        const newSettings: AppSettings = { theme: 'dark', apiPort: 8080, defaultSpaceId: 'space_123' };
        await storage.set('settings', newSettings);
        console.log('   ✅ Data set.');

        // 4. Get Data
        console.log('4. Reading back data...');
        const readSettings = await storage.get('settings');
        console.assert(readSettings.theme === 'dark', 'Theme should be dark');
        console.assert(readSettings.apiPort === 8080, 'Port should be 8080');
        console.log('   ✅ Read verified:', readSettings);

        // 5. Quota Check
        console.log('5. Checking quota...');
        await storage.checkQuota();
        const bytes = await storage.getBytesInUse();
        console.log(`   ✅ Quota check run. Bytes used: ${bytes}`);

        console.log('🎉 StorageManager Verification Complete!');
    } catch (error) {
        console.error('❌ Verification Failed:', error);
    }
}
