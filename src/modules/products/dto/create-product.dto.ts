import { ApiProperty } from "@nestjs/swagger";
 import {
    
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  max,
  MaxLength,
  Min,
  
} from 'class-validator';
import { Type } from 'class-transformer';
export class CreateProductDto {

@ApiProperty({
    example: 'Product Name',
    description: 'The name of the product',
     minLength: 3,
     maxLength: 50,
     }) 
   @IsString()
   @IsNotEmpty()
   @Length(3, 50) 
   @MaxLength(50) 
name!: string;


@ApiProperty({
    example: 'Product Description',
    description: 'The description of the product',
     minLength: 10,
     maxLength: 200,
     })
@IsOptional()

description?: string;


@ApiProperty({
    example: 19.99,
    description: ' product price in USD',
     minimum: 0,
     })

     @IsNumber({
        maxDecimalPlaces: 2,
     })
     @Min(0)
     @Type(() => Number)
price!: number;



@ApiProperty({
    example:5,
    description:'The stock of the product' ,
    maximum: 1000,
})
  @IsNumber()
  @Min(0)
  @Type(() => Number)
stock!: number
 
 
@ApiProperty({
    example: 'SKU12345',
    description: 'The SKU (Stock Keeping Unit) of the product',
    minLength: 3,
    maxLength: 20,
  })
  @IsString()
    @IsNotEmpty()
   @MaxLength(20)
sku!:string
  
@ApiProperty({
    example: 'https://example.com/product-image.jpg',
    description: 'The URL of the product image',
    maxLength: 200,
    required: false,

})
    @IsString()
    @IsOptional()
    @MaxLength(200)
 
imageUrl?: string;

 
@ApiProperty({
    example: 'Electronics',
    description: 'The category of the product',
    minLength: 3,
    maxLength: 50,
    required: true,
  })
    @IsString()
    @IsNotEmpty()
    @Length(3, 50)
    @MaxLength(50)

categoryId!: string

  
@ApiProperty({
    example: true,
    description: 'Indicates whether the product is active or not',
    required: true,
    default: true,
  })
    @IsBoolean()

isActive!: boolean;
}









