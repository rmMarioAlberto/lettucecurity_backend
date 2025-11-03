import { Controller, Get, HttpCode, HttpStatus, UseGuards } from "@nestjs/common";
import { SensorsService } from "./sensors.service";
import { AuthGuard } from "src/auth/guards/auth.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { Roles } from "src/auth/decorator/roles.decorator";

@Controller('/sensors')
@UseGuards(AuthGuard,RolesGuard)
export class SensorsController {
    
    constructor(private readonly Sensor: SensorsService) {}

    @Get('/allSensors')
    @Roles('admin')
    @HttpCode(HttpStatus.OK)
    async getAllSensors() {
        return await this.Sensor.getAllSensors();
    }

}