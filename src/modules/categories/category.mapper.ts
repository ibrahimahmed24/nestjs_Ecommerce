import { Injectable } from '@nestjs/common';
import { Category } from '@prisma/client';
import { CategoryResponseDto } from './dto/Category-Response.dto';

@Injectable()
export class CategoryMapper {
  toResponseDto(category: Category, productCount = 0): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      imageUrl: category.imageUrl,
      slug: category.slug,
      isActive: category.isActive,
      productCount,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
