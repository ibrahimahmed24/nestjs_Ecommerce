import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Electronics',
    description: 'The name of the category',
    minLength: 3,
    maxLength: 50,
  })
  @IsString({ message: 'Category name must be a string' })
  @IsNotEmpty({ message: 'Category name is required' })
  @Length(3, 50, {
    message: 'Category name must be between 3 and 50 characters',
  })
  @MaxLength(50)
  name!: string;

  @ApiProperty({
    example: 'A category for electronic products',
    description: 'A brief description of the category',
    required: false,
    nullable: true,
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string | null;

  @ApiProperty({
    example: 'https://example.com',
    description: 'The URL of the category image',
    required: false,
    nullable: true,
    maxLength: 50,
  })
  @IsString({ message: 'Image URL must be a string' })
  @IsOptional()
  imageUrl?: string | null;

  @ApiProperty({
    example: true,
    description: 'Indicates if the category is active',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
