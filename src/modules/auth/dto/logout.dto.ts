import { IsNotEmpty, IsString } from 'class-validator';

export class LogoutDto {
  @IsString({ message: 'refresh token must be a string' })
  @IsNotEmpty({ message: 'refresh token is required' })
  refreshToken!: string;
}
