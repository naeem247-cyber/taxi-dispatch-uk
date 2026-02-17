import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateJobDto {
  @IsUUID()
  customerId: string;

  @IsString()
  pickupAddress: string;

  @IsString()
  dropoffAddress: string;

  @IsOptional()
  @IsDateString()
  scheduledFor?: string;
}
