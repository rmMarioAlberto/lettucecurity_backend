import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaServiceMongo } from '../prisma/prismaMongo.service';
import axios from 'axios';

interface Reading {
  temperatura: number;
  humedad: number;
}

@Injectable()
export class PredictionService {
  constructor(private readonly prismaMongo: PrismaServiceMongo) {}

  async predictWeather(parcelaId: number) {
    // 1. Obtener lecturas reales de la BD
    const readings = await this.getLastWeekReadings(parcelaId);

    // 2. Completar si faltan datos
    const completeReadings = this.fillMissingReadings(readings, 168);

    // 3. Formatear para la API
    const historicalData = completeReadings.map((r) => ({
      temperatura: r.temperatura,
      humedad: r.humedad,
    }));

    // 4. Llamar a Railway LSTM
    const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';
    const ML_API_KEY = process.env.ML_API_KEY || 'dev-key-12345';

    const response = await axios.post(
      `${ML_API_URL}/api/predict/lstm`,
      { historical_data: historicalData },
      {
        headers: {
          'X-API-Key': ML_API_KEY,
          'Content-Type': 'application/json',
        },
      },
    );

    // 5. Calcular fecha de predicción (7 días adelante)
    const predictionDate = new Date();
    predictionDate.setDate(predictionDate.getDate() + 7);

    // 6. Retornar con información de calidad
    return {
      ...response.data,
      fecha_prediccion: predictionDate.toISOString(),
      data_quality: {
        real_readings: readings.length,
        synthetic_readings: 168 - readings.length,
        quality_score: readings.length / 168,
        message: this.getQualityMessage(readings.length),
      },
    };
  }

  private async getLastWeekReadings(parcelaId: number): Promise<Reading[]> {
    // Obtener ciclo activo
    const activeCycle = await this.prismaMongo.parcela_cycles.findFirst({
      where: {
        id_parcela: parcelaId,
        endDate: null,
      },
    });

    if (!activeCycle) {
      throw new NotFoundException(
        `No se encontró un ciclo activo para la parcela ${parcelaId}`,
      );
    }

    // Obtener etapa actual
    const currentStage = activeCycle.stages[activeCycle.current_stage_index];

    if (!currentStage || !currentStage.readings) {
      return [];
    }

    // Extraer temperatura y humedad de las últimas 168 lecturas
    // Nota: Asumimos que id_sensor 1 = temperatura, id_sensor 2 = humedad
    // Ajusta estos IDs según tu configuración real
    const readings: Reading[] = currentStage.readings
      .slice(-168)
      .map((reading) => {
        const tempReading = reading.sensorReadings.find(
          (s) => s.id_sensor === 1, // ID del sensor de temperatura
        );
        const humReading = reading.sensorReadings.find(
          (s) => s.id_sensor === 2, // ID del sensor de humedad
        );

        return {
          temperatura: tempReading?.lectura || 22,
          humedad: humReading?.lectura || 65,
        };
      });

    return readings;
  }

  private fillMissingReadings(
    existingReadings: Reading[],
    targetCount: number = 168,
  ): Reading[] {
    if (existingReadings.length >= targetCount) {
      return existingReadings.slice(-targetCount);
    }

    const missing = targetCount - existingReadings.length;

    // Caso 1: Sin datos - usar patrón diurno realista
    if (existingReadings.length === 0) {
      return this.generateRealisticPattern(targetCount);
    }

    // Caso 2: Pocos datos - extender con patrón basado en promedios
    const avgTemp =
      existingReadings.reduce((sum, r) => sum + r.temperatura, 0) /
      existingReadings.length;
    const avgHum =
      existingReadings.reduce((sum, r) => sum + r.humedad, 0) /
      existingReadings.length;

    const syntheticData = this.generateRealisticPattern(
      missing,
      avgTemp,
      avgHum,
    );

    // Combinar: datos sintéticos primero, luego datos reales
    return [...syntheticData, ...existingReadings];
  }

  private generateRealisticPattern(
    count: number,
    baseTemp: number = 22,
    baseHum: number = 65,
  ): Reading[] {
    const data: Reading[] = [];

    for (let hour = 0; hour < count; hour++) {
      const hourOfDay = hour % 24;

      // Patrón diurno de temperatura (pico al mediodía)
      const tempVariation = Math.sin(((hourOfDay - 6) * Math.PI) / 12) * 2.5;
      const temperatura =
        baseTemp + tempVariation + (Math.random() - 0.5) * 0.8;

      // Patrón inverso de humedad (alta en la noche)
      const humVariation = -Math.sin(((hourOfDay - 6) * Math.PI) / 12) * 4;
      const humedad = baseHum + humVariation + (Math.random() - 0.5) * 3;

      data.push({
        temperatura: Math.round(temperatura * 10) / 10,
        humedad: Math.round(humedad * 10) / 10,
      });
    }

    return data;
  }

  private getQualityMessage(realReadings: number): string {
    const percentage = Math.round((realReadings / 168) * 100);

    if (realReadings === 0) {
      return 'Predicción basada en datos sintéticos (patrón típico de lechuga)';
    } else if (realReadings < 84) {
      // < 50%
      return `Predicción basada en ${percentage}% de datos reales (baja confianza)`;
    } else if (realReadings < 134) {
      // 50-80%
      return `Predicción basada en ${percentage}% de datos reales (confianza media)`;
    } else {
      // > 80%
      return `Predicción basada en ${percentage}% de datos reales (alta confianza)`;
    }
  }
}
