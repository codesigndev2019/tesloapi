import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';
import * as bcrypt from 'bcrypt'
import { initialData } from './data/seed-data';
import { User } from 'src/auth/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';


@Injectable()
export class SeedService {

  constructor(private readonly productService: ProductsService, @InjectRepository(User) private readonly userRepository: Repository<User>) { }

  async runSeed() {
    await this.deleteTables()
    const user = await this.insertUsers();
    await this.insertNewProducts(user);
    return `Seed executed`;
  }

  private async deleteTables() {
    await this.productService.removeAll();
    const queryBuilder = this.userRepository.createQueryBuilder();
    await queryBuilder.delete().where({}).execute()
  
  }

  private async insertUsers() {
    const seedUsers = initialData.users;
    const users: User[] = [];
    seedUsers.forEach(user => {
      console.log(JSON.stringify({...user,password: this.hashPassword(user.password) }))
      const {password, ...resto} = user;
      users.push(this.userRepository.create({...resto,password: this.hashPassword(password) }))
    });
    const dbUsers = await this.userRepository.save(users)

    return dbUsers[0];
  }

  private async insertNewProducts(user: User) {
    await this.productService.removeAll();
    const products = initialData.products;
    const insertPromises = [];
    products.forEach(product => {
      insertPromises.push(this.productService.create(product, user))
    })
    await Promise.all(insertPromises);


    return true

  }

  private hashPassword(password: string): string {
    return bcrypt.hashSync(password, 10);
  }

}
