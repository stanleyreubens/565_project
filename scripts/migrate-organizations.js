const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateOrganizations() {
  console.log('Starting organization migration...');

  // Get all users without an organization
  const users = await prisma.user.findMany({
    where: { organizationId: null },
    include: { hotels: true }
  });

  console.log(`Found ${users.length} users without an organization`);

  for (const user of users) {
    const emailDomain = user.email.split('@')[1].toLowerCase();
    console.log(`Processing user: ${user.email} (domain: ${emailDomain})`);

    // Find or create organization based on email domain
    let organization = await prisma.organization.findUnique({
      where: { emailDomain }
    });

    if (!organization) {
      const orgName = emailDomain.split('.')[0].charAt(0).toUpperCase() + emailDomain.split('.')[0].slice(1);
      organization = await prisma.organization.create({
        data: {
          name: orgName,
          emailDomain
        }
      });
      console.log(`  Created organization: ${organization.name} (${emailDomain})`);
    } else {
      console.log(`  Found existing organization: ${organization.name}`);
    }

    // Assign user to organization
    await prisma.user.update({
      where: { id: user.id },
      data: { organizationId: organization.id }
    });
    console.log(`  Assigned user to organization`);

    // Assign user's hotels to the same organization
    for (const hotel of user.hotels) {
      if (!hotel.organizationId) {
        await prisma.hotel.update({
          where: { id: hotel.id },
          data: { organizationId: organization.id }
        });
        console.log(`  Assigned hotel "${hotel.name}" to organization`);
      }
    }
  }

  console.log('Organization migration complete!');
}

migrateOrganizations()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
