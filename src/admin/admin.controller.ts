import { Controller, Get, Param } from "@nestjs/common";
import { AdminService } from "./admin.service";

@Controller('admins')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get(':id')
    async getAdminById(@Param('id') id: string) {
        return this.adminService.getAdminById(id)
    }
}