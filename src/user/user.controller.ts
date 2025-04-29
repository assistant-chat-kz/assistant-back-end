import { Controller, Get, Param, Put } from "@nestjs/common";
import { UserService } from "./user.service";

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get()
    async getAll() {
        return this.userService.getAll()
    }

    @Get(':id')
    async getUserById(@Param('id') id: string) {
        return this.userService.getUserById(id);
    }

    @Put(':id')
    async verifyUser(@Param('id') id: string) {
        return this.userService.verifyUser(id)
    }

}