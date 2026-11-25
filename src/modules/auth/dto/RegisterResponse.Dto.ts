import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty({
    example:
      'Registration successful. Please check your email to verify your account.',
    description:
      'Message confirming successful registration and instructing the user to check their email for verification.',
  })
  message!: string;
}
