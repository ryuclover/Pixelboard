const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.userItem.deleteMany();
  await prisma.shopItem.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.game.deleteMany();
  await prisma.friend.deleteMany();
  await prisma.user.deleteMany();

  // Create shop items
  const shopItems = await prisma.shopItem.createMany({
    data: [
      { name: 'Dragon Avatar', description: 'A fierce dragon', icon: '🐉', price: 150, type: 'avatar' },
      { name: 'Gold Border', description: 'Fancy gold border', icon: '✨', price: 200, type: 'border' },
      { name: 'Fire Theme', description: 'Fiery effects', icon: '🔥', price: 300, type: 'cosmetic' },
      { name: 'Ice King Avatar', description: 'Frozen royalty', icon: '👑', price: 250, type: 'avatar' },
      { name: 'Rainbow Aura', description: 'Colorful vibration', icon: '🌈', price: 400, type: 'cosmetic' },
      { name: 'Shadow Cloak', description: 'Dark mystique', icon: '🖤', price: 180, type: 'cosmetic' },
      { name: 'Neon Glow', description: 'Bright neon effects', icon: '⚡', price: 220, type: 'cosmetic' },
      { name: 'Sunset', description: 'Beautiful sunset theme', icon: '🌅', price: 190, type: 'border' }
    ]
  });

  console.log(`✅ Created ${shopItems.count} shop items`);

  // Create test users
  const bcrypt = require('bcrypt');
  const users = [];
  
  for (let i = 1; i <= 5; i++) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        username: `TestPlayer${i}`,
        password: hashedPassword,
        avatar: ['🧙‍♂️', '🧝‍♀️', '⛵', '🧛', '🤖'][i - 1],
        coins: 500 + i * 100,
        gamesPlayed: 10 + i * 5,
        gamesWon: 3 + i * 2
      }
    });
    users.push(user);
  }

  console.log(`✅ Created ${users.length} test users`);

  // Create some friendships
  await prisma.friend.create({
    data: { userId: users[0].id, friendId: users[1].id }
  });
  await prisma.friend.create({
    data: { userId: users[1].id, friendId: users[0].id }
  });

  console.log('✅ Created friendships');

  // Create test chat messages
  await prisma.chatMessage.createMany({
    data: [
      { userId: users[0].id, username: users[0].username, avatar: users[0].avatar, message: 'Hey everyone!' },
      { userId: users[1].id, username: users[1].username, avatar: users[1].avatar, message: 'Lets play chess!' },
      { userId: users[2].id, username: users[2].username, avatar: users[2].avatar, message: 'Anyone up for damas?' }
    ]
  });

  console.log('✅ Created chat messages');
  console.log('✨ Database seeded successfully!');
}

main()
  .catch(e => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
