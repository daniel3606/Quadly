import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BoardsService } from './boards.service';

@ApiTags('boards')
@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all boards' })
  async findAll() {
    return this.boardsService.findAll();
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get board by key' })
  async findByKey(@Param('key') key: string) {
    return this.boardsService.findByKey(key);
  }
}
