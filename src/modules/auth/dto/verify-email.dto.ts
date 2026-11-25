import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    example: 'user@example.com',
    description:
      'The email address of the user whose email needs to be verified',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: '123456',
    description:
      'Verification code (OTP) consisting of 6 digits sent via email',
  })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, {
    message: 'Verification code must be 6 digits',
  })
  otp!: string;
}
