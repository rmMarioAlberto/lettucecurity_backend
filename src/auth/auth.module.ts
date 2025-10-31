import { Module } from "@nestjs/common";
import { AuthGuard } from "./guards/auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { TokensModule } from "src/tokens/tokens.module";

@Module({
    imports: [TokensModule],
    providers: [AuthGuard,RolesGuard],
    exports : [AuthGuard, RolesGuard]
})
export class AuthModule {

}