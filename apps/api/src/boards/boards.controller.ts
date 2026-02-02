import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BoardsService } from './boards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// ============================================
// STATIC ROUTES CONTROLLER
// This controller handles all static routes and must be registered FIRST
// ============================================
@ApiTags('boards')
@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all boards' })
  async findAll() {
    return this.boardsService.findAll();
  }

  @Get('pinned')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pinned boards for current user' })
  async getPinnedBoards(@Request() req: any) {
    return this.boardsService.getPinnedBoards(req.user.id);
  }
}

// ============================================
// DYNAMIC ROUTES CONTROLLER
// This controller handles parameterized routes and must be registered AFTER BoardsController
// to ensure static routes like /boards/pinned are matched first
// ============================================
@ApiTags('boards')
@Controller('boards')
export class BoardDetailController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post(':key/pin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pin a board' })
  async pinBoard(@Param('key') key: string, @Request() req: any) {
    return this.boardsService.pinBoard(req.user.id, key);
  }

  @Delete(':key/pin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unpin a board' })
  async unpinBoard(@Param('key') key: string, @Request() req: any) {
    return this.boardsService.unpinBoard(req.user.id, key);
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get board by key' })
  async findByKey(@Param('key') key: string) {
    return this.boardsService.findByKey(key);
  }
}
