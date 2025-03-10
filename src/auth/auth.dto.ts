export class RegisterDto {
  name: string;
  surname: string;
  email: string;
  password: string;
  userType: string;
}

export class LoginDto {
  email: string;
  password: string;
}