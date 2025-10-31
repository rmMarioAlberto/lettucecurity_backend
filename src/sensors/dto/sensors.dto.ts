import { 
    IsNotEmpty,
    IsString,
} from "class-validator";

export class CreateSensorDto {
    @IsNotEmpty()
    @IsString()
    id: string;

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsNotEmpty()
    @IsString()
    name: string;
}


// model SensorType {
//   id          String   @id @default(auto()) @map("_id") @db.ObjectId
//   createdAt   DateTime @db.Date
//   description String
//   name        String   @unique
// }
