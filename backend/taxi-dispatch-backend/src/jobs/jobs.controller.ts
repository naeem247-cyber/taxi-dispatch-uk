import { Controller, Get, Post, Patch, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CreateJobDto } from './dto/create-job.dto';
import { AssignJobDto } from './dto/assign-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';

@ApiTags('Jobs')
@ApiBearerAuth()
@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.OPERATOR)
  findAll() {
    return this.jobsService.findAll();
  }

  @Post()
  @Roles(Role.ADMIN, Role.OPERATOR)
  create(@Body() dto: CreateJobDto) {
    return this.jobsService.create(dto);
  }

  @Patch(':id/assign')
  @Roles(Role.ADMIN, Role.OPERATOR)
  assign(@Param('id') id: string, @Body() dto: AssignJobDto) {
    return this.jobsService.assign(id, dto.driverId);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.OPERATOR, Role.DRIVER)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateJobStatusDto,
    @Req() req: { user: { userId: string; role: string } },
  ) {
    return this.jobsService.updateStatus(id, dto.status, req.user);
  }
}
