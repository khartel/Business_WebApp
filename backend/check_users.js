const prisma = require('./src/utils/prisma');

async function main() {
  try {
    const users = await prisma.user.findMany();
    console.log('Users in database:', JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Error fetching users:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
