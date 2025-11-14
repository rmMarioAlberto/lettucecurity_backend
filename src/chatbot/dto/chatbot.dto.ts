import { IsNotEmpty, IsNumber, IsString, Min } from "class-validator";

export class ChatBotMessage {
    @IsNumber()
    @Min(1)
    @IsNotEmpty()
    idParcela : number

    @IsString ()
    @IsNotEmpty()
    message : string
}

export class GetChatDto {

    @IsNumber()
    @Min(1)
    @IsNotEmpty()
    idParcel : number
}