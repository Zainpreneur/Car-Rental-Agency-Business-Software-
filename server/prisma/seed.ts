import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const password = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@fleetrent.com" },
    update: {},
    create: {
      name: "Alex Morgan",
      email: "admin@fleetrent.com",
      password,
      role: "ADMIN",
      phone: "+1-555-0100",
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@fleetrent.com" },
    update: {},
    create: {
      name: "Jamie Lee",
      email: "staff@fleetrent.com",
      password,
      role: "STAFF",
      phone: "+1-555-0101",
    },
  });

  const customer1 = await prisma.user.upsert({
    where: { email: "john.doe@example.com" },
    update: {},
    create: {
      name: "John Doe",
      email: "john.doe@example.com",
      password,
      role: "CUSTOMER",
      phone: "+1-555-0102",
      address: "123 Main St, Springfield",
      licenseNumber: "D1234567",
    },
  });

  const customer2 = await prisma.user.upsert({
    where: { email: "jane.smith@example.com" },
    update: {},
    create: {
      name: "Jane Smith",
      email: "jane.smith@example.com",
      password,
      role: "CUSTOMER",
      phone: "+1-555-0103",
      address: "456 Oak Ave, Shelbyville",
      licenseNumber: "D7654321",
    },
  });

  const vehicleData = [
    {
      make: "Toyota",
      model: "Corolla",
      year: 2023,
      category: "ECONOMY" as const,
      licensePlate: "ECO-1001",
      color: "White",
      seats: 5,
      transmission: "AUTOMATIC" as const,
      fuelType: "PETROL" as const,
      dailyRate: 39.99,
      mileage: 12500,
      imageUrl: "https://images.unsplash.com/photo-1623869675184-f7e9891b19d1?w=800",
      description: "Fuel-efficient and reliable, perfect for city driving.",
      features: "Bluetooth,Backup Camera,USB Charging",
    },
    {
      make: "Honda",
      model: "Civic",
      year: 2022,
      category: "COMPACT" as const,
      licensePlate: "COM-1002",
      color: "Blue",
      seats: 5,
      transmission: "AUTOMATIC" as const,
      fuelType: "PETROL" as const,
      dailyRate: 44.99,
      mileage: 18000,
      imageUrl: "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800",
      description: "Sporty compact with great fuel economy.",
      features: "Bluetooth,Cruise Control,Apple CarPlay",
    },
    {
      make: "Tesla",
      model: "Model 3",
      year: 2024,
      category: "LUXURY" as const,
      licensePlate: "LUX-1003",
      color: "Black",
      seats: 5,
      transmission: "AUTOMATIC" as const,
      fuelType: "ELECTRIC" as const,
      dailyRate: 99.99,
      mileage: 4200,
      imageUrl: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800",
      description: "All-electric luxury sedan with autopilot.",
      features: "Autopilot,Premium Sound,Heated Seats,Supercharging",
    },
    {
      make: "Ford",
      model: "Explorer",
      year: 2023,
      category: "SUV" as const,
      licensePlate: "SUV-1004",
      color: "Gray",
      seats: 7,
      transmission: "AUTOMATIC" as const,
      fuelType: "PETROL" as const,
      dailyRate: 74.99,
      mileage: 9800,
      imageUrl: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800",
      description: "Spacious SUV with plenty of room for the whole family.",
      features: "AWD,3rd Row Seating,Panoramic Roof",
    },
    {
      make: "Mercedes-Benz",
      model: "Sprinter",
      year: 2021,
      category: "VAN" as const,
      licensePlate: "VAN-1005",
      color: "Silver",
      seats: 12,
      transmission: "AUTOMATIC" as const,
      fuelType: "DIESEL" as const,
      dailyRate: 129.99,
      mileage: 32000,
      imageUrl: "https://images.unsplash.com/photo-1601929230983-8756ba409f4c?w=800",
      description: "Ideal for group travel and cargo transport.",
      features: "High Roof,Rear AC,Cargo Space",
    },
    {
      make: "Chevrolet",
      model: "Silverado",
      year: 2022,
      category: "TRUCK" as const,
      licensePlate: "TRK-1006",
      color: "Red",
      seats: 5,
      transmission: "AUTOMATIC" as const,
      fuelType: "PETROL" as const,
      dailyRate: 84.99,
      mileage: 21000,
      imageUrl: "https://images.unsplash.com/photo-1595758228888-a99c73ba9dd7?w=800",
      description: "Heavy-duty pickup truck for work or play.",
      features: "Towing Package,Bed Liner,4x4",
    },
    {
      make: "BMW",
      model: "Z4",
      year: 2023,
      category: "CONVERTIBLE" as const,
      licensePlate: "CNV-1007",
      color: "Red",
      seats: 2,
      transmission: "AUTOMATIC" as const,
      fuelType: "PETROL" as const,
      dailyRate: 119.99,
      mileage: 6100,
      imageUrl: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800",
      description: "Turn heads with this sleek convertible roadster.",
      features: "Convertible Top,Premium Audio,Sport Mode",
    },
    {
      make: "Nissan",
      model: "Altima",
      year: 2021,
      category: "SEDAN" as const,
      licensePlate: "SED-1008",
      color: "Black",
      seats: 5,
      transmission: "AUTOMATIC" as const,
      fuelType: "PETROL" as const,
      dailyRate: 49.99,
      mileage: 27500,
      status: "MAINTENANCE" as const,
      imageUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800",
      description: "Comfortable midsize sedan for everyday driving.",
      features: "Lane Assist,Bluetooth,Keyless Entry",
    },
  ];

  const vehicles = [];
  for (const v of vehicleData) {
    const vehicle = await prisma.vehicle.upsert({
      where: { licensePlate: v.licensePlate },
      update: {},
      create: v,
    });
    vehicles.push(vehicle);
  }

  // Sample maintenance record for the vehicle currently in maintenance
  const nissanAltima = vehicles.find((v) => v.licensePlate === "SED-1008");
  if (nissanAltima) {
    const existingMaintenance = await prisma.maintenanceRecord.findFirst({
      where: { vehicleId: nissanAltima.id },
    });
    if (!existingMaintenance) {
      await prisma.maintenanceRecord.create({
        data: {
          vehicleId: nissanAltima.id,
          type: "SERVICE",
          description: "Scheduled 30,000 mile service and brake inspection",
          cost: 320,
          startDate: new Date(),
          status: "IN_PROGRESS",
        },
      });
    }
  }

  // Sample bookings
  const corolla = vehicles.find((v) => v.licensePlate === "ECO-1001")!;
  const explorer = vehicles.find((v) => v.licensePlate === "SUV-1004")!;

  const existingBooking = await prisma.booking.findFirst({ where: { customerId: customer1.id } });
  if (!existingBooking) {
    const start1 = new Date();
    const end1 = new Date();
    end1.setDate(end1.getDate() + 3);
    await prisma.booking.create({
      data: {
        bookingNumber: `BK-${Date.now().toString(36).toUpperCase()}-A1`,
        customerId: customer1.id,
        vehicleId: corolla.id,
        startDate: start1,
        endDate: end1,
        pickupLocation: "Downtown Branch",
        dropoffLocation: "Downtown Branch",
        status: "CONFIRMED",
        dailyRate: corolla.dailyRate,
        totalAmount: Number((corolla.dailyRate * 3).toFixed(2)),
      },
    });

    const start2 = new Date();
    start2.setDate(start2.getDate() - 10);
    const end2 = new Date();
    end2.setDate(end2.getDate() - 5);
    const pastBooking = await prisma.booking.create({
      data: {
        bookingNumber: `BK-${Date.now().toString(36).toUpperCase()}-B2`,
        customerId: customer2.id,
        vehicleId: explorer.id,
        startDate: start2,
        endDate: end2,
        pickupLocation: "Airport Branch",
        dropoffLocation: "Airport Branch",
        status: "COMPLETED",
        dailyRate: explorer.dailyRate,
        totalAmount: Number((explorer.dailyRate * 5).toFixed(2)),
        actualPickupAt: start2,
        actualReturnAt: end2,
      },
    });

    await prisma.payment.create({
      data: {
        bookingId: pastBooking.id,
        amount: pastBooking.totalAmount,
        method: "CARD",
        status: "PAID",
        transactionRef: "TXN-DEMO-0001",
        paidAt: end2,
      },
    });
  }

  console.log("Seed complete.");
  console.log("---------------------------------------------");
  console.log("Demo accounts (password: password123):");
  console.log(`  Admin:    ${admin.email}`);
  console.log(`  Staff:    ${staff.email}`);
  console.log(`  Customer: ${customer1.email}`);
  console.log(`  Customer: ${customer2.email}`);
  console.log("---------------------------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
