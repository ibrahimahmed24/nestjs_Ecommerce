import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()

export class ProductsService {
  constructor(    private readonly prisma: PrismaService,
  ){}
  async create(createProductDto: CreateProductDto): Promise<any> {
    const { id, name, description, price, stock } = createProductDto;
    const product = await this.prisma.client.product.findUnique({
      where: {
        id: id,
      },
    });
    if (product) {
      throw new Error('Product already exists');
    }
  
    const createproduct =  await this.prisma.client.product.create({
      data: {
        createProductDto
      }
    });

    return createproduct;

  }

  findAll() {
    return `This action returns all products`;
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
