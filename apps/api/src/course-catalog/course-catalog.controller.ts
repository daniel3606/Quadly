import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CourseCatalogService } from './course-catalog.service';
import { CourseCatalogCrawlerService, CrawlParams } from './course-catalog-crawler.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('catalog')
export class CourseCatalogController {
  constructor(
    private readonly courseCatalogService: CourseCatalogService,
    private readonly crawlerService: CourseCatalogCrawlerService,
  ) {}

  @Get('courses/search')
  async searchCourses(
    @Query('term') term?: string,
    @Query('subject') subject?: string,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.courseCatalogService.searchCourses({
      term,
      subject,
      q,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('courses/:id')
  async getCourseDetail(@Param('id') id: string) {
    return this.courseCatalogService.getCourseDetail(id);
  }

  @Post('crawl/run')
  @UseGuards(JwtAuthGuard)
  async runCrawl(@Body() params: CrawlParams) {
    const jobId = await this.crawlerService.crawl(params);
    return { jobId };
  }

  @Get('crawl/job/:id')
  async getCrawlJob(@Param('id') id: string) {
    return this.courseCatalogService.getCrawlJob(id);
  }
}
