import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { validate as isUuid } from 'uuid'
import { ProductImage } from './entities/product-image.entity';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger("ProductsService")

  constructor(@InjectRepository(Product)
  private readonly _productRepository: Repository<Product>,
    @InjectRepository(ProductImage) private readonly _productImageRepository: Repository<ProductImage>,
    private readonly dataSource: DataSource

  ) { }

  async create(createProductDto: CreateProductDto, user: User) {
    try {
      const { images = [], ...productDetails } = createProductDto;

      const product = this._productRepository.create({
        ...productDetails,
        user,
        images: images.map(image =>
          this._productImageRepository.create({ url: image }))

      });
      await this._productRepository.save(product);
      return { ...product, images };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    try {
      const { limit = 10, offset = 0 } = paginationDto;
      const products = await this._productRepository.find({
        take: limit,
        skip: offset,
        // TODO Relaciones
        relations: {
          images: true
        }
      });
      return products.map(product => ({
        ...product,
        images: product.images.map(img => img.url)
      }));
    } catch (error) {
      this.handleDBExceptions(error);
    }

  }

  async findOne(term: string) {
    try {
      let product;
      if (isUuid(term)) {
        product = await this._productRepository.findOneByOrFail({ id: term });
      } else {
        const queryBuilder = this._productRepository.createQueryBuilder('prod');
        product = await queryBuilder.where(`UPPER(title) =:title or slug =:slug`, {
          title: term.toUpperCase(),
          slug: term.toLowerCase()
        })
          .leftJoinAndSelect('prod.images', 'proImages')
          .getOne();
      }

      return product;
    } catch (error) {
      throw new NotFoundException(`No se encontro ningun articulo con el termino: ${term}`)

    }

  }

  async update(id: string, updateProductDto: UpdateProductDto, user: User) {
    const { images = [], ...productDetails } = updateProductDto;

    const product = await this._productRepository.preload({
      id,
      ...productDetails
    });
    if (!product) throw new NotFoundException(`Producro con id ${id} no existe`);

    // create queryRunner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {


      if (images.length) {
        await queryRunner.manager.delete(ProductImage, { product: { id } });
        product.images = images.map(image => this._productImageRepository.create({ url: image }))
      }
      product.user = user;
      await queryRunner.manager.save(product);
      await queryRunner.commitTransaction();
      await queryRunner.release();
      return this.findOnePlain(id)
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.handleDBExceptions(error);
    }

  }

  async remove(id: string) {
    await this.findOne(id);
    await this._productRepository.delete({ id })
    return `Se elimino el producto con id: ${id}`;

  }

  async findOnePlain(term: string) {
    const { images = [], ...rest } = await this.findOne(term);
    return {
      ...rest,
      images: images.map((img) => img.url)
    }
  }

  async removeAll() {
    const query = this._productRepository.createQueryBuilder('product');
    try {
      return await query.delete().where({}).execute()
    } catch (error) {
      this.handleDBExceptions(error)
    }
  }

  private handleDBExceptions(error: any) {
    this.logger.error(error.code)
    this.logger.error(error)
    if (error.code === '23505')
      throw new BadRequestException(error.detail);
    throw new InternalServerErrorException('Unespected error, check server logs');
  }

}
