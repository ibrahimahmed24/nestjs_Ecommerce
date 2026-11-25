import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({
    description: '(UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: '(Email)',
    example: 'user@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    nullable: true,
  })
  firstName!: string | null;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    nullable: true,
  })
  lastName!: string | null;

  @ApiProperty({
    description: '(Role)',
    enum: Role,
    example: 'USER',
  })
  role!: Role;

  @ApiProperty({
    description: '(Created At)',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt!: Date;
  @ApiProperty({
    description: '(Updated At)',
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt!: Date;
}
