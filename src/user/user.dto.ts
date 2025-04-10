import { IsString, IsDate, IsEmail } from "@nestjs/class-validator";

export class UserDto {

    @IsString()
    id: string;

    @IsString()
    name: string;

    @IsString()
    surname: string;

    @IsEmail()
    email: string;

    @IsDate()
    createdAt: Date

}