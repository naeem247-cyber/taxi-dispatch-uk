import { Body, Controller, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { UpdateLocationDto } from './dto/update-location.dto';

@ApiTags('Drivers')
@ApiBearerAuth()
@Controller('drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Patch(':id/location')
  @Roles(Role.DRIVER, Role.OPERATOR, Role.ADMIN)
  updateLocation(@Param('id') id: string, @Body() dto: UpdateLocationDto, @Req() req: { user: { userId: string; role: Role } }) {
    return this.driversService.updateLocation(id, dto, req.user);
  }
}
