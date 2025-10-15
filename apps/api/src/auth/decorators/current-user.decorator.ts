import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserDto } from '../dto';

export const CurrentUser = createParamDecorator(
  (data: keyof UserDto | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
