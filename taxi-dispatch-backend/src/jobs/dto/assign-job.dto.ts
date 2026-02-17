import { IsUUID } from 'class-validator';

export class AssignJobDto {
  @IsUUID()
  driverId: string;
}
