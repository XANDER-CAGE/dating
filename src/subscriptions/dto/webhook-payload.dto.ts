import { IsNotEmpty, IsString, IsObject } from 'class-validator';

export class WebhookPayloadDto {
  @IsString()
  @IsNotEmpty()
  provider: string;

  @IsObject()
  @IsNotEmpty()
  payload: any;
}