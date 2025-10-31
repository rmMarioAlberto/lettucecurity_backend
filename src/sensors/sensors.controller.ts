import { Controller, Post } from "@nestjs/common";
import { SensorsService } from "./sensors.service";

@Controller('/sensors')
export class SensorsController {
    
    constructor(private readonly Sensor: SensorsService) {}

    @Post('/allSensors')
    getAllSensors() {
        return this.Sensor.getAllSensors();
    }

}