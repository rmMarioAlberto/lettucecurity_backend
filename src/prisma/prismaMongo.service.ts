import { PrismaClient } from "../generated/prismaMongo/client";
import { OnModuleInit, OnModuleDestroy, Injectable } from '@nestjs/common';

@Injectable()
export class PrismaServiceMongo extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}