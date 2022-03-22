import { ImmutableObject } from 'jimu-core';

export interface Config {
    x: number;
    y: number;
    hsrGrad: number;
    radiusKm: number;
}

export type IMConfig = ImmutableObject<Config>;
