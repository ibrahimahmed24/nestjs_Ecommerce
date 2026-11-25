import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/Category-Response.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import slugify from 'slugify';
import { Prisma } from '@prisma/client';
import { CategoryMapper } from './category.mapper';
import { CategoryQueryDto } from './dto/category-query.dto';
import { PaginatedCategoryResponseDto } from './dto/paginated-category-response.dto';
import { map } from 'rxjs';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoryMapper: CategoryMapper,
  ) {}
  async create(
    createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const { name, description, imageUrl, isActive } = createCategoryDto;

    const slug = this.generateSlug(name);

    const existingCategory = await this.prisma.client.category.findFirst({
      where: { OR: [{ name }, { slug }] },
      select: { id: true },
    });
    if (existingCategory) {
      throw new ConflictException(
        'Category with this name or slug already exists',
      );
    }
    
      const category = await this.prisma.client.category.create({
        data: { name, description, imageUrl, slug, isActive: isActive ?? true },
      });

      return this.categoryMapper.toResponseDto(category, 0);
   
  }

async findAll(queryDto: CategoryQueryDto): Promise<PaginatedCategoryResponseDto> {
    const { page = 1, limit = 10, search, isActive  ,sortBy, sortOrder } = queryDto;
    const skip = (page - 1) * limit;

    const where: Prisma.CategoryWhereInput = {} ;


      if (search){
       where.OR = [
         {
          name:{contains:search , mode:'insensitive'}
         },
         {
          description:{
            contains:search, mode:'insensitive'
          }
         }
       ]
        }

    

       if (isActive !== undefined ) {
        where.isActive =isActive 
  
   }
      
  
   const [categories, total] = await this.prisma.client.$transaction([
    this.prisma.client.category.findMany({
      where,
      skip,
       take: limit,
       orderBy: {
    [sortBy]: sortOrder,
  },
          include: {
            _count: {
              select: {
                products: true,
              },
            },
          },
        }),

        this.prisma.client.category.count({
          where,
        }),
      ]);
 
           
       const data = categories.map((category) =>
      this.categoryMapper.toResponseDto(
        category,
        category._count.products,
      ),
    );

    const totalPages = Math.ceil(total / limit);

  return {
  data,
  meta: {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  },
};
  }

         
  async findSlug(slug: string): Promise<CategoryResponseDto> {
    const category =
      await this.prisma.client.category.findUnique({
        where: { slug },
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      });

    if (!category) {
      throw new NotFoundException(
        `Category with slug ${slug} not found`,
      );
    }

    return this.categoryMapper.toResponseDto(
      category,
      category._count.products,
    );
    
}

 async findOne(id: string): Promise<CategoryResponseDto> {
    const category =
      await this.prisma.client.category.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      });

    if (!category) {
      throw new NotFoundException(
        `Category with ID ${id} not found`,
      );
    }

    return this.categoryMapper.toResponseDto(
      category,
      category._count.products,
    );
    
}



async update(
  id: string,
  updateCategoryDto: UpdateCategoryDto,
): Promise<CategoryResponseDto> {

  const existingCategory =
    await this.prisma.client.category.findUnique({
      where: { id },
    });

  if (!existingCategory) {
    throw new NotFoundException(
      'Category not found',
    );
  }

  let slug: string | undefined;

  if (updateCategoryDto.name) {

    slug = slugify(updateCategoryDto.name, {
      lower: true,
      strict: true,
      trim: true,
    });

    const existing =
      await this.prisma.client.category.findFirst({
        where: {
          OR: [
            { name: updateCategoryDto.name },
            { slug },
          ],
          NOT: {
            id,
          },
        },
      });

    if (existing) {
      throw new ConflictException(
        'Category already exists',
      );
    }
  }

  const updatedCategory =
    await this.prisma.client.category.update({
      where: {
        id,
      },
      data: {
        ...updateCategoryDto,
        ...(slug && { slug }),
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

  return this.categoryMapper.toResponseDto(
    updatedCategory,
    updatedCategory._count.products,
  );
}


    async remove(id: string): Promise<{ message: string }> {
 const category =   await this.prisma.client.category.findUnique({
  where:{
    id ,
     select: { id: true },
  }
})


       if (!category) {
      throw new NotFoundException(
        `Category with ID ${id} not found`,
      );
    } 

        await this.prisma.client.category.delete({
      where: { id },
    });

    return {
      message: 'Category deleted successfully',
    };
  }

   
  private generateSlug(name: string): string {
    return slugify(name, {
      lower: true,
      strict: true,
      trim: true,
    });
  }



}
