import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto.js';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto.js';
import { InvoiceStatus } from './invoice-status.js';
import { InvoicesService } from './invoices.service.js';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  findAll(@Query('status') status?: string) {
    if (status && !Object.values(InvoiceStatus).includes(status as InvoiceStatus)) {
      throw new BadRequestException(`Unsupported invoice status: ${status}`);
    }
    return this.invoicesService.findAll(status as InvoiceStatus | undefined);
  }

  @Post()
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(createInvoiceDto);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.invoicesService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateStatusDto: UpdateInvoiceStatusDto,
  ) {
    return this.invoicesService.updateStatus(id, updateStatusDto.status);
  }
}