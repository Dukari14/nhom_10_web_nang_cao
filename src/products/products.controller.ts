import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Products } from './products.entity';

@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // GET /products
  @Get()
  findAll(): Promise<Products[]> {
    return this.productsService.findAll();
  }

  // GET /products/:id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Products> {
    return this.productsService.findOne(id);
  }

  // POST /products
  @Post()
  create(@Body() productData: Partial<Products>): Promise<Products> {
    return this.productsService.create(productData);
  }

  // DELETE /products/:id
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.productsService.remove(id);
  }
}