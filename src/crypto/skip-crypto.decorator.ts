import { SetMetadata } from '@nestjs/common';

export const SKIP_CRYPTO_KEY = 'skipCrypto';
export const SkipCrypto = () => SetMetadata(SKIP_CRYPTO_KEY, true);
