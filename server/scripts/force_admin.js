const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function forceAdmin() {
  const email = 'varsha2103.n@gmail.com';
  console.log(`Searching for user with email: ${email}...`);
  
  try {
    const user = await prisma.user.findFirst({
      where: { email: email }
    });

    if (user) {
      console.log(`Found user: ${user.id}. Current role: ${user.role}. Updating to ADMIN...`);
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' }
      });
      console.log(`Success! User is now: ${updated.role}`);
    } else {
      console.log(`User ${email} not found in database.`);
      console.log('Checking all users to see what exists...');
      const allUsers = await prisma.user.findMany();
      console.log('All Users:', allUsers.map(u => ({ email: u.email, role: u.role })));
    }
  } catch (error) {
    console.error('Database Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceAdmin();
