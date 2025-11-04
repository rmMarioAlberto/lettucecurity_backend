import { IsNotEmpty, IsNumber, IsPositive } from "class-validator";

export class GetCultivoDto {

    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    idCultivo : number
}