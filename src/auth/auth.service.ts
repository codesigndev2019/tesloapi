import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt'
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';


@Injectable()
export class AuthService {

  constructor(@InjectRepository(User) private readonly userRepository: Repository<User>, private jwtService: JwtService) { }

  async create(createUserDto: CreateUserDto) {

    try {
      const { password, ...userData } = createUserDto;
      const user = this.userRepository.create({ ...userData, password: this.hashPassword(password) });
      await this.userRepository.save(user);
      delete user.password;
      const payload = { id: user.id };

      return {
        ...user,
        access_token: await this.jwtService.signAsync(payload),
      };
    } catch (error) {
      console.log(error)
      this.handleDBErrors(error)
    }

  }

  async loginUser(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;
    const user = await this.userRepository.findOne({
      where: { email },
      select: { email: true, password: true, id: true }
    });
    if (!user) throw new UnauthorizedException('The user does not exist.')
    if (!bcrypt.compareSync(password, user.password)) throw new BadRequestException('The password or email is incorrect, check and try again');
    const payload = { id: user.id };
    return {
      ...user,
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async checkAuthStatus(user: User) {
    return {
      ...user,
      token: await this.getJwt(user.id)
    }
  }

  private async getJwt(id: string) {
    const token = await this.jwtService.signAsync({ id })
    return token
  }

  private hashPassword(password: string): string {
    return bcrypt.hashSync(password, 10);
  }


  private handleDBErrors(errors: any): never {
    if (errors.code === '23505') {
      throw new BadRequestException('The email you are trying to register already exists.')
    }
    throw new BadRequestException("There's an error, plese check the server logs")
  }

}
