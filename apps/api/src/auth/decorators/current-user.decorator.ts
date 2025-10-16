import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { UserDto } from '../dto';

export const CurrentUser = createParamDecorator(
  (data: keyof UserDto | undefined, ctx: ExecutionContext): UserDto | UserDto[keyof UserDto] | undefined => {
    const request = ctx.switchToHttp().getRequest<Express.Request>();
    const user = request.user;

    if (data && user) {
      return user[data];
    }
    return user;
  },
);
