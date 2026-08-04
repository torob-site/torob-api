import { Controller, Get, Post } from '@nestjs/common';
import { TicketService } from './ticket.service';

@Controller('users/me/tickets')
export class TicketController {
  constructor(private ticketService: TicketService) {}

  @Get()
  async all() {}

  @Post()
  async create() {}
}
