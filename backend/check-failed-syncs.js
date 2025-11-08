import prisma from './src/config/database.js';

async function checkFailedSyncs() {
  try {
    console.log('Fetching failed sync items...\n');
    
    const failedItems = await prisma.syncQueue.findMany({
      where: {
        status: 'FAILED'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${failedItems.length} failed items:\n`);

    failedItems.forEach((item, index) => {
      console.log(`\n=== Failed Item ${index + 1} ===`);
      console.log(`ID: ${item.id}`);
      console.log(`Type: ${item.entityType}`);
      console.log(`Entity ID: ${item.entityId}`);
      console.log(`Operation: ${item.operation}`);
      console.log(`Priority: ${item.priority}`);
      console.log(`Retry Count: ${item.retryCount}`);
      console.log(`Created: ${item.createdAt}`);
      console.log(`Error: ${item.errorMessage || 'No error message'}`);
      console.log(`Data Preview: ${JSON.stringify(item.payload).substring(0, 200)}...`);
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkFailedSyncs();
