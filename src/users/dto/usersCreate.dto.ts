import { 
    IsNotEmpty,
    IsString,
    IsNumber,
    IsEmail
} from "class-validator";


export class CreateUserDto {

    @IsNotEmpty()
    @IsString()
    username: string;

    @IsNotEmpty()
    @IsString()
    @IsEmail()
    correo: string

    @IsNotEmpty()
    @IsString()
    contra: string;

    @IsNotEmpty()
    @IsString()
    nombre: string;

    @IsNotEmpty()
    @IsString()
    apellido: string;

    @IsNotEmpty()
    @IsNumber()
    tipo_usuario: number;
}


// model usuario {
//   id_usuario   Int      @id(map: "pk_usuario") @default(autoincrement())
//   username     String   @db.VarChar(50)
//   correo       String   @unique @db.VarChar(100)
//   contra       String   @db.VarChar(255)
//   nombre       String?  @db.VarChar(50)
//   apellido     String?  @db.VarChar(50)
//   tipo_usuario Int
//   status       Int?     @default(1)
//   sesion       sesion[]
// }
