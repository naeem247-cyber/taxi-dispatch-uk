import { IsOptional, IsUUID } from 'class-validator';

export class AssignJobDto {
  @IsOptional()
  @IsUUID()
  driverId?: string;
}
