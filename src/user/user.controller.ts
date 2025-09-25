import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserDto } from "./user.dto";
import { UserNoAuth } from "@prisma/client";

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get()
    async getAll() {
        return this.userService.getAll()
    }

    @Get('/noAuth')
    async getAllUsersNoAuth() {
        return this.userService.getAllUsersNoAuth()
    }

    @Get(':id')
    async getUserById(@Param('id') id: string) {
        return this.userService.getUserById(id);
    }

    // @Put(':id')
    // async verifyUser(@Param('id') id: string) {
    //     return this.userService.verifyUser(id)
    // }

    @Put(':id/visit')
    async visitUser(@Param('id') id: string) {
        return this.userService.visitUser(id);
    }
    @Put(':id')
    async updateUser(
        @Param('id') id: string,
        @Body() data: Partial<UserDto> | Partial<UserNoAuth>,
    ) {
        return this.userService.updateUser(id, data);
    }


}