import { Controller, UseGuards } from "@nestjs/common";
import { AuthGuard } from "src/auth/guards/auth.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { IotService } from "./iot.service";

@Controller('iot')
@UseGuards(AuthGuard,RolesGuard)
export class IotController {

    constructor(
        private iotService : IotService
    ){}
    
}