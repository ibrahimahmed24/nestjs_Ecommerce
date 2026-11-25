import { ApiProperty } from '@nestjs/swagger';
import { CategoryResponseDto } from './Category-Response.dto';

class PaginationMetaDto {
  @ApiProperty({
    example: 100,
    description: 'Total number of categories',
  })
  total!: number;

  @ApiProperty({
    example: 1,
    description: 'Current page number',
  })
  page!: number;

  @ApiProperty({
    example: 10,
    description: 'Number of categories per page',
  })
  limit!: number;

  @ApiProperty({
    example: 10,
    description: 'Total number of pages',
  })
  totalPages!: number;

  @ApiProperty({
    example: true,
    description: 'Whether there is a next page',
  })
  hasNextPage!: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether there is a previous page',
  })
  hasPreviousPage!: boolean;
}

export class PaginatedCategoryResponseDto {
  @ApiProperty({
    type: [CategoryResponseDto],
    description: 'List of categories',
  })
  data!: CategoryResponseDto[];

  @ApiProperty({
    type: PaginationMetaDto,
    description: 'Pagination information',
  })
  meta!: PaginationMetaDto;
}