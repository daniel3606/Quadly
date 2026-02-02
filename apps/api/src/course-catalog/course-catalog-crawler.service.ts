import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { chromium, Browser, Page } from 'playwright';
import * as cheerio from 'cheerio';

export interface CrawlParams {
  term?: string;
  subject?: string;
  query?: string;
}

export interface CourseListItem {
  subjectCode: string;
  courseNumber: string;
  title: string;
  detailUrl?: string;
}

export interface CourseDetail {
  subjectCode: string;
  courseNumber: string;
  title: string;
  description?: string;
  creditMin?: number;
  creditMax?: number;
  prerequisiteText?: string;
}

@Injectable()
export class CourseCatalogCrawlerService {
  private readonly logger = new Logger(CourseCatalogCrawlerService.name);
  private readonly baseUrl =
    'https://webapps.lsa.umich.edu/CrsMaint/Public/CB_PublicBulletin.aspx?crselevel=ug';
  private readonly minDelayMs = 1000; // Minimum delay between requests
  private readonly maxDelayMs = 3000; // Maximum delay between requests

  constructor(private prisma: PrismaService) {}

  /**
   * Random delay to avoid rate limiting
   */
  private async delay(): Promise<void> {
    const delayMs =
      this.minDelayMs +
      Math.random() * (this.maxDelayMs - this.minDelayMs);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  /**
   * Parse prerequisite text and attempt to structure it
   */
  private parsePrerequisite(rawText: string): {
    parsed: any;
    confidence: number;
  } {
    if (!rawText || rawText.trim().length === 0) {
      return { parsed: null, confidence: 0 };
    }

    const text = rawText.trim();
    let confidence = 0.3; // Base confidence

    // Try to detect common patterns
    const patterns = {
      and: /\b(and|&)\b/gi,
      or: /\b(or|\/)\b/gi,
      parentheses: /\([^)]+\)/g,
      courseCode: /\b[A-Z]{2,6}\s+\d{3,4}\b/g,
      minCredit: /minimum\s+(\d+)\s+credit/i,
      concurrent: /concurrent|concurrently/i,
    };

    const parsed: any = {
      raw: text,
      hasAnd: patterns.and.test(text),
      hasOr: patterns.or.test(text),
      hasParentheses: patterns.parentheses.test(text),
      courses: text.match(patterns.courseCode) || [],
    };

    // Extract minimum credit requirement
    const creditMatch = text.match(patterns.minCredit);
    if (creditMatch) {
      parsed.minCredit = parseInt(creditMatch[1], 10);
      confidence += 0.2;
    }

    // Check for concurrent enrollment
    if (patterns.concurrent.test(text)) {
      parsed.concurrent = true;
      confidence += 0.1;
    }

    // If we found course codes, increase confidence
    if (parsed.courses.length > 0) {
      confidence += Math.min(0.3, parsed.courses.length * 0.1);
    }

    // If we have structure indicators, increase confidence
    if (parsed.hasAnd || parsed.hasOr || parsed.hasParentheses) {
      confidence += 0.2;
    }

    confidence = Math.min(1.0, confidence);

    return { parsed, confidence };
  }

  /**
   * Extract course list from the search results page
   */
  private async extractCourseList(page: Page): Promise<CourseListItem[]> {
    const courses: CourseListItem[] = [];

    // Wait for results to load
    await page.waitForSelector('table, .course-listing, [id*="course"]', {
      timeout: 10000,
    }).catch(() => {
      this.logger.warn('No course results found on page');
    });

    const content = await page.content();
    const $ = cheerio.load(content);

    // Try multiple selectors to find course listings
    // The actual structure may vary, so we try common patterns
    $('tr').each((_, element) => {
      const $row = $(element);
      const text = $row.text().trim();

      // Look for course code pattern (e.g., "ASIAN 101")
      const courseMatch = text.match(/\b([A-Z]{2,6})\s+(\d{3,4})\b/);
      if (courseMatch) {
        const subjectCode = courseMatch[1];
        const courseNumber = courseMatch[2];

        // Try to extract title (usually follows course number)
        const titleMatch = text.match(
          new RegExp(`${courseNumber}\\s+([^\\n]+)`, 'i'),
        );
        const title = titleMatch
          ? titleMatch[1].trim().substring(0, 200)
          : '';

        // Try to find detail link
        const detailLink = $row.find('a[href*="CB_PublicBulletin"]').attr('href');

        if (subjectCode && courseNumber) {
          courses.push({
            subjectCode,
            courseNumber,
            title: title || `${subjectCode} ${courseNumber}`,
            detailUrl: detailLink
              ? new URL(detailLink, this.baseUrl).toString()
              : undefined,
          });
        }
      }
    });

    // Alternative: Look for links with course codes
    $('a[href*="CB_PublicBulletin"]').each((_, element) => {
      const $link = $(element);
      const href = $link.attr('href');
      const text = $link.text().trim();
      const courseMatch = text.match(/\b([A-Z]{2,6})\s+(\d{3,4})\b/);

      if (courseMatch && href) {
        const subjectCode = courseMatch[1];
        const courseNumber = courseMatch[2];
        const title = text.replace(courseMatch[0], '').trim();

        // Avoid duplicates
        if (
          !courses.some(
            (c) =>
              c.subjectCode === subjectCode &&
              c.courseNumber === courseNumber,
          )
        ) {
          courses.push({
            subjectCode,
            courseNumber,
            title: title || `${subjectCode} ${courseNumber}`,
            detailUrl: new URL(href, this.baseUrl).toString(),
          });
        }
      }
    });

    return courses;
  }

  /**
   * Extract course details from detail page
   */
  private async extractCourseDetail(
    page: Page,
    subjectCode: string,
    courseNumber: string,
  ): Promise<CourseDetail> {
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
      this.logger.warn('Page load timeout, proceeding anyway');
    });

    const content = await page.content();
    const $ = cheerio.load(content);

    const detail: CourseDetail = {
      subjectCode,
      courseNumber,
      title: '',
    };

    // Extract title
    const titleSelectors = [
      'h1',
      'h2',
      '[id*="title"]',
      '.course-title',
      'td:contains("Title")',
    ];
    for (const selector of titleSelectors) {
      const titleEl = $(selector).first();
      if (titleEl.length && titleEl.text().trim()) {
        detail.title = titleEl.text().trim().substring(0, 500);
        break;
      }
    }

    // Extract description
    const descSelectors = [
      '[id*="description"]',
      '.course-description',
      'td:contains("Description")',
      'p:contains("Description")',
    ];
    for (const selector of descSelectors) {
      const descEl = $(selector).first();
      if (descEl.length) {
        const descText = descEl.text().trim() || descEl.next().text().trim();
        if (descText && descText.length > 20) {
          detail.description = descText.substring(0, 5000);
          break;
        }
      }
    }

    // Extract credits
    const creditText = $('body').text();
    const creditMatch = creditText.match(
      /(\d+)\s*(?:to|-|–)\s*(\d+)\s*credit/i,
    );
    if (creditMatch) {
      detail.creditMin = parseInt(creditMatch[1], 10);
      detail.creditMax = parseInt(creditMatch[2], 10);
    } else {
      const singleCreditMatch = creditText.match(/(\d+)\s*credit/i);
      if (singleCreditMatch) {
        const credits = parseInt(singleCreditMatch[1], 10);
        detail.creditMin = credits;
        detail.creditMax = credits;
      }
    }

    // Extract prerequisite
    const prereqSelectors = [
      ':contains("Prerequisite")',
      ':contains("Prereq")',
      '[id*="prereq"]',
    ];
    for (const selector of prereqSelectors) {
      const prereqEl = $(selector).first();
      if (prereqEl.length) {
        let prereqText = prereqEl.text().trim();
        if (!prereqText || prereqText.length < 10) {
          prereqText = prereqEl.next().text().trim();
        }
        if (prereqText && prereqText.length > 10) {
          detail.prerequisiteText = prereqText.substring(0, 2000);
          break;
        }
      }
    }

    return detail;
  }

  /**
   * Set up search filters on the page
   */
  private async setupSearchFilters(
    page: Page,
    params: CrawlParams,
  ): Promise<void> {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Set term if provided
    if (params.term) {
      try {
        await page.selectOption('select[name*="term"], select[id*="term"]', {
          label: params.term,
        });
        await this.delay();
      } catch (error) {
        this.logger.warn(`Could not set term filter: ${params.term}`);
      }
    }

    // Set subject if provided
    if (params.subject) {
      try {
        await page.selectOption(
          'select[name*="subject"], select[id*="subject"]',
          {
            label: params.subject,
          },
        );
        await this.delay();
      } catch (error) {
        this.logger.warn(`Could not set subject filter: ${params.subject}`);
      }
    }

    // Set listings per page to maximum
    try {
      await page.selectOption(
        'select[name*="page"], select[id*="page"], select[name*="perPage"]',
        { label: '100' },
      );
      await this.delay();
    } catch (error) {
      this.logger.warn('Could not set listings per page');
    }

    // Enter query if provided
    if (params.query) {
      try {
        const queryInput = page.locator(
          'input[name*="query"], input[id*="query"], input[type="text"]',
        ).first();
        await queryInput.fill(params.query);
        await this.delay();
      } catch (error) {
        this.logger.warn(`Could not set query: ${params.query}`);
      }
    }
  }

  /**
   * Click search button and wait for results
   */
  private async executeSearch(page: Page): Promise<void> {
    // Try to find and click search button
    const searchButton = page.locator(
      'input[type="submit"][value*="Search"], button:has-text("Search"), input[value="Search"]',
    ).first();

    if (await searchButton.isVisible({ timeout: 5000 })) {
      await searchButton.click();
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await this.delay();
    } else {
      this.logger.warn('Search button not found, page may already show results');
    }
  }

  /**
   * Main crawl method
   */
  async crawl(params: CrawlParams): Promise<string> {
    // Create crawl job
    const job = await this.prisma.crawlJob.create({
      data: {
        status: 'PENDING',
        term: params.term,
        subject: params.subject,
        query: params.query,
        params: params as any,
      },
    });

    // Run crawl asynchronously
    this.runCrawl(job.id, params).catch((error) => {
      this.logger.error(`Crawl job ${job.id} failed:`, error);
    });

    return job.id;
  }

  /**
   * Execute the crawl job
   */
  private async runCrawl(jobId: string, params: CrawlParams): Promise<void> {
    let browser: Browser | null = null;

    try {
      // Update job status
      await this.prisma.crawlJob.update({
        where: { id: jobId },
        data: {
          status: 'RUNNING',
          started_at: new Date(),
        },
      });

      // Launch browser
      browser = await chromium.launch({
        headless: true,
      });
      const page = await browser.newPage();

      // Navigate to base URL
      this.logger.log(`Navigating to ${this.baseUrl}`);
      await page.goto(this.baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await this.delay();

      // Set up filters
      await this.setupSearchFilters(page, params);

      // Execute search
      await this.executeSearch(page);

      // Extract course list
      this.logger.log('Extracting course list...');
      const courseList = await this.extractCourseList(page);
      this.logger.log(`Found ${courseList.length} courses`);

      await this.prisma.crawlJob.update({
        where: { id: jobId },
        data: {
          pages_fetched: 1,
          courses_found: courseList.length,
        },
      });

      // Process each course
      let savedCount = 0;
      for (const courseItem of courseList) {
        try {
          await this.processCourse(page, courseItem, params.term);
          savedCount++;
          await this.delay();

          // Update progress every 10 courses
          if (savedCount % 10 === 0) {
            await this.prisma.crawlJob.update({
              where: { id: jobId },
              data: { courses_saved: savedCount },
            });
          }
        } catch (error) {
          this.logger.error(
            `Failed to process course ${courseItem.subjectCode} ${courseItem.courseNumber}:`,
            error,
          );
        }
      }

      // Update final status
      await this.prisma.crawlJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          finished_at: new Date(),
          courses_saved: savedCount,
        },
      });

      this.logger.log(`Crawl job ${jobId} completed. Saved ${savedCount} courses.`);
    } catch (error) {
      this.logger.error(`Crawl job ${jobId} failed:`, error);
      await this.prisma.crawlJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          finished_at: new Date(),
          error_log: error instanceof Error ? error.message : String(error),
        },
      });
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Process a single course (save to database)
   */
  private async processCourse(
    page: Page,
    courseItem: CourseListItem,
    term?: string,
  ): Promise<void> {
    let detail: CourseDetail | null = null;

    // Try to fetch detail if URL is available
    if (courseItem.detailUrl) {
      try {
        await page.goto(courseItem.detailUrl, {
          waitUntil: 'networkidle',
          timeout: 15000,
        });
        await this.delay();
        detail = await this.extractCourseDetail(
          page,
          courseItem.subjectCode,
          courseItem.courseNumber,
        );
      } catch (error) {
        this.logger.warn(
          `Failed to fetch detail for ${courseItem.subjectCode} ${courseItem.courseNumber}`,
        );
      }
    }

    // Use detail data if available, otherwise use list data
    const courseData = detail || {
      subjectCode: courseItem.subjectCode,
      courseNumber: courseItem.courseNumber,
      title: courseItem.title,
    };

    // Upsert course
    const course = await this.prisma.courseCatalogCourse.upsert({
      where: {
        subject_code_course_number: {
          subject_code: courseData.subjectCode,
          course_number: courseData.courseNumber,
        },
      },
      update: {
        title: courseData.title,
        description: courseData.description,
        credit_min: courseData.creditMin,
        credit_max: courseData.creditMax,
        last_seen_term: term,
        source_url: courseItem.detailUrl,
        updated_at: new Date(),
      },
      create: {
        subject_code: courseData.subjectCode,
        course_number: courseData.courseNumber,
        title: courseData.title,
        description: courseData.description,
        credit_min: courseData.creditMin,
        credit_max: courseData.creditMax,
        last_seen_term: term,
        source_url: courseItem.detailUrl,
      },
    });

    // Save prerequisite if available
    if (detail?.prerequisiteText) {
      const { parsed, confidence } = this.parsePrerequisite(
        detail.prerequisiteText,
      );

      const existing = await this.prisma.coursePrerequisite.findFirst({
        where: { course_id: course.id },
      });

      if (existing) {
        await this.prisma.coursePrerequisite.update({
          where: { id: existing.id },
          data: {
            raw_text: detail.prerequisiteText,
            parsed_json: parsed as any,
            confidence,
            updated_at: new Date(),
          },
        });
      } else {
        await this.prisma.coursePrerequisite.create({
          data: {
            course_id: course.id,
            raw_text: detail.prerequisiteText,
            parsed_json: parsed as any,
            confidence,
          },
        });
      }
    }
  }
}
