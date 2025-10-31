import { 
    IsEmail,
    isNotEmpty,
    IsNotEmpty,
    IsString,
 } from "class-validator";

export class AccessLoginDto {

    @IsNotEmpty()
    @IsEmail()
    @IsString()
    correo : string;

    @IsNotEmpty()
    @IsString()
    contra : string;
}

export class AccessLogoutDto {
    @IsNotEmpty()
    @IsString()
    refreshToken : string
}

export class AccessRefreshTokenDto {
    @IsNotEmpty()
    @IsString()
    refreshToken : string
}