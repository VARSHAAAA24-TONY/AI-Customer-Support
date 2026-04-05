const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const dotenv = require('dotenv');
dotenv.config();

async function checkAdmin() {
  console.log('Checking database for admin users...');
  try {
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users:`);
    users.forEach(u => {
      console.log(`- ${u.email} [${u.role}] (ClerkId: ${u.clerkId})`);
    });
    
    const targetEmail = 'varsha2103.n@gmail.com';
    const targetUser = users.find(u => u.email === targetEmail);
    
    if (targetUser) {
      if (targetUser.role !== 'ADMIN') {
        console.log(`Updating ${targetEmail} to ADMIN...`);
        await prisma.user.update({
          where: { email: targetEmail },
          data: { role: 'ADMIN' }
        });
        console.log('SUCCESS: Role updated to ADMIN.');
      } else {
        console.log(`${targetEmail} is already ADMIN.`);
      }
    } else {
      console.log(`WARNING: ${targetEmail} not found in database. Log in once to create the record.`);
    }
  } catch (err) {
    console.error('ERROR reaching database:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
