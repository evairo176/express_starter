import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.createMany({
    data: [
      {
        name: 'Andi Saputra',
        email: 'andi.it@company.com',
        password: 'password123',
        role: 'pic_it',
        isEmailVerified: true,
      },
      {
        name: 'Budi Pratama',
        email: 'budi.it@company.com',
        password: 'password123',
        role: 'pic_it',
        isEmailVerified: true,
      },
      {
        name: 'Cahyo Nugroho',
        email: 'cahyo.it@company.com',
        password: 'password123',
        role: 'pic_it',
        isEmailVerified: true,
      },
      {
        name: 'Dimas Setiawan',
        email: 'dimas.it@company.com',
        password: 'password123',
        role: 'pic_it',
        isEmailVerified: true,
      },
      {
        name: 'Eko Prasetyo',
        email: 'eko.it@company.com',
        password: 'password123',
        role: 'pic_it',
        isEmailVerified: true,
      },
      {
        name: 'Fajar Hidayat',
        email: 'fajar.it@company.com',
        password: 'password123',
        role: 'pic_it',
        isEmailVerified: true,
      },
      {
        name: 'Gilang Ramadhan',
        email: 'gilang.it@company.com',
        password: 'password123',
        role: 'pic_it',
        isEmailVerified: true,
      },
      {
        name: 'Hendra Wijaya',
        email: 'hendra.it@company.com',
        password: 'password123',
        role: 'pic_it',
        isEmailVerified: true,
      },
      {
        name: 'Indra Kurniawan',
        email: 'indra.it@company.com',
        password: 'password123',
        role: 'pic_it',
        isEmailVerified: true,
      },
      {
        name: 'Joko Santoso',
        email: 'joko.it@company.com',
        password: 'password123',
        role: 'pic_it',
        isEmailVerified: true,
      },
    ],
    skipDuplicates: true,
  });

  console.log('10 PIC IT users created');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
