import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  public readonly client: PrismaClient;
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: process.env.NODE_ENV === 'production' ? 20 : 5,
    });

    const adapter = new PrismaPg(this.pool);

    this.client = new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });
  }

  async onModuleInit() {
    await this.client.$connect();
    console.log(
      '🚀 [Database]: Prisma connected successfully via PG Pool Adapter.',
    );
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
    await this.pool.end();
    console.log('🛑 [Database]: Prisma and PG Pool disconnected safely.');
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '❌ Critical Security Alert: Cannot clean database in production environment!',
      );
    }

    const results = await this.client.$queryRaw<{ table_name: string }[]>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE' 
        AND table_name != '_prisma_migrations';
    `;

    const tableNames = results.map((r) => `"${r.table_name}"`).join(', ');

    if (!tableNames) return;

    // مسح كافة البيانات وإعادة ترقيم الـ IDs من الصفر مع تخطي قيود العلاقات الآمنة
    await this.client.$executeRawUnsafe(
      `TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`,
    );
    console.log('🧹 [Database]: All tables truncated safely.');
  }
}
