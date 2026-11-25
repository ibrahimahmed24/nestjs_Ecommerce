import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The current password of the user',
    example: 'currentPassword123',
  })
  currentPassword!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The new password for the user',
    example: 'newPassword123',
  })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  newPassword!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Confirmation of the new password',
    example: 'newPassword123',
  })
  confirmNewPassword!: string;
}
