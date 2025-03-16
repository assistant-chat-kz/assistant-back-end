import { Controller, Get, Param } from "@nestjs/common";
import { PsychologistService } from "./psychologist.service";

@Controller('psychologists')
export class PsychologistController {
    constructor(private readonly psychologistService: PsychologistService) { }

    @Get()
    async getAll() {
        return this.psychologistService.getAll()
    }

    @Get(':id')
    async getUserById(@Param('id') id: string) {
        return this.psychologistService.getPsychologistById(id);
    }
}