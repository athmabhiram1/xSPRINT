#!/usr/bin/env node

/**
 * Log Cleanup Utility
 * Removes old log files to prevent disk space issues
 */

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../logs');
const MAX_AGE_DAYS = 7; // Keep logs for 7 days

function cleanupLogs() {
    console.log('🧹 Starting log cleanup...\n');

    if (!fs.existsSync(LOG_DIR)) {
        console.log('📁 Log directory does not exist. Nothing to clean.\n');
        return;
    }

    const now = Date.now();
    const maxAge = MAX_AGE_DAYS * 24 * 60 * 60 * 1000; // Convert days to milliseconds

    let deletedCount = 0;
    let totalSize = 0;

    const files = fs.readdirSync(LOG_DIR);

    for (const file of files) {
        const filePath = path.join(LOG_DIR, file);
        const stats = fs.statSync(filePath);

        if (stats.isFile() && file.endsWith('.log')) {
            const age = now - stats.mtimeMs;

            if (age > maxAge) {
                const sizeKB = (stats.size / 1024).toFixed(2);
                console.log(`🗑️  Deleting: ${file} (${sizeKB} KB, ${Math.floor(age / (24 * 60 * 60 * 1000))} days old)`);

                fs.unlinkSync(filePath);
                deletedCount++;
                totalSize += stats.size;
            }
        }
    }

    if (deletedCount === 0) {
        console.log('✅ No old logs to delete.\n');
    } else {
        const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
        console.log(`\n✅ Cleanup complete!`);
        console.log(`   Files deleted: ${deletedCount}`);
        console.log(`   Space freed: ${totalSizeMB} MB\n`);
    }
}

// Run cleanup
try {
    cleanupLogs();
} catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
}
