const prisma = require('./src/utils/prisma');
const bcrypt = require('bcryptjs');

async function main() {
  try {
    const username = 'romanus';
    const newPassword = 'testing123';
    const passwordHash = await bcrypt.hash(newPassword, 12);

    const user = await prisma.user.update({
      where: { username },
      data: { passwordHash },
    });

    console.log('Password updated for user:', user.username);
  } catch (err) {
    console.error('Error updating password:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
