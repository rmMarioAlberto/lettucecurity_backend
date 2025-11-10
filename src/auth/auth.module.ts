import { Module } from "@nestjs/common";
import { AuthGuard } from "./guards/auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { TokensModule } from "src/tokens/tokens.module";
import { AuthIotGuard } from "./guards/authIot.guard";

@Module({
    imports: [TokensModule],
    providers: [AuthGuard,RolesGuard,AuthIotGuard],
    exports : [AuthGuard, RolesGuard,AuthIotGuard]
})
export class AuthModule {

}