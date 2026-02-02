import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateScheduleInput,
  CreateScheduleItemInput,
  UpdateScheduleInput,
  UpdateScheduleItemInput,
} from '@quadly/shared';

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  async getUserSchedules(userId: string) {
    return this.prisma.schedule.findMany({
      where: { user_id: userId },
      include: {
        items: {
          include: {
            course: true,
          },
          orderBy: [
            { day_of_week: 'asc' },
            { start_minute: 'asc' },
          ],
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getSchedule(scheduleId: string, userId: string) {
    const schedule = await this.prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        user_id: userId,
      },
      include: {
        items: {
          include: {
            course: true,
          },
          orderBy: [
            { day_of_week: 'asc' },
            { start_minute: 'asc' },
          ],
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    return schedule;
  }

  async createSchedule(userId: string, input: CreateScheduleInput) {
    return this.prisma.schedule.create({
      data: {
        user_id: userId,
        name: input.name,
      },
      include: {
        items: true,
      },
    });
  }

  async updateSchedule(
    scheduleId: string,
    userId: string,
    input: UpdateScheduleInput,
  ) {
    const schedule = await this.prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        user_id: userId,
      },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    return this.prisma.schedule.update({
      where: { id: scheduleId },
      data: input,
    });
  }

  async deleteSchedule(scheduleId: string, userId: string) {
    const schedule = await this.prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        user_id: userId,
      },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    await this.prisma.schedule.delete({
      where: { id: scheduleId },
    });
  }

  async createScheduleItem(
    scheduleId: string,
    userId: string,
    input: CreateScheduleItemInput,
  ) {
    // Verify schedule belongs to user
    const schedule = await this.prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        user_id: userId,
      },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    const item = await this.prisma.scheduleItem.create({
      data: {
        schedule_id: scheduleId,
        course_id: input.course_id,
        title: input.title,
        day_of_week: input.day_of_week,
        start_minute: input.start_minute,
        end_minute: input.end_minute,
        location: input.location,
        color: input.color,
      },
      include: {
        course: true,
      },
    });

    // Update total credits cache
    await this.updateCreditsCache(scheduleId);

    return item;
  }

  async updateScheduleItem(
    itemId: string,
    userId: string,
    input: UpdateScheduleItemInput,
  ) {
    const item = await this.prisma.scheduleItem.findUnique({
      where: { id: itemId },
      include: { schedule: true },
    });

    if (!item || item.schedule.user_id !== userId) {
      throw new NotFoundException('Schedule item not found');
    }

    const updated = await this.prisma.scheduleItem.update({
      where: { id: itemId },
      data: input,
      include: {
        course: true,
      },
    });

    // Update total credits cache
    await this.updateCreditsCache(item.schedule_id);

    return updated;
  }

  async deleteScheduleItem(itemId: string, userId: string) {
    const item = await this.prisma.scheduleItem.findUnique({
      where: { id: itemId },
      include: { schedule: true },
    });

    if (!item || item.schedule.user_id !== userId) {
      throw new NotFoundException('Schedule item not found');
    }

    const scheduleId = item.schedule_id;

    await this.prisma.scheduleItem.delete({
      where: { id: itemId },
    });

    // Update total credits cache
    await this.updateCreditsCache(scheduleId);
  }

  private async updateCreditsCache(scheduleId: string) {
    const items = await this.prisma.scheduleItem.findMany({
      where: { schedule_id: scheduleId },
      include: { course: true },
    });

    let totalCredits = 0;
    for (const item of items) {
      if (item.course) {
        totalCredits += item.course.credits_max || item.course.credits_min || 0;
      }
    }

    await this.prisma.schedule.update({
      where: { id: scheduleId },
      data: { total_credits_cached: totalCredits },
    });
  }
}
