import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CoursesService } from './courses.service';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'Search/browse courses' })
  @ApiQuery({ name: 'query', required: false, description: 'Search query' })
  @ApiQuery({ name: 'subject', required: false, description: 'Filter by subject' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'pageSize', required: false, description: 'Page size' })
  async searchCourses(
    @Query('query') query?: string,
    @Query('subject') subject?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.coursesService.searchCourses({
      query,
      subject,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get('subjects')
  @ApiOperation({ summary: 'Get all course subjects' })
  async getSubjects() {
    return this.coursesService.getSubjects();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  async getCourseById(@Param('id') id: string) {
    return this.coursesService.getCourseById(id);
  }
}
