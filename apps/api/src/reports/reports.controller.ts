import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { reportSchema } from '@quadly/shared';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a report' })
  async create(@Request() req: any, @Body() body: unknown) {
    const input = reportSchema.parse(body);
    return this.reportsService.create(req.user.id, input);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'moderator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all reports (admin/moderator only)' })
  async findAll(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.reportsService.findAll(
      status,
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 20,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'moderator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get report by ID (admin/moderator only)' })
  async findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'moderator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update report status (admin/moderator only)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'RESOLVED' | 'REJECTED' },
  ) {
    return this.reportsService.updateStatus(id, body.status);
  }
}
