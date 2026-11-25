import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RolesGuard } from 'src/common/guards/auth-roles.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CategoryResponseDto } from './dto/Category-Response.dto';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/user-decorator';
import { PaginatedCategoryResponseDto } from './dto/paginated-category-response.dto';
import { CategoryQueryDto } from './dto/category-query.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('jwt-auth')
  @ApiOperation({ summary: 'create a new category' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({
    status: 201,
    description: 'The category has been successfully created.',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'forbidden.' })
  create(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.categoriesService.create(createCategoryDto);
  }


@Get()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth('jwt-auth')
@ApiOperation({ summary: 'Get all categories' })

 @ApiOkResponse({
    description: 'List of categories retrieved successfully.',
    type: PaginatedCategoryResponseDto, 
  })
@ApiResponse({
  status: 401,
  description: 'Unauthorized.',
})
@ApiResponse({
  status: 403,
  description: 'Forbidden.',
})
getAll(@Query() query: CategoryQueryDto): Promise<PaginatedCategoryResponseDto> {
 
  return this.categoriesService.findAll(query);
}


@Get(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth('jwt-auth')
@ApiOperation({ summary: 'Get category by ID' })
@ApiParam({
  name: 'id',
  description: 'Category UUID',
  example: '550e8400-e29b-41d4-a716-446655440000',
})
@ApiOkResponse({
  description: 'Category retrieved successfully.',
  type: CategoryResponseDto,
})
@ApiResponse({
  status: 400,
  description: 'Invalid UUID.',
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized.',
})
@ApiResponse({
  status: 403,
  description: 'Forbidden.',
})
@ApiResponse({
  status: 404,
  description: 'Category not found.',
})
getOne(
  @Param('id', ParseUUIDPipe) id: string,
): Promise<CategoryResponseDto> {
  return this.categoriesService.findOne(id);
}


@Get('slug/:slug')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth('jwt-auth')
@ApiOperation({ summary: 'Get category by slug' })
@ApiParam({
  name: 'slug',
  description: 'Category slug',
  example: 'electronics',
})
@ApiOkResponse({
  description: 'Category retrieved successfully.',
  type: CategoryResponseDto,
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized.',
})
@ApiResponse({
  status: 403,
  description: 'Forbidden.',
})
@ApiResponse({
  status: 404,
  description: 'Category not found.',
})
getBySlug(
  @Param('slug') slug: string,
): Promise<CategoryResponseDto> {
  return this.categoriesService.findSlug(slug);
}


@Patch(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth('jwt-auth')
@ApiOperation({ summary: 'Update category' })
@ApiParam({
  name: 'id',
  description: 'Category UUID',
})
@ApiOkResponse({
  description: 'Category updated successfully',
  type: CategoryResponseDto,
})
update(
  @Param('id', ParseUUIDPipe) id: string,
  @Body() updateCategoryDto: UpdateCategoryDto,
): Promise<CategoryResponseDto> {
  return this.categoriesService.update(id, updateCategoryDto);
}



@Delete(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth('jwt-auth')
@ApiOperation({ summary: 'Delete category' })
@ApiParam({
  name: 'id',
  description: 'Category UUID',
  example: '550e8400-e29b-41d4-a716-446655440000',
})
@ApiOkResponse({
  description: 'Category deleted successfully.',
})
@ApiResponse({
  status: 400,
  description: 'Invalid UUID.',
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized.',
})
@ApiResponse({
  status: 403,
  description: 'Forbidden.',
})
@ApiResponse({
  status: 404,
  description: 'Category not found.',
})
remove(
  @Param('id', ParseUUIDPipe) id: string,
): Promise<{ message: string }> {
  return this.categoriesService.remove(id);
}
}
