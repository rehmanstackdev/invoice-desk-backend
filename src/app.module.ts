import './config/load-env.js';
import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './invoices/invoice.entity.js';
import { InvoiceLineItem } from './invoices/invoice-line-item.entity.js';
import { InvoicesModule } from './invoices/invoices.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();
const observeImports = process.env.OBSERVE_APP_KEY && process.env.OBSERVE_APP_SECRET
  ? [ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY,
      appSecret: process.env.OBSERVE_APP_SECRET,
      serviceId: 'invoice-approval-api',
    })]
  : [];

@Module({
  imports: [
    ...observeImports,
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      entities: [Invoice, InvoiceLineItem],
      synchronize: false,
      migrationsRun: process.env.TYPEORM_MIGRATIONS_RUN === 'true',
      autoLoadEntities: true,
      connectTimeoutMS: 5000,
    }),
    InvoicesModule,
  ],
})
export class AppModule {}
