import {
  Controller, Get, Post, Body, Patch, Param, Delete, Request,
  UseGuards,
  SetMetadata
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthGuard } from './strategies/authguard';
import { GetUser } from './decorators/get-user.decorator';
import { User } from './entities/user.entity';
import { GetRowHeaders } from './decorators/get-raw-headers.decorator';
import { UserRoleGuard } from './guards/user-role/user-role.guard';
import { RolesProtected } from './decorators/roles-protected.decorator';
import { ValidRoles } from './interfaces/valid-roles';
import { Auth } from './decorators/auth.decorator';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }
  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.authService.loginUser(loginUserDto);
  }

  @Get('checkToken')
  @Auth()
  checkAuthStatus(
    @GetUser() user: User
  ) {
    return this.authService.checkAuthStatus(user)
  }

  @Get('private')
  @UseGuards(AuthGuard)
  TestingPrivateRoute(
    @GetUser() user: User,
    @GetUser('email') userEmail: User,
    @GetRowHeaders() rawHeaders: string[]
  ) {
    return {
      ok: true,
      message: 'Success',
      user,
      userEmail,
      rawHeaders
    }
  }

  @Get('private2')
  @RolesProtected(ValidRoles.superUser)
  @UseGuards(AuthGuard, UserRoleGuard)
  TestingPrivateRoute2(
    @GetUser() user: User,
    @GetUser('email') userEmail: User,
  ) {
    return {
      ok: true,
      message: 'Success',
      user,
      userEmail,
    }
  }

  @Get('private3')
  @Auth(ValidRoles.admin, ValidRoles.superUser, ValidRoles.user)
  TestingPrivateRoute3(
    @GetUser() user: User,
  ) {
    return {
      ok: true,
      user,
    }
  }
}
