import { Controller, Get, HttpCode, HttpStatus, UseGuards } from "@nestjs/common";
import { SensorsService } from "./sensors.service";
import { AuthGuard } from "../auth/guards/auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorator/roles.decorator";

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