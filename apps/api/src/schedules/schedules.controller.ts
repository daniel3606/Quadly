import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  createScheduleSchema,
  updateScheduleSchema,
  createScheduleItemSchema,
  updateScheduleItemSchema,
} from '@quadly/shared';

@ApiTags('schedules')
@Controller('schedules')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all schedules for current user' })
  async getUserSchedules(@Request() req: any) {
    return this.schedulesService.getUserSchedules(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get schedule by ID' })
  async getSchedule(@Param('id') id: string, @Request() req: any) {
    return this.schedulesService.getSchedule(id, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new schedule' })
  async createSchedule(@Request() req: any, @Body() body: unknown) {
    const input = createScheduleSchema.parse(body);
    return this.schedulesService.createSchedule(req.user.id, input);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a schedule' })
  async updateSchedule(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: unknown,
  ) {
    const input = updateScheduleSchema.parse(body);
    return this.schedulesService.updateSchedule(id, req.user.id, input);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a schedule' })
  async deleteSchedule(@Param('id') id: string, @Request() req: any) {
    return this.schedulesService.deleteSchedule(id, req.user.id);
  }

  @Post(':scheduleId/items')
  @ApiOperation({ summary: 'Add item to schedule' })
  async createScheduleItem(
    @Param('scheduleId') scheduleId: string,
    @Request() req: any,
    @Body() body: unknown,
  ) {
    const input = createScheduleItemSchema.parse(body);
    return this.schedulesService.createScheduleItem(
      scheduleId,
      req.user.id,
      input,
    );
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update a schedule item' })
  async updateScheduleItem(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: unknown,
  ) {
    const input = updateScheduleItemSchema.parse(body);
    return this.schedulesService.updateScheduleItem(id, req.user.id, input);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Delete a schedule item' })
  async deleteScheduleItem(@Param('id') id: string, @Request() req: any) {
    return this.schedulesService.deleteScheduleItem(id, req.user.id);
  }
}
