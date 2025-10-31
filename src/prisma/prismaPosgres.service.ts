import { PrismaClient } from "../generated/prismaPostgres/client";
import { OnModuleInit, OnModuleDestroy, Injectable } from '@nestjs/common';

@Injectable()
export class PrismaServicePostgres extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}