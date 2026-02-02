import { Module } from '@nestjs/common';
import { CourseCatalogController } from './course-catalog.controller';
import { CourseCatalogService } from './course-catalog.service';
import { CourseCatalogCrawlerService } from './course-catalog-crawler.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CourseCatalogController],
  providers: [CourseCatalogService, CourseCatalogCrawlerService],
  exports: [CourseCatalogService],
})
export class CourseCatalogModule {}
