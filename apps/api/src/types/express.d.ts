import { UserDto } from '../auth/dto';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends UserDto {}
  }
}
