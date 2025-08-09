import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ValidRoles } from '../interfaces/valid-roles';
import { UserRoleGuard } from '../guards/user-role/user-role.guard';
import { AuthGuard } from '../strategies/authguard';
import { RolesProtected } from './roles-protected.decorator';

export function Auth(...roles: ValidRoles[]) {
    return applyDecorators(
        RolesProtected(...roles),
        UseGuards(AuthGuard, UserRoleGuard),
    );
}