import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({
    description: '(UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;
  @ApiProperty({
    example: 'Electronics',
    description: 'The name of the category',
    minLength: 3,
    maxLength: 50,
  })
  name!: string;
  @ApiProperty({
    example: 'A category for electronic products',
    description: 'A brief description of the category',
    required: false,
    nullable: true,
  })
  description!: string | null;
  @ApiProperty({
    example: 'https://example.com',
    description: 'The URL of the category image',
    required: false,
    nullable: true,
  })
  imageUrl?: string | null;
  @ApiProperty({
    example: 'electronics',
    description: 'The slug of the category',
  })
  slug!: string;

  @ApiProperty({
    example: true,
    description: 'Indicates if the category is active',
  })
  isActive!: boolean;

  @ApiProperty({
    example: 150,
    description: 'number of Product  in this category',
  })
  productCount!: number;

  @ApiProperty({
    example: '2026-09-16T12:30:00.000Z',
    description: 'The date when the category was created',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2026-09-16T14:45:00.000Z',
    description: 'The date when the category was last updated',
  })
  updatedAt!: Date;
}
