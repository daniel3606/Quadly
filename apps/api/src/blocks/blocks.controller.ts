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
import { BlocksService } from './blocks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('blocks')
@Controller('blocks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Post('users/:userId')
  @ApiOperation({ summary: 'Block a user' })
  async blockUser(
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    return this.blocksService.blockUser(req.user.id, userId);
  }

  @Delete('users/:userId')
  @ApiOperation({ summary: 'Unblock a user' })
  async unblockUser(
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    return this.blocksService.unblockUser(req.user.id, userId);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get list of blocked users' })
  async getBlockedUsers(@Request() req: any) {
    return this.blocksService.getBlockedUsers(req.user.id);
  }
}
